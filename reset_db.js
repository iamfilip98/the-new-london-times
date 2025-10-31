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


  try {
    let totalDeleted = 0;

    // 1. Clear ALL old puzzles
    const deletedPuzzles = await pool.query('DELETE FROM daily_puzzles RETURNING date');
    totalDeleted += deletedPuzzles.rows.length;

    // 2. Clear ALL game states for today (handle timezone - date could be stored as UTC)
    // Delete by matching the date part only, ignoring timezone
    const deletedStates = await pool.query(`
      DELETE FROM game_states
      WHERE date::date = $1::date
      RETURNING id
    `, [today]);
    totalDeleted += deletedStates.rows.length;

    // 3. Clear completion times for today
    try {
      const deletedTimes = await pool.query(`
        DELETE FROM individual_games
        WHERE date::date = $1::date
        RETURNING id
      `, [today]);
      totalDeleted += deletedTimes.rows.length;
    } catch (e) {
    }

    // 4. Clear sudoku_games for today
    try {
      const deletedGames = await pool.query(`
        DELETE FROM sudoku_games
        WHERE date::date = $1::date
        RETURNING id
      `, [today]);
      totalDeleted += deletedGames.rows.length;
    } catch (e) {
    }

    // 5. Clear daily_completions for today
    try {
      const deletedCompletions = await pool.query(`
        DELETE FROM daily_completions
        WHERE date::date = $1::date
        RETURNING id
      `, [today]);
      totalDeleted += deletedCompletions.rows.length;
    } catch (e) {
    }

    // 6. Clear entries for today
    try {
      const deletedEntries = await pool.query(`
        DELETE FROM entries
        WHERE date::date = $1::date
        RETURNING id
      `, [today]);
      totalDeleted += deletedEntries.rows.length;
    } catch (e) {
    }

    // 7. Clear achievements for today
    try {
      const deletedAchievements = await pool.query(`
        DELETE FROM achievements
        WHERE date::date = $1::date
        RETURNING id
      `, [today]);
      totalDeleted += deletedAchievements.rows.length;
    } catch (e) {
    }

    // 8. Clear streaks for today (may affect user streaks - be careful!)
    try {
      const deletedStreaks = await pool.query(`
        DELETE FROM streaks
        WHERE date::date = $1::date
        RETURNING id
      `, [today]);
      totalDeleted += deletedStreaks.rows.length;
    } catch (e) {
    }

    // 9. Clear challenges for today
    try {
      const deletedChallenges = await pool.query(`
        DELETE FROM challenges
        WHERE date::date = $1::date
        RETURNING id
      `, [today]);
      totalDeleted += deletedChallenges.rows.length;
    } catch (e) {
    }

    // 10. Clear puzzle_ratings for today
    try {
      const deletedRatings = await pool.query(`
        DELETE FROM puzzle_ratings
        WHERE date::date = $1::date
        RETURNING id
      `, [today]);
      totalDeleted += deletedRatings.rows.length;
    } catch (e) {
    }


  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();
