import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Only allow GET requests for safety
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the date parameter (optional, defaults to clearing all old puzzles)
    const { before } = req.query;

    if (before) {
      // Clear puzzles before a specific date
      const result = await sql`
        DELETE FROM daily_puzzles
        WHERE date < ${before}
        RETURNING date
      `;

      return res.status(200).json({
        success: true,
        message: `Cleared ${result.rowCount} puzzles before ${before}`,
        dates: result.rows.map(r => r.date)
      });
    } else {
      // Clear today's puzzle specifically to force regeneration
      const today = new Date().toISOString().split('T')[0];
      const result = await sql`
        DELETE FROM daily_puzzles
        WHERE date = ${today}
        RETURNING date
      `;

      return res.status(200).json({
        success: true,
        message: result.rowCount > 0
          ? `Cleared today's puzzle (${today}). It will regenerate on next load.`
          : `No puzzle found for today (${today})`,
        cleared: result.rowCount > 0
      });
    }
  } catch (error) {
    console.error('Error clearing puzzles:', error);
    return res.status(500).json({
      error: error.message,
      details: 'Failed to clear puzzles from database'
    });
  }
}
