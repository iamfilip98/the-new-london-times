// Clear ALL user completion times for today so everyone can retry

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

async function clearAllUserTimes() {
  try {
    console.log('═══════════════════════════════════════════════');
    console.log('CLEARING ALL USER TIMES FOR TODAY');
    console.log('═══════════════════════════════════════════════');
    console.log(`Date: ${today}`);
    console.log();

    // Clear ALL completion times for today
    const deleteTimes = await sql`DELETE FROM individual_games WHERE date = ${today} RETURNING player, difficulty`;

    console.log(`✓ Deleted ${deleteTimes.rows.length} completion time entries`);

    if (deleteTimes.rows.length > 0) {
      console.log('\nCleared times for:');
      deleteTimes.rows.forEach(row => {
        console.log(`  - ${row.player} (${row.difficulty})`);
      });
    }

    // Clear ALL game states for today
    const deleteStates = await sql`DELETE FROM game_states WHERE date = ${today} RETURNING player, difficulty`;

    console.log(`\n✓ Deleted ${deleteStates.rows.length} game state entries`);

    if (deleteStates.rows.length > 0) {
      console.log('\nCleared game states for:');
      deleteStates.rows.forEach(row => {
        console.log(`  - ${row.player} (${row.difficulty})`);
      });
    }

    console.log();
    console.log('═══════════════════════════════════════════════');
    console.log('SUCCESS! All users can now retry today\'s puzzles');
    console.log('═══════════════════════════════════════════════');
    console.log();
    console.log('All users will:');
    console.log('  ✓ See fresh puzzles (with unique solutions)');
    console.log('  ✓ Have their times/progress reset');
    console.log('  ✓ Be able to compete fairly on solvable puzzles');
    console.log();

    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

clearAllUserTimes();
