require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_PRISMA_URL,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  },
  max: 2,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 10000,
  maxUses: 100,
  acquireTimeoutMillis: 5000
});

// Helper function for SQL queries
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

// Import the puzzle generation functions from puzzles.js
// Since this is a serverless function, we'll need to reuse the logic
// For now, we'll make a POST request to the puzzles API

/**
 * Scheduled Generation Endpoint
 * Called at 11 PM daily by Vercel Cron or external scheduler
 * Generates puzzles for TOMORROW (next day)
 */
module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-cron-secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Security: Only allow from authorized scheduler
  const authToken = req.headers['x-cron-secret'];
  const expectedToken = process.env.CRON_SECRET;

  // Allow requests without token in development, but require it in production
  if (process.env.NODE_ENV === 'production' && authToken !== expectedToken) {
    console.error('[11 PM] Unauthorized attempt to generate puzzles');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Calculate tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];


  try {
    const startTime = Date.now();

    // Check if puzzles already exist for tomorrow
    const existing = await sql`
      SELECT * FROM daily_puzzles WHERE date = ${tomorrowDate}
    `;

    if (existing.rows.length > 0) {
      return res.status(200).json({
        success: true,
        skipped: true,
        date: tomorrowDate,
        message: 'Puzzles already exist for this date'
      });
    }

    // Import and use the generation logic from puzzles.js
    // We'll make an internal call to the puzzles API
    const puzzlesModule = require('./puzzles.js');

    // Create a mock request object for the puzzles API
    const mockReq = {
      method: 'POST',
      body: {
        action: 'generate',
        date: tomorrowDate,
        // Don't pass forceSeed - use date-based seed for consistency
      },
      headers: {}
    };

    // Create a promise-based mock response object
    const mockRes = {
      statusCode: 200,
      headers: {},
      setHeader: function(name, value) {
        this.headers[name] = value;
      },
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        return new Promise((resolve) => {
          this.data = data;
          resolve(data);
        });
      },
      end: function() {
        return Promise.resolve();
      }
    };

    // Call the puzzles handler
    await puzzlesModule(mockReq, mockRes);

    const duration = (Date.now() - startTime) / 1000;

    if (mockRes.statusCode === 200 && mockRes.data) {

      // Extract stats from the generated puzzles
      const puzzles = mockRes.data;
      const stats = {
        easy: {
          clues: puzzles.easy?.puzzle ? puzzles.easy.puzzle.flat().filter(n => n !== 0).length : 'N/A'
        },
        medium: {
          clues: puzzles.medium?.puzzle ? puzzles.medium.puzzle.flat().filter(n => n !== 0).length : 'N/A'
        },
        hard: {
          clues: puzzles.hard?.puzzle ? puzzles.hard.puzzle.flat().filter(n => n !== 0).length : 'N/A'
        }
      };


      return res.status(200).json({
        success: true,
        date: tomorrowDate,
        duration: duration.toFixed(2),
        stats: stats
      });
    } else {
      throw new Error(`Puzzle generation failed with status ${mockRes.statusCode}`);
    }

  } catch (error) {
    console.error(`[11 PM] ❌ Failed to generate puzzles for ${tomorrowDate}:`, error);

    return res.status(500).json({
      success: false,
      error: error.message,
      date: tomorrowDate
    });
  }
};
