const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting database initialization...');

    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');

    // Create entries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS entries (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create achievements table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        achievement_id VARCHAR(255) NOT NULL,
        player VARCHAR(50) NOT NULL,
        unlocked_at TIMESTAMP NOT NULL,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(achievement_id, player, unlocked_at)
      )
    `);

    // Create streaks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS streaks (
        id SERIAL PRIMARY KEY,
        player VARCHAR(50) UNIQUE NOT NULL,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Initialize default streak records for both players
    await pool.query(`
      INSERT INTO streaks (player, current_streak, best_streak)
      VALUES ('faidao', 0, 0), ('filip', 0, 0)
      ON CONFLICT (player) DO NOTHING
    `);

    console.log('Database initialization completed successfully');

    return res.status(200).json({
      success: true,
      message: 'Database initialized successfully',
      tables: ['entries', 'achievements', 'streaks']
    });

  } catch (error) {
    console.error('Database initialization failed:', error);
    return res.status(500).json({
      error: 'Database initialization failed',
      details: error.message
    });
  }
};