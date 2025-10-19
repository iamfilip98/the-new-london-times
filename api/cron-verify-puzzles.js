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
 * Puzzle Verification CRON Endpoint
 * Runs at 11 PM daily to verify tomorrow's puzzles exist
 * If missing, uses fallback notification system
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
    console.error('[11 PM VERIFY] Unauthorized attempt to verify puzzles');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Calculate tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];

  console.log('\n═══════════════════════════════════════════');
  console.log('[11 PM VERIFY] PUZZLE VERIFICATION CHECK');
  console.log('═══════════════════════════════════════════');
  console.log(`[11 PM VERIFY] Checking puzzles for ${tomorrowDate}...`);

  try {
    // Check if puzzles exist for tomorrow
    const puzzlesResult = await sql`
      SELECT * FROM daily_puzzles WHERE date = ${tomorrowDate}
    `;

    if (puzzlesResult.rows.length > 0) {
      // Puzzles exist - verify they're valid
      const row = puzzlesResult.rows[0];
      const issues = [];

      // Basic validation
      if (!row.easy_puzzle || row.easy_puzzle.length !== 81) {
        issues.push('Easy puzzle invalid or missing');
      }
      if (!row.medium_puzzle || row.medium_puzzle.length !== 81) {
        issues.push('Medium puzzle invalid or missing');
      }
      if (!row.hard_puzzle || row.hard_puzzle.length !== 81) {
        issues.push('Hard puzzle invalid or missing');
      }

      if (issues.length > 0) {
        console.log(`[11 PM VERIFY] ⚠ Puzzles exist but have issues:`);
        issues.forEach(issue => console.log(`  - ${issue}`));

        return res.status(200).json({
          success: true,
          status: 'exists_with_issues',
          date: tomorrowDate,
          issues,
          message: 'Puzzles exist but may have quality issues'
        });
      }

      console.log(`[11 PM VERIFY] ✓ Puzzles verified for ${tomorrowDate}`);
      console.log(`[11 PM VERIFY]   Easy: ${row.easy_puzzle.replace(/0/g, '.').match(/.{9}/g).join('\n' + ' '.repeat(19))}`);

      return res.status(200).json({
        success: true,
        status: 'verified',
        date: tomorrowDate,
        message: 'Puzzles exist and validated successfully'
      });
    }

    // No puzzles found - check fallback system
    console.log(`[11 PM VERIFY] ⚠ No puzzles found for ${tomorrowDate}`);
    console.log(`[11 PM VERIFY] Checking fallback puzzle availability...`);

    const fallbackCount = await sql`
      SELECT difficulty, COUNT(*) as count
      FROM fallback_puzzles
      GROUP BY difficulty
    `;

    const fallbackStatus = {
      easy: 0,
      medium: 0,
      hard: 0
    };

    fallbackCount.rows.forEach(row => {
      fallbackStatus[row.difficulty] = parseInt(row.count);
    });

    console.log(`[11 PM VERIFY] Fallback puzzle count:`);
    console.log(`  Easy: ${fallbackStatus.easy}`);
    console.log(`  Medium: ${fallbackStatus.medium}`);
    console.log(`  Hard: ${fallbackStatus.hard}`);

    const allFallbacksAvailable =
      fallbackStatus.easy > 0 &&
      fallbackStatus.medium > 0 &&
      fallbackStatus.hard > 0;

    if (allFallbacksAvailable) {
      console.log(`[11 PM VERIFY] ✓ Fallback system ready as backup`);

      return res.status(200).json({
        success: true,
        status: 'missing_with_fallback',
        date: tomorrowDate,
        fallbackStatus,
        message: 'Puzzles missing but fallback system available',
        recommendation: 'Consider running generate-tomorrow endpoint manually'
      });
    } else {
      console.log(`[11 PM VERIFY] ❌ CRITICAL: Missing puzzles AND insufficient fallbacks!`);

      return res.status(200).json({
        success: false,
        status: 'critical_missing',
        date: tomorrowDate,
        fallbackStatus,
        message: 'CRITICAL: No puzzles and insufficient fallback coverage',
        action: 'URGENT: Generate fallback puzzles OR run puzzle generation immediately'
      });
    }

  } catch (error) {
    console.error(`[11 PM VERIFY] ❌ Verification failed:`, error);

    return res.status(500).json({
      success: false,
      status: 'error',
      error: error.message,
      date: tomorrowDate
    });
  }
};
