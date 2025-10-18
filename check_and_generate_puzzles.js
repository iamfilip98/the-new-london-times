// Check database and generate new puzzles if needed

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

const today = new Date().toISOString().split('T')[0];

async function checkAndGenerate() {
  try {
    console.log('═══════════════════════════════════════════════');
    console.log('CHECKING DATABASE STATUS');
    console.log('═══════════════════════════════════════════════');
    console.log(`Date: ${today}`);
    console.log();

    // Check if puzzles exist for today
    const puzzles = await sql`SELECT * FROM daily_puzzles WHERE date = ${today}`;

    console.log(`Found ${puzzles.rows.length} puzzle entries for today`);

    if (puzzles.rows.length === 0) {
      console.log('\n⚠️  No puzzles found! This is why the game isn\'t showing.');
      console.log('The app expects puzzles to exist in the database.');
      console.log();
      console.log('The puzzle generation should happen automatically when you load the app.');
      console.log('This might take 1-2 minutes because it validates unique solutions.');
      console.log();
      console.log('SOLUTION:');
      console.log('1. Refresh your browser');
      console.log('2. Wait for puzzles to generate (watch browser console)');
      console.log('3. The app should load once generation completes');
      console.log();
      console.log('If that doesn\'t work, I can manually trigger generation...');
    } else {
      console.log('\n✓ Puzzles exist for today!');
      console.log();
      console.log('Puzzle details:');
      const puzzle = puzzles.rows[0];
      console.log(`  Easy clues: ${puzzle.easy_puzzle.replace(/0/g, '').length}`);
      console.log(`  Medium clues: ${puzzle.medium_puzzle.replace(/0/g, '').length}`);
      console.log(`  Hard clues: ${puzzle.hard_puzzle.replace(/0/g, '').length}`);
      console.log();
      console.log('The game should be visible. Try:');
      console.log('  1. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)');
      console.log('  2. Clear browser cache');
      console.log('  3. Check browser console for errors');
    }

    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkAndGenerate();
