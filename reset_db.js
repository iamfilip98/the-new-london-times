require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_PRISMA_URL,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  }
});

async function resetDatabase() {
  const today = '2025-10-18';
  
  console.log('═══════════════════════════════════════════');
  console.log('DATABASE RESET FOR TODAY');
  console.log('═══════════════════════════════════════════');
  
  try {
    // 1. Clear ALL old puzzles
    console.log('\n1. Clearing all old puzzles...');
    const deletedPuzzles = await pool.query('DELETE FROM daily_puzzles RETURNING date');
    console.log(`   ✓ Deleted ${deletedPuzzles.rows.length} puzzle entries`);
    
    // 2. Clear ALL game states for today
    console.log(`\n2. Clearing game states for ${today}...`);
    const deletedStates = await pool.query('DELETE FROM game_states WHERE date = $1 RETURNING id', [today]);
    console.log(`   ✓ Deleted ${deletedStates.rows.length} game state entries`);
    
    // 3. Clear completion times for today (if table exists)
    console.log(`\n3. Clearing completion times for ${today}...`);
    try {
      const deletedTimes = await pool.query('DELETE FROM individual_games WHERE date = $1 RETURNING id', [today]);
      console.log(`   ✓ Deleted ${deletedTimes.rows.length} completion time entries`);
    } catch (e) {
      console.log(`   ⚠ individual_games table may not exist yet`);
    }
    
    console.log('\n✅ Database reset complete!');
    console.log('═══════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();
