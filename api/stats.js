require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_PRISMA_URL,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  },
  // Optimize connection pooling for better performance
  max: 3, // maximum number of clients in the pool
  idleTimeoutMillis: 5000, // close idle clients after 5 seconds
  connectionTimeoutMillis: 10000, // return an error if connection takes longer than 10 seconds
  maxUses: 100 // close connections after this many uses
});

// Helper function to execute SQL queries
async function sql(strings, ...values) {
  let query = '';
  const params = [];
  let paramIndex = 1;

  for (let i = 0; i < strings.length; i++) {
    query += strings[i];
    if (i < values.length) {
      query += `$${paramIndex}`;
      params.push(values[i]);
      paramIndex++;
    }
  }

  const result = await pool.query(query, params);
  return { rows: result.rows };
}

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        const { type } = req.query;

        if (type === 'streaks') {
          const result = await sql`
            SELECT player, current_streak, best_streak
            FROM streaks
          `;

          const streaks = {};
          result.rows.forEach(row => {
            streaks[row.player] = {
              current: row.current_streak,
              best: row.best_streak
            };
          });

          return res.status(200).json(streaks);
        }

        if (type === 'challenges') {
          const result = await sql`
            SELECT challenge_id, data
            FROM challenges
            ORDER BY created_at DESC
          `;

          return res.status(200).json(result.rows.map(row => ({
            id: row.challenge_id,
            ...row.data
          })));
        }

        if (type === 'all') {
          // Fetch all data in parallel for better performance
          const [streaksResult, challengesResult, achievementsResult] = await Promise.all([
            sql`SELECT player, current_streak, best_streak FROM streaks`,
            sql`SELECT challenge_id, data FROM challenges ORDER BY created_at DESC`,
            sql`SELECT achievement_id, player, unlocked_at, data FROM achievements ORDER BY unlocked_at DESC`
          ]);

          const streaks = {};
          streaksResult.rows.forEach(row => {
            streaks[row.player] = {
              current: row.current_streak,
              best: row.best_streak
            };
          });

          const challenges = challengesResult.rows.map(row => ({
            id: row.challenge_id,
            ...row.data
          }));

          const achievements = achievementsResult.rows.map(row => ({
            id: row.achievement_id,
            player: row.player,
            unlockedAt: row.unlocked_at.toISOString(),
            ...row.data
          }));

          return res.status(200).json({
            streaks,
            challenges,
            achievements
          });
        }

        // Return empty for other types for now
        return res.status(200).json({});

      case 'PUT':
        const { type: putType, data: putData } = req.body;

        if (putType === 'streaks') {
          if (!putData || typeof putData !== 'object') {
            return res.status(400).json({ error: 'Valid streaks data is required' });
          }

          for (const [player, data] of Object.entries(putData)) {
            await sql`
              UPDATE streaks
              SET
                current_streak = ${data.current},
                best_streak = ${data.best},
                updated_at = NOW()
              WHERE player = ${player}
            `;
          }

          return res.status(200).json({
            success: true,
            message: 'Streaks updated successfully'
          });
        }

        return res.status(400).json({ error: 'Invalid type for PUT request' });

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};