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

// Helper function to execute SQL queries using template literals
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

// Database initialization and helper functions
async function initDatabase() {
  try {
    // Create entries table
    await sql`
      CREATE TABLE IF NOT EXISTS entries (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create achievements table
    await sql`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        achievement_id VARCHAR(255) NOT NULL,
        player VARCHAR(50) NOT NULL,
        unlocked_at TIMESTAMP NOT NULL,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(achievement_id, player, unlocked_at)
      )
    `;

    // Create streaks table
    await sql`
      CREATE TABLE IF NOT EXISTS streaks (
        id SERIAL PRIMARY KEY,
        player VARCHAR(50) UNIQUE NOT NULL,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Initialize default streak records for both players
    await sql`
      INSERT INTO streaks (player, current_streak, best_streak)
      VALUES ('faidao', 0, 0), ('filip', 0, 0)
      ON CONFLICT (player) DO NOTHING
    `;

    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

async function getAllEntries() {
  try {
    const result = await sql`
      SELECT date, data
      FROM entries
      ORDER BY date DESC
    `;

    return result.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      ...row.data
    }));
  } catch (error) {
    console.error('Failed to get entries:', error);
    throw error;
  }
}

async function saveEntryToDb(date, entryData) {
  try {
    await sql`
      INSERT INTO entries (date, data)
      VALUES (${date}, ${JSON.stringify(entryData)})
      ON CONFLICT (date)
      DO UPDATE SET
        data = ${JSON.stringify(entryData)},
        updated_at = NOW()
    `;

    return true;
  } catch (error) {
    console.error('Failed to save entry:', error);
    throw error;
  }
}

async function deleteEntryFromDb(date) {
  try {
    await sql`DELETE FROM entries WHERE date = ${date}`;
    return true;
  } catch (error) {
    console.error('Failed to delete entry:', error);
    throw error;
  }
}

module.exports = async function handler(req, res) {
  // Initialize database on first request
  try {
    await initDatabase();
  } catch (error) {
    console.error('Database initialization failed:', error);
    return res.status(500).json({ error: 'Database initialization failed' });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        const entries = await getAllEntries();
        return res.status(200).json(entries);

      case 'POST':
        const { date, faidao, filip, migrate, migrationData } = req.body;

        // Handle migration request
        if (migrate && migrationData) {
          // Simple migration - just save all entries
          if (migrationData.entries && migrationData.entries.length > 0) {
            for (const entry of migrationData.entries) {
              await saveEntryToDb(entry.date, {
                faidao: entry.faidao,
                filip: entry.filip
              });
            }
          }
          return res.status(200).json({ success: true, message: 'Migration completed' });
        }

        // Validate required fields for regular entry
        if (!date || !faidao || !filip) {
          return res.status(400).json({ error: 'Date and player data are required' });
        }

        const entryData = { faidao, filip };
        await saveEntryToDb(date, entryData);

        return res.status(200).json({
          success: true,
          message: 'Entry saved successfully',
          entry: { date, ...entryData }
        });

      case 'DELETE':
        const { date: deleteDate } = req.query;

        if (!deleteDate) {
          return res.status(400).json({ error: 'Date is required for deletion' });
        }

        await deleteEntryFromDb(deleteDate);
        return res.status(200).json({
          success: true,
          message: 'Entry deleted successfully'
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
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