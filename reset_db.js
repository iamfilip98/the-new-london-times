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
  console.log('DATABASE RESET FOR TODAY - COMPLETE WIPE');
  console.log('═══════════════════════════════════════════');

  try {
    let totalDeleted = 0;

    // 1. Clear ALL old puzzles
    console.log('\n1. Clearing all old puzzles...');
    const deletedPuzzles = await pool.query('DELETE FROM daily_puzzles RETURNING date');
    console.log(`   ✓ Deleted ${deletedPuzzles.rows.length} puzzle entries`);
    totalDeleted += deletedPuzzles.rows.length;

    // 2. Clear ALL game states for today (handle timezone - date could be stored as UTC)
    console.log(`\n2. Clearing game states for ${today}...`);
    // Delete by matching the date part only, ignoring timezone
    const deletedStates = await pool.query(`
      DELETE FROM game_states
      WHERE date::date = $1::date
      RETURNING id
    `, [today]);
    console.log(`   ✓ Deleted ${deletedStates.rows.length} game state entries`);
    totalDeleted += deletedStates.rows.length;

    // 3. Clear completion times for today
    console.log(`\n3. Clearing completion times for ${today}...`);
    try {
      const deletedTimes = await pool.query(`
        DELETE FROM individual_games
        WHERE date::date = $1::date
        RETURNING id
      `, [today]);
      console.log(`   ✓ Deleted ${deletedTimes.rows.length} completion time entries`);
      totalDeleted += deletedTimes.rows.length;
    } catch (e) {
      console.log(`   ⚠ individual_games table may not exist yet`);
    }

    // 4. Clear sudoku_games for today
    console.log(`\n4. Clearing sudoku_games for ${today}...`);
    try {
      const deletedGames = await pool.query(`
        DELETE FROM sudoku_games
        WHERE date::date = $1::date
        RETURNING id
      `, [today]);
      console.log(`   ✓ Deleted ${deletedGames.rows.length} sudoku game entries`);
      totalDeleted += deletedGames.rows.length;
    } catch (e) {
      console.log(`   ⚠ sudoku_games table may not exist: ${e.message}`);
    }

    // 5. Clear daily_completions for today
    console.log(`\n5. Clearing daily_completions for ${today}...`);
    try {
      const deletedCompletions = await pool.query(`
        DELETE FROM daily_completions
        WHERE date::date = $1::date
        RETURNING id
      `, [today]);
      console.log(`   ✓ Deleted ${deletedCompletions.rows.length} daily completion entries`);
      totalDeleted += deletedCompletions.rows.length;
    } catch (e) {
      console.log(`   ⚠ daily_completions table may not exist: ${e.message}`);
    }

    // 6. Clear entries for today
    console.log(`\n6. Clearing entries for ${today}...`);
    try {
      const deletedEntries = await pool.query(`
        DELETE FROM entries
        WHERE date::date = $1::date
        RETURNING id
      `, [today]);
      console.log(`   ✓ Deleted ${deletedEntries.rows.length} entry records`);
      totalDeleted += deletedEntries.rows.length;
    } catch (e) {
      console.log(`   ⚠ entries table may not exist: ${e.message}`);
    }

    // 7. Clear achievements for today
    console.log(`\n7. Clearing achievements for ${today}...`);
    try {
      const deletedAchievements = await pool.query(`
        DELETE FROM achievements
        WHERE date::date = $1::date
        RETURNING id
      `, [today]);
      console.log(`   ✓ Deleted ${deletedAchievements.rows.length} achievement entries`);
      totalDeleted += deletedAchievements.rows.length;
    } catch (e) {
      console.log(`   ⚠ achievements table may not exist: ${e.message}`);
    }

    // 8. Clear streaks for today (may affect user streaks - be careful!)
    console.log(`\n8. Clearing streaks for ${today}...`);
    try {
      const deletedStreaks = await pool.query(`
        DELETE FROM streaks
        WHERE date::date = $1::date
        RETURNING id
      `, [today]);
      console.log(`   ✓ Deleted ${deletedStreaks.rows.length} streak entries`);
      totalDeleted += deletedStreaks.rows.length;
    } catch (e) {
      console.log(`   ⚠ streaks table may not exist: ${e.message}`);
    }

    // 9. Clear challenges for today
    console.log(`\n9. Clearing challenges for ${today}...`);
    try {
      const deletedChallenges = await pool.query(`
        DELETE FROM challenges
        WHERE date::date = $1::date
        RETURNING id
      `, [today]);
      console.log(`   ✓ Deleted ${deletedChallenges.rows.length} challenge entries`);
      totalDeleted += deletedChallenges.rows.length;
    } catch (e) {
      console.log(`   ⚠ challenges table may not exist: ${e.message}`);
    }

    // 10. Clear puzzle_ratings for today
    console.log(`\n10. Clearing puzzle_ratings for ${today}...`);
    try {
      const deletedRatings = await pool.query(`
        DELETE FROM puzzle_ratings
        WHERE date::date = $1::date
        RETURNING id
      `, [today]);
      console.log(`   ✓ Deleted ${deletedRatings.rows.length} rating entries`);
      totalDeleted += deletedRatings.rows.length;
    } catch (e) {
      console.log(`   ⚠ puzzle_ratings table may not exist: ${e.message}`);
    }

    console.log('\n═══════════════════════════════════════════');
    console.log(`✅ Database reset complete! Total records deleted: ${totalDeleted}`);
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();
