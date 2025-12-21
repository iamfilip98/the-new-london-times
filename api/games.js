require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
// Validation removed to fix Vercel deployment issues

const pool = new Pool({
  connectionString: process.env.POSTGRES_PRISMA_URL,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  },
  max: 2,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 10000,
  maxUses: 100,
  acquireTimeoutMillis: 5000
});

// Helper function to execute SQL queries
async function query(text, params = []) {
  const result = await pool.query(text, params);
  return { rows: result.rows };
}

async function initDatabase() {
  try {
    // Create individual games table for daily progress tracking
    await query(`
      CREATE TABLE IF NOT EXISTS individual_games (
        id SERIAL PRIMARY KEY,
        player VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        difficulty VARCHAR(10) NOT NULL,
        time INTEGER,
        errors INTEGER DEFAULT 0,
        score DECIMAL(10,2) DEFAULT 0,
        hints INTEGER DEFAULT 0,
        hint_level1_count INTEGER DEFAULT 0,
        hint_level2_count INTEGER DEFAULT 0,
        hint_level3_count INTEGER DEFAULT 0,
        bonus_type VARCHAR(20),
        completed_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(player, date, difficulty)
      )
    `);

    // ⚡ PERFORMANCE: Add indexes for frequently queried columns
    await query(`
      CREATE INDEX IF NOT EXISTS idx_games_player_date
      ON individual_games(player, date)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_games_date
      ON individual_games(date)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_games_player_difficulty
      ON individual_games(player, difficulty)
    `);

    return true;
  } catch (error) {
    console.error('Failed to initialize games database:', error);
    throw error;
  }
}

async function saveGame(player, date, difficulty, gameData) {
  try {
    const {
      time,
      errors,
      score,
      hints,
      hintLevel1Count,
      hintLevel2Count,
      hintLevel3Count,
      bonusType
    } = gameData;

    await query(
      `INSERT INTO individual_games (
        player, date, difficulty, time, errors, score, hints,
        hint_level1_count, hint_level2_count, hint_level3_count, bonus_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (player, date, difficulty)
      DO UPDATE SET
        time = $4,
        errors = $5,
        score = $6,
        hints = $7,
        hint_level1_count = $8,
        hint_level2_count = $9,
        hint_level3_count = $10,
        bonus_type = $11,
        updated_at = NOW()`,
      [player, date, difficulty, time, errors || 0, score || 0, hints || 0,
       hintLevel1Count || 0, hintLevel2Count || 0, hintLevel3Count || 0, bonusType || null]
    );

    return true;
  } catch (error) {
    console.error('Failed to save game:', error);
    throw error;
  }
}

async function getGamesByDate(date) {
  try {
    const result = await query(
      `SELECT player, difficulty, time, errors, score, hints, completed_at,
             hint_level1_count, hint_level2_count, hint_level3_count, bonus_type
      FROM individual_games
      WHERE date = $1
      ORDER BY player, difficulty`,
      [date]
    );

    return result.rows;
  } catch (error) {
    console.error('Failed to get games by date:', error);
    throw error;
  }
}

async function getTodayProgress(date) {
  try {
    const result = await query(
      `SELECT player, difficulty, time, errors, score, hints,
             hint_level1_count, hint_level2_count, hint_level3_count, bonus_type
      FROM individual_games
      WHERE date = $1
      ORDER BY player, difficulty`,
      [date]
    );

    // Transform to the format expected by the frontend
    const progress = {
      faidao: { easy: null, medium: null, hard: null },
      filip: { easy: null, medium: null, hard: null }
    };

    result.rows.forEach(game => {
      if (progress[game.player]) {
        progress[game.player][game.difficulty] = {
          time: game.time,
          errors: game.errors,
          score: game.score,
          hints: game.hints,
          hintLevel1Count: game.hint_level1_count,
          hintLevel2Count: game.hint_level2_count,
          hintLevel3Count: game.hint_level3_count,
          bonusType: game.bonus_type
        };
      }
    });

    return progress;
  } catch (error) {
    console.error('Failed to get today progress:', error);
    throw error;
  }
}

async function getAllGames(player) {
  try {
    let result;
    if (player) {
      result = await query(
        `SELECT date, player, difficulty, time, errors, score, hints,
               hint_level1_count, hint_level2_count, hint_level3_count, bonus_type, completed_at
        FROM individual_games
        WHERE player = $1
        ORDER BY date DESC, difficulty`,
        [player]
      );
    } else {
      result = await query(
        `SELECT date, player, difficulty, time, errors, score, hints,
               hint_level1_count, hint_level2_count, hint_level3_count, bonus_type, completed_at
        FROM individual_games
        ORDER BY date DESC, player, difficulty`
      );
    }

    return result.rows.map(game => ({
      date: game.date,
      player: game.player,
      difficulty: game.difficulty,
      time: game.time,
      errors: game.errors,
      score: game.score,
      hints: game.hints,
      hintLevel1Count: game.hint_level1_count,
      hintLevel2Count: game.hint_level2_count,
      hintLevel3Count: game.hint_level3_count,
      bonusType: game.bonus_type,
      completedAt: game.completed_at
    }));
  } catch (error) {
    console.error('Failed to get all games:', error);
    throw error;
  }
}

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ⚡ REAL-TIME UPDATES: Disable HTTP caching for live battle updates
  // The frontend has its own 5-second cache, but HTTP caching interferes with cross-player visibility
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { date, all, player } = req.query;

        // If 'all' parameter is present, return all games
        if (all) {
          const games = await getAllGames(player || null);
          return res.status(200).json(games);
        }

        // Otherwise return today's progress
        const progress = await getTodayProgress(date);
        return res.status(200).json(progress);
      }

      case 'POST': {
        const { player, date: gameDate, difficulty, ...gameData } = req.body;

        await saveGame(player, gameDate, difficulty, gameData);

        return res.status(200).json({
          success: true,
          message: 'Game saved successfully'
        });
      }

      case 'DELETE': {
        // Delete all games for a specific date or all games
        const { date: deleteDate, all } = req.query;

        if (all === 'true') {
          // Delete ALL games
          await query('DELETE FROM individual_games');
          return res.status(200).json({
            success: true,
            message: 'All games deleted successfully'
          });
        } else if (deleteDate) {
          // Delete games for specific date
          await query('DELETE FROM individual_games WHERE date = $1', [deleteDate]);
          return res.status(200).json({
            success: true,
            message: `Games for ${deleteDate} deleted successfully`
          });
        } else {
          return res.status(400).json({ error: 'Date parameter or all=true is required for deletion' });
        }
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Games API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};