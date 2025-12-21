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

  try {
    const { date } = req.query;
    const pool = getPool();
    
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
  } catch (error) {
    console.error('Games API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
