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

/**
 * Admin endpoint to generate emergency fallback puzzles
 * Requires ADMIN_KEY in request headers
 * Generates 5 high-quality puzzles per difficulty and stores in fallback_puzzles table
 */
module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Security: Require admin key
  const adminKey = req.headers['x-admin-key'];
  const expectedAdminKey = process.env.ADMIN_KEY;

  if (!adminKey || adminKey !== expectedAdminKey) {
    console.error('[ADMIN] Unauthorized attempt to generate fallback puzzles');
    return res.status(401).json({ error: 'Unauthorized. Admin key required.' });
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('[ADMIN] GENERATING FALLBACK PUZZLES');
  console.log('═══════════════════════════════════════════\n');

  try {
    const startTime = Date.now();
    const puzzlesModule = require('./puzzles.js');

    // Track results
    const results = {
      easy: [],
      medium: [],
      hard: []
    };

    // Generate 5 puzzles per difficulty
    const puzzlesPerDifficulty = 5;
    const difficulties = ['easy', 'medium', 'hard'];

    for (const difficulty of difficulties) {
      console.log(`\n${'═'.repeat(50)}`);
      console.log(`GENERATING ${puzzlesPerDifficulty} FALLBACK ${difficulty.toUpperCase()} PUZZLES`);
      console.log(`${'═'.repeat(50)}\n`);

      for (let i = 1; i <= puzzlesPerDifficulty; i++) {
        console.log(`\n--- ${difficulty.toUpperCase()} Puzzle ${i}/${puzzlesPerDifficulty} ---\n`);

        // Use unique seed for each fallback puzzle
        const seed = Date.now() + (i * 100000) + (difficulties.indexOf(difficulty) * 10000);
        const mockDate = `fallback-${difficulty}-${i}`;

        // Create mock request
        const mockReq = {
          method: 'POST',
          body: {
            action: 'generate',
            date: mockDate,
            forceSeed: seed
          },
          headers: {}
        };

        // Create mock response
        let responseData = null;
        let statusCode = 200;

        const mockRes = {
          statusCode: 200,
          headers: {},
          setHeader: function(name, value) {
            this.headers[name] = value;
          },
          status: function(code) {
            statusCode = code;
            this.statusCode = code;
            return this;
          },
          json: function(data) {
            responseData = data;
            return Promise.resolve(data);
          },
          end: function() {
            return Promise.resolve();
          }
        };

        // Generate puzzle
        await puzzlesModule(mockReq, mockRes);

        if (statusCode === 200 && responseData && responseData[difficulty]) {
          const puzzleData = responseData[difficulty];

          // Store in fallback_puzzles table
          await sql`
            INSERT INTO fallback_puzzles (difficulty, puzzle, solution, quality_score)
            VALUES (
              ${difficulty},
              ${JSON.stringify(puzzleData.puzzle)},
              ${JSON.stringify(puzzleData.solution)},
              ${5}
            )
          `;

          results[difficulty].push({
            puzzleNumber: i,
            success: true,
            clues: puzzleData.puzzle.flat().filter(n => n !== 0).length
          });

          console.log(`✓ Fallback ${difficulty} puzzle ${i} generated and saved`);
        } else {
          results[difficulty].push({
            puzzleNumber: i,
            success: false,
            error: 'Generation failed'
          });
          console.error(`✗ Failed to generate fallback ${difficulty} puzzle ${i}`);
        }
      }
    }

    const duration = (Date.now() - startTime) / 1000;

    // Count total successes
    const totalGenerated =
      results.easy.filter(r => r.success).length +
      results.medium.filter(r => r.success).length +
      results.hard.filter(r => r.success).length;

    console.log('\n═══════════════════════════════════════════');
    console.log('[ADMIN] FALLBACK GENERATION COMPLETE');
    console.log('═══════════════════════════════════════════');
    console.log(`Generated ${totalGenerated}/${puzzlesPerDifficulty * 3} fallback puzzles in ${duration.toFixed(2)}s`);
    console.log(`Easy: ${results.easy.filter(r => r.success).length}/${puzzlesPerDifficulty}`);
    console.log(`Medium: ${results.medium.filter(r => r.success).length}/${puzzlesPerDifficulty}`);
    console.log(`Hard: ${results.hard.filter(r => r.success).length}/${puzzlesPerDifficulty}\n`);

    return res.status(200).json({
      success: true,
      totalGenerated,
      duration: duration.toFixed(2),
      results
    });

  } catch (error) {
    console.error('[ADMIN] Failed to generate fallback puzzles:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
