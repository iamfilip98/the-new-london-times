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

  rl.question('Type "YES" to confirm data wipe: ', async (answer) => {
    if (answer !== 'YES') {
      rl.close();
      await pool.end();
      return;
    }

    try {

      // Get counts before deletion
      const gamesCount = await pool.query('SELECT COUNT(*) FROM individual_games');
      const achievementsCount = await pool.query('SELECT COUNT(*) FROM achievements');
      const streaksCount = await pool.query('SELECT COUNT(*) FROM streaks');


      // Try to get entries count (may not exist)
      let entriesCount = 0;
      try {
        const result = await pool.query('SELECT COUNT(*) FROM entries');
        entriesCount = result.rows[0].count;
      } catch (err) {
      }


      // Delete all data
      await pool.query('DELETE FROM individual_games');

      await pool.query('DELETE FROM achievements');

      await pool.query('DELETE FROM streaks');

      // Reset streaks to zero
      await pool.query(`
        INSERT INTO streaks (player, current_streak, best_streak)
        VALUES ('faidao', 0, 0), ('filip', 0, 0)
        ON CONFLICT (player) DO UPDATE SET
          current_streak = 0,
          best_streak = 0,
          updated_at = NOW()
      `);

      // Delete entries if table exists
      try {
        await pool.query('DELETE FROM entries');
      } catch (err) {
        // Table doesn't exist, that's fine
      }

      if (entriesCount > 0) {
      }

    } catch (error) {
      console.error('\n❌ Error wiping data:', error);
    } finally {
      rl.close();
      await pool.end();
    }
  });
}

wipeAllData();
