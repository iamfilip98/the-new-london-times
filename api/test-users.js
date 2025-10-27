const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const users = await sql`SELECT username, display_name, created_at FROM users ORDER BY created_at`;

    res.status(200).json({
      success: true,
      count: users.rows.length,
      users: users.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
