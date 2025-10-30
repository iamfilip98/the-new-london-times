#!/usr/bin/env node

/**
 * Wipe all user data to reset for new scoring system
 *
 * This script will delete all data from:
 * - individual_games (all game history)
 * - achievements (all unlocked achievements)
 * - streaks (win streaks)
 * - entries (legacy data if exists)
 *
 * This allows for a clean start to test the new scoring system.
 */

require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const readline = require('readline');

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function wipeAllData() {
  console.log('\n=== WIPE ALL USER DATA ===');
  console.log('This will DELETE ALL data from:');
  console.log('  - individual_games (all game history)');
  console.log('  - achievements (all unlocked achievements)');
  console.log('  - streaks (win/loss streaks)');
  console.log('  - entries (legacy data if exists)');
  console.log('\n⚠️  THIS CANNOT BE UNDONE! ⚠️\n');

  rl.question('Type "YES" to confirm data wipe: ', async (answer) => {
    if (answer !== 'YES') {
      console.log('\n❌ Data wipe cancelled.');
      rl.close();
      await pool.end();
      return;
    }

    try {
      console.log('\n🗑️  Starting data wipe...\n');

      // Get counts before deletion
      const gamesCount = await pool.query('SELECT COUNT(*) FROM individual_games');
      const achievementsCount = await pool.query('SELECT COUNT(*) FROM achievements');
      const streaksCount = await pool.query('SELECT COUNT(*) FROM streaks');

      console.log(`Found ${gamesCount.rows[0].count} games to delete`);
      console.log(`Found ${achievementsCount.rows[0].count} achievements to delete`);
      console.log(`Found ${streaksCount.rows[0].count} streak records to delete`);

      // Try to get entries count (may not exist)
      let entriesCount = 0;
      try {
        const result = await pool.query('SELECT COUNT(*) FROM entries');
        entriesCount = result.rows[0].count;
        console.log(`Found ${entriesCount} entries to delete`);
      } catch (err) {
        console.log('No entries table found (this is okay)');
      }

      console.log('\n🔥 Deleting data...\n');

      // Delete all data
      await pool.query('DELETE FROM individual_games');
      console.log('✅ Deleted all games');

      await pool.query('DELETE FROM achievements');
      console.log('✅ Deleted all achievements');

      await pool.query('DELETE FROM streaks');
      console.log('✅ Deleted all streak records');

      // Reset streaks to zero
      await pool.query(`
        INSERT INTO streaks (player, current_streak, best_streak)
        VALUES ('faidao', 0, 0), ('filip', 0, 0)
        ON CONFLICT (player) DO UPDATE SET
          current_streak = 0,
          best_streak = 0,
          updated_at = NOW()
      `);
      console.log('✅ Reset streak counters to zero');

      // Delete entries if table exists
      try {
        await pool.query('DELETE FROM entries');
        console.log('✅ Deleted all entries (legacy data)');
      } catch (err) {
        // Table doesn't exist, that's fine
      }

      console.log('\n🎉 Data wipe complete!');
      console.log('\nSummary:');
      console.log(`  - ${gamesCount.rows[0].count} games deleted`);
      console.log(`  - ${achievementsCount.rows[0].count} achievements deleted`);
      console.log(`  - ${streaksCount.rows[0].count} streak records reset`);
      if (entriesCount > 0) {
        console.log(`  - ${entriesCount} legacy entries deleted`);
      }
      console.log('\n✨ Ready to test new scoring system!\n');

    } catch (error) {
      console.error('\n❌ Error wiping data:', error);
    } finally {
      rl.close();
      await pool.end();
    }
  });
}

wipeAllData();
