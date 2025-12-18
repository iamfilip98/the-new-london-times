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
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Hash the password "sudoku2024"
    const password = 'sudoku2024';
    const hash = await bcrypt.hash(password, 10);

    // Update Filip's password
    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE username = 'filip'
       RETURNING username, display_name`,
      [hash]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User filip not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      user: result.rows[0].username,
      display_name: result.rows[0].display_name,
      new_password: 'sudoku2024'
    });

  } catch (error) {
    console.error('Password reset failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Password reset failed',
      details: error.message
    });
  }
};
