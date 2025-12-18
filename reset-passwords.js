require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.POSTGRES_PRISMA_URL,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  }
});

async function resetPasswords() {
  try {
    console.log('🔄 Resetting passwords to sudoku2024...');

    // Hash the password
    const password = 'sudoku2024';
    const hash = await bcrypt.hash(password, 10);

    // Update both users
    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE username IN ('faidao', 'filip')
       RETURNING username`,
      [hash]
    );

    console.log('✅ Passwords reset successfully for users:', result.rows.map(r => r.username));
    console.log('🔑 New password: sudoku2024');

    await pool.end();
  } catch (error) {
    console.error('❌ Failed to reset passwords:', error.message);
    process.exit(1);
  }
}

resetPasswords();
