require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_PRISMA_URL,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  },
  max: 2, // Reduce max connections to avoid hitting limits
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 10000,
  maxUses: 100, // Close connections after this many uses
  acquireTimeoutMillis: 5000 // Timeout when acquiring connections
});

// Helper function to execute SQL queries using template literals
async function sql(strings, ...values) {
  let query = '';
  const params = [];
  let paramIndex = 1;

  for (let i = 0; i < strings.length; i++) {
    query += strings[i];
    if (i < values.length) {
      query += `$${paramIndex}`;
      params.push(values[i]);
      paramIndex++;
    }
  }

  const result = await pool.query(query, params);
  return { rows: result.rows };
}

// Database initialization and helper functions
async function initDatabase() {
  try {
    // Create entries table
    await sql`
      CREATE TABLE IF NOT EXISTS entries (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create achievements table
    await sql`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        achievement_id VARCHAR(255) NOT NULL,
        player VARCHAR(50) NOT NULL,
        unlocked_at TIMESTAMP NOT NULL,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(achievement_id, player, unlocked_at)
      )
    `;

    // Create streaks table
    await sql`
      CREATE TABLE IF NOT EXISTS streaks (
        id SERIAL PRIMARY KEY,
        player VARCHAR(50) UNIQUE NOT NULL,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create challenges table
    await sql`
      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        challenge_id VARCHAR(255) UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Initialize default streak records for both players
    await sql`
      INSERT INTO streaks (player, current_streak, best_streak)
      VALUES ('faidao', 0, 0), ('filip', 0, 0)
      ON CONFLICT (player) DO NOTHING
    `;

    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

function normalizeEntryData(data) {
  const normalized = { date: data.date };

  ['faidao', 'filip'].forEach(player => {
    const playerData = data[player];
    if (!playerData) return;

    // Check if this is old format (has easyErrors, mediumErrors, etc.)
    if (playerData.easyErrors !== undefined || playerData.easy !== undefined) {
      // Convert old format to new format
      normalized[player] = {
        times: {
          easy: playerData.easy ? parseTimeToSeconds(playerData.easy) : null,
          medium: playerData.medium ? parseTimeToSeconds(playerData.medium) : null,
          hard: playerData.hard ? parseTimeToSeconds(playerData.hard) : null
        },
        errors: {
          easy: playerData.easyErrors || 0,
          medium: playerData.mediumErrors || 0,
          hard: playerData.hardErrors || 0
        },
        dnf: {
          easy: false,
          medium: false,
          hard: false
        },
        scores: {
          easy: 0,
          medium: 0,
          hard: 0,
          total: 0
        }
      };

      // Calculate scores for old format entries
      const difficulties = ['easy', 'medium', 'hard'];
      const multipliers = { easy: 1, medium: 1.5, hard: 2 };
      let totalScore = 0;

      difficulties.forEach(difficulty => {
        const time = normalized[player].times[difficulty];
        const errors = normalized[player].errors[difficulty];

        if (time && time > 0) {
          const adjustedTime = time + (errors * 30);
          const adjustedMinutes = adjustedTime / 60;
          const score = (1000 / adjustedMinutes) * multipliers[difficulty];
          normalized[player].scores[difficulty] = Math.round(score * 100) / 100;
          totalScore += normalized[player].scores[difficulty];
        }
      });

      normalized[player].scores.total = Math.round(totalScore * 100) / 100;
    } else {
      // Already in new format
      normalized[player] = playerData;
    }
  });

  return normalized;
}

function parseTimeToSeconds(timeString) {
  if (!timeString || timeString.trim() === '') return null;

  // Handle MM:SS format
  if (timeString.includes(':')) {
    const parts = timeString.split(':');
    if (parts.length !== 2) return null;

    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;

    return minutes * 60 + seconds;
  }

  // Handle raw seconds
  const totalSeconds = parseInt(timeString);
  return isNaN(totalSeconds) ? null : totalSeconds;
}

/**
 * Apply 30% winner bonus to each difficulty level
 * The player with the higher score in each difficulty gets a 30% bonus
 */
function applyWinnerBonuses(player1Scores, player2Scores) {
  // player1Scores and player2Scores are objects: { easy, medium, hard }

  const difficulties = ['easy', 'medium', 'hard'];
  const result1 = { ...player1Scores };
  const result2 = { ...player2Scores };

  difficulties.forEach(diff => {
    if (result1[diff] && result2[diff]) {
      if (result1[diff] > result2[diff]) {
        // Player 1 wins this difficulty
        result1[diff] = Math.round(result1[diff] * 1.3);
      } else if (result2[diff] > result1[diff]) {
        // Player 2 wins this difficulty
        result2[diff] = Math.round(result2[diff] * 1.3);
      }
      // If tied, no bonus for either
    }
  });

  return { player1: result1, player2: result2 };
}

/**
 * Calculate daily winner based on total scores with winner bonuses applied
 */
function calculateDailyWinner(player1Scores, player2Scores) {
  // Apply winner bonuses first
  const bonusedScores = applyWinnerBonuses(player1Scores, player2Scores);

  // Calculate totals
  const p1Total = (bonusedScores.player1.easy || 0) + (bonusedScores.player1.medium || 0) + (bonusedScores.player1.hard || 0);
  const p2Total = (bonusedScores.player2.easy || 0) + (bonusedScores.player2.medium || 0) + (bonusedScores.player2.hard || 0);

  return {
    player1Total: p1Total,
    player2Total: p2Total,
    winner: p1Total > p2Total ? 'player1' : (p2Total > p1Total ? 'player2' : 'tie')
  };
}

async function getAllEntries() {
  try {
    const result = await sql`
      SELECT date, data
      FROM entries
      ORDER BY date DESC
    `;

    return result.rows.map(row => {
      const rawData = {
        date: row.date.toISOString().split('T')[0],
        ...row.data
      };
      return normalizeEntryData(rawData);
    });
  } catch (error) {
    console.error('Failed to get entries:', error);
    throw error;
  }
}

async function saveEntryToDb(date, entryData) {
  try {
    // First, try to get existing entry data
    const existingResult = await sql`
      SELECT data FROM entries WHERE date = ${date}
    `;

    let finalData = entryData;

    if (existingResult.rows.length > 0) {
      // Merge new data with existing data to preserve both players' scores
      const existingData = existingResult.rows[0].data;
      finalData = { ...existingData, ...entryData };

      // Special handling: only update player data if it has meaningful scores
      for (const player of ['faidao', 'filip']) {
        if (entryData[player] && existingData[player]) {
          // If the new data has scores but existing data also has scores, preserve higher total
          const newTotal = entryData[player].scores?.total || 0;
          const existingTotal = existingData[player].scores?.total || 0;

          // Only update if new data has higher scores or existing data is incomplete
          if (newTotal > existingTotal || existingTotal === 0) {
            finalData[player] = entryData[player];
          } else {
            finalData[player] = existingData[player];
          }
        } else if (entryData[player]) {
          // New player data where none existed
          finalData[player] = entryData[player];
        }
        // If entryData[player] is missing, keep existing data
      }
    }

    await sql`
      INSERT INTO entries (date, data)
      VALUES (${date}, ${JSON.stringify(finalData)})
      ON CONFLICT (date)
      DO UPDATE SET
        data = ${JSON.stringify(finalData)},
        updated_at = NOW()
    `;

    return true;
  } catch (error) {
    console.error('Failed to save entry:', error);
    throw error;
  }
}

async function deleteEntryFromDb(date) {
  try {
    await sql`DELETE FROM entries WHERE date = ${date}`;
    return true;
  } catch (error) {
    console.error('Failed to delete entry:', error);
    throw error;
  }
}

module.exports = async function handler(req, res) {
  // Initialize database on first request
  try {
    await initDatabase();
  } catch (error) {
    console.error('Database initialization failed:', error);
    return res.status(500).json({ error: 'Database initialization failed' });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        const entries = await getAllEntries();
        return res.status(200).json(entries);

      case 'POST':
        const { date, faidao, filip, migrate, migrationData } = req.body;

        // Handle migration request
        if (migrate && migrationData) {
          // Simple migration - just save all entries
          if (migrationData.entries && migrationData.entries.length > 0) {
            for (const entry of migrationData.entries) {
              await saveEntryToDb(entry.date, {
                faidao: entry.faidao,
                filip: entry.filip
              });
            }
          }
          return res.status(200).json({ success: true, message: 'Migration completed' });
        }

        // Validate required fields for regular entry
        if (!date || (!faidao && !filip)) {
          return res.status(400).json({ error: 'Date and at least one player data are required' });
        }

        // Only include provided player data
        const entryData = {};
        if (faidao) entryData.faidao = faidao;
        if (filip) entryData.filip = filip;

        await saveEntryToDb(date, entryData);

        return res.status(200).json({
          success: true,
          message: 'Entry saved successfully',
          entry: { date, ...entryData }
        });

      case 'DELETE':
        const { date: deleteDate } = req.query;

        if (!deleteDate) {
          return res.status(400).json({ error: 'Date is required for deletion' });
        }

        await deleteEntryFromDb(deleteDate);
        return res.status(200).json({
          success: true,
          message: 'Entry deleted successfully'
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};