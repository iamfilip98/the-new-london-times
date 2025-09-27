const { sql } = require('@vercel/postgres');

export default async function handler(req, res) {
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
    // Clear core tables
    await sql`DELETE FROM achievements`;
    await sql`DELETE FROM entries`;

    // Try to clear streaks table
    try {
      await sql`DELETE FROM streaks`;
    } catch (e) {
      console.log('Streaks table not found or already empty');
    }

    // Also clear any other potential tables
    try {
      await sql`DELETE FROM daily_puzzles`;
    } catch (e) {
      console.log('Daily puzzles table not found or already empty');
    }

    try {
      await sql`DELETE FROM game_states`;
    } catch (e) {
      console.log('Game states table not found or already empty');
    }

    return res.status(200).json({
      success: true,
      message: 'All data cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing all data:', error);
    return res.status(500).json({
      error: 'Failed to clear data',
      details: error.message
    });
  }
}