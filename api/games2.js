require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');

// Use singleton pattern to avoid "too many clients" error
let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_PRISMA_URL,
      ssl: {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined
      },
      max: 1
    });
  }
  return pool;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pool = getPool();

  try {
    switch (req.method) {
      case 'GET': {
        const { date, all, player } = req.query;
        
        if (all === 'true') {
          // Get all games for achievements
          let result;
          if (player) {
            result = await pool.query(
              `SELECT date, player, difficulty, time, errors, score, hints, completed_at
              FROM individual_games
              WHERE player = $1
              ORDER BY date DESC, difficulty`,
              [player]
            );
          } else {
            result = await pool.query(
              `SELECT date, player, difficulty, time, errors, score, hints, completed_at
              FROM individual_games
              ORDER BY date DESC, player, difficulty`
            );
          }
          return res.status(200).json(result.rows);
        }
        
        // Get today's progress
        const result = await pool.query(
          `SELECT player, difficulty, time, errors, score, hints
          FROM individual_games
          WHERE date = $1
          ORDER BY player, difficulty`,
          [date]
        );

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
              hints: game.hints
            };
          }
        });

        return res.status(200).json(progress);
      }

      case 'POST': {
        const { player, date, difficulty, time, errors, score, hints } = req.body;

        await pool.query(
          `INSERT INTO individual_games (player, date, difficulty, time, errors, score, hints)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (player, date, difficulty)
          DO UPDATE SET
            time = $4,
            errors = $5,
            score = $6,
            hints = $7,
            updated_at = NOW()`,
          [player, date, difficulty, time, errors || 0, score || 0, hints || 0]
        );

        return res.status(200).json({ success: true });
      }

      case 'DELETE': {
        const { date: deleteDate, all } = req.query;

        if (all === 'true') {
          await pool.query('DELETE FROM individual_games');
        } else if (deleteDate) {
          await pool.query('DELETE FROM individual_games WHERE date = $1', [deleteDate]);
        } else {
          return res.status(400).json({ error: 'Date or all=true required' });
        }

        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Games API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
