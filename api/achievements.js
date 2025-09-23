require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        const result = await sql`
          SELECT achievement_id, player, unlocked_at, data
          FROM achievements
          ORDER BY unlocked_at DESC
        `;

        const achievements = result.rows.map(row => ({
          id: row.achievement_id,
          player: row.player,
          unlockedAt: row.unlocked_at.toISOString(),
          ...row.data
        }));

        return res.status(200).json(achievements);

      case 'POST':
        const { id, player, unlockedAt, oneTime, ...data } = req.body;

        if (!id || !player || !unlockedAt) {
          return res.status(400).json({ error: 'Achievement ID, player, and unlockedAt are required' });
        }

        if (oneTime) {
          // For one-time achievements, check if already exists and don't insert if it does
          const existing = await sql`
            SELECT achievement_id FROM achievements
            WHERE achievement_id = ${id} AND player = ${player}
            LIMIT 1
          `;

          if (existing.rows.length > 0) {
            return res.status(200).json({
              success: true,
              message: 'Achievement already exists (one-time achievement)'
            });
          }
        }

        await sql`
          INSERT INTO achievements (achievement_id, player, unlocked_at, data)
          VALUES (${id}, ${player}, ${unlockedAt}, ${JSON.stringify(data)})
          ON CONFLICT (achievement_id, player, unlocked_at) DO NOTHING
        `;

        return res.status(200).json({
          success: true,
          message: 'Achievement saved successfully'
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
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