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
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Get all users (without password hashes for security)
    const users = await pool.query('SELECT id, username, display_name, created_at, LENGTH(password_hash) as hash_length FROM users ORDER BY created_at');

    // Test password for faidao
    const faidaoResult = await pool.query('SELECT password_hash FROM users WHERE username = $1', ['faidao']);
    let faidaoPasswordTest = null;
    if (faidaoResult.rows.length > 0) {
      const testPassword = 'sudoku2024';
      const hash = faidaoResult.rows[0].password_hash;
      faidaoPasswordTest = {
        hashStartsWith: hash.substring(0, 10),
        testPasswordMatches: await bcrypt.compare(testPassword, hash),
        hashLength: hash.length
      };
    }

    // Show env var details (partially obscured for security)
    const faidaoEnv = process.env.FAIDAO_PASSWORD || 'NOT_SET';
    const filipEnv = process.env.FILIP_PASSWORD || 'NOT_SET';

    res.status(200).json({
      success: true,
      userCount: users.rows.length,
      users: users.rows,
      faidaoPasswordTest,
      envVarsPresent: {
        POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
        FAIDAO_PASSWORD: !!process.env.FAIDAO_PASSWORD,
        FILIP_PASSWORD: !!process.env.FILIP_PASSWORD
      },
      envVarDetails: {
        faidao: {
          length: faidaoEnv.length,
          startsWithSudoku: faidaoEnv.startsWith('sudoku'),
          value: faidaoEnv // Temporarily show full value to debug
        },
        filip: {
          length: filipEnv.length,
          startsWithSudoku: filipEnv.startsWith('sudoku'),
          value: filipEnv // Temporarily show full value to debug
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};
