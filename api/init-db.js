require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.POSTGRES_PRISMA_URL,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  },
  max: 3,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 10000
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

    // Test connection
    await pool.query('SELECT NOW()');

    // Create users table for authentication
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        avatar VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Initialize users with passwords from environment variables
    // Trim to remove any trailing newlines or whitespace from env vars
    const faidaoPassword = (process.env.FAIDAO_PASSWORD || 'sudoku2024').trim();
    const filipPassword = (process.env.FILIP_PASSWORD || 'sudoku2024').trim();

    const faidaoHash = await bcrypt.hash(faidaoPassword, 10);
    const filipHash = await bcrypt.hash(filipPassword, 10);

    await pool.query(`
      INSERT INTO users (username, password_hash, display_name, avatar)
      VALUES
        ('faidao', $1, 'Faidao - The Queen', NULL),
        ('filip', $2, 'Filip - The Champion', NULL)
      ON CONFLICT (username)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        display_name = EXCLUDED.display_name,
        updated_at = NOW()
    `, [faidaoHash, filipHash]);

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


    return res.status(200).json({
      success: true,
      message: 'Database and users initialized successfully',
      tables: ['users', 'entries', 'achievements', 'streaks'],
      users: ['faidao', 'filip']
    });

  } catch (error) {
    console.error('Database initialization failed:', error);
    return res.status(500).json({
      error: 'Database initialization failed',
      details: error.message
    });
  }
};