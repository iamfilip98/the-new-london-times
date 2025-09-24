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

// Initialize database tables for daily puzzles
async function initPuzzleDatabase() {
  try {
    // Create daily_puzzles table
    await sql`
      CREATE TABLE IF NOT EXISTS daily_puzzles (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        easy_puzzle TEXT NOT NULL,
        medium_puzzle TEXT NOT NULL,
        hard_puzzle TEXT NOT NULL,
        easy_solution TEXT NOT NULL,
        medium_solution TEXT NOT NULL,
        hard_solution TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create game_states table for individual player progress
    await sql`
      CREATE TABLE IF NOT EXISTS game_states (
        id SERIAL PRIMARY KEY,
        player VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        difficulty VARCHAR(10) NOT NULL,
        current_state TEXT,
        timer_seconds INTEGER DEFAULT 0,
        hints_used INTEGER DEFAULT 0,
        errors_made INTEGER DEFAULT 0,
        completed_at TIMESTAMP NULL,
        last_updated TIMESTAMP DEFAULT NOW(),
        UNIQUE(player, date, difficulty)
      )
    `;

    return true;
  } catch (error) {
    console.error('Failed to initialize puzzle database:', error);
    throw error;
  }
}

/**
 * Reset all daily puzzles for a specific date
 * @param {string} date - Date in YYYY-MM-DD format (optional, defaults to today)
 * @returns {Promise<boolean>} - Success status
 */
async function resetDailyPuzzles(date) {
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    console.log(`🔄 Resetting daily puzzles for ${targetDate}...`);

    // Initialize database tables if they don't exist
    await initPuzzleDatabase();

    // Delete daily puzzles for the date
    const puzzleResult = await sql`
      DELETE FROM daily_puzzles
      WHERE date = ${targetDate}
    `;

    console.log(`✅ Deleted daily puzzle records for ${targetDate}`);

    // Delete all game states for the date
    const stateResult = await sql`
      DELETE FROM game_states
      WHERE date = ${targetDate}
    `;

    console.log(`✅ Deleted game state records for ${targetDate}`);

    console.log(`🎯 Successfully reset all puzzles for ${targetDate}`);
    console.log(`💡 New puzzles will be generated automatically when accessed`);

    return true;
  } catch (error) {
    console.error('❌ Failed to reset daily puzzles:', error);
    throw error;
  }
}

/**
 * Reset all daily puzzles and clear localStorage for development
 * @param {string} date - Date in YYYY-MM-DD format (optional, defaults to today)
 * @returns {Promise<boolean>} - Success status
 */
async function resetAllPuzzleData(date) {
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    console.log(`🔄 Full reset of puzzle data for ${targetDate}...`);

    // Reset database
    await resetDailyPuzzles(targetDate);

    console.log(`📝 Manual localStorage cleanup required:`);
    console.log(`   - Open browser dev tools (F12)`);
    console.log(`   - Go to Application tab > Local Storage`);
    console.log(`   - Clear items starting with: completed_faidao_${targetDate}_, completed_filip_${targetDate}_`);
    console.log(`   - Or run: localStorage.clear() in console for full reset`);

    return true;
  } catch (error) {
    console.error('❌ Failed to reset puzzle data:', error);
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const date = args[1];

  switch (command) {
    case 'reset':
      resetDailyPuzzles(date)
        .then(() => {
          console.log('🏁 Reset completed successfully!');
          process.exit(0);
        })
        .catch(error => {
          console.error('❌ Reset failed:', error.message);
          process.exit(1);
        });
      break;

    case 'full-reset':
      resetAllPuzzleData(date)
        .then(() => {
          console.log('🏁 Full reset completed successfully!');
          process.exit(0);
        })
        .catch(error => {
          console.error('❌ Full reset failed:', error.message);
          process.exit(1);
        });
      break;

    default:
      console.log('📋 Daily Puzzle Reset Tool');
      console.log('');
      console.log('Usage:');
      console.log('  node reset-daily-puzzles.js reset [YYYY-MM-DD]          # Reset puzzles for specific date (default: today)');
      console.log('  node reset-daily-puzzles.js full-reset [YYYY-MM-DD]     # Full reset including localStorage instructions');
      console.log('');
      console.log('Examples:');
      console.log('  node reset-daily-puzzles.js reset                       # Reset today\'s puzzles');
      console.log('  node reset-daily-puzzles.js reset 2024-03-15            # Reset puzzles for March 15, 2024');
      console.log('  node reset-daily-puzzles.js full-reset                  # Full reset for today');
      console.log('');
      console.log('⚠️  Warning: This will delete all puzzle progress for the specified date!');
      process.exit(0);
  }
}

module.exports = {
  resetDailyPuzzles,
  resetAllPuzzleData
};