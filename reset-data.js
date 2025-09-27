#!/usr/bin/env node

/**
 * Reset Times and Achievements Script
 *
 * This script resets:
 * - Best times for all difficulties (easy, medium, hard)
 * - Streak count
 * - All achievements (both local storage and database)
 *
 * Usage: node reset-data.js
 */

const fs = require('fs');
const path = require('path');

// Database connection
let sql;
try {
    // Try to use Vercel postgres (same as the app)
    const { sql: vercelSql } = require('@vercel/postgres');
    sql = vercelSql;
    console.log('✅ Database connection established (using Vercel postgres)');
} catch (error) {
    try {
        // Fallback to regular postgres
        const postgres = require('postgres');

        // Database configuration - adjust these values as needed
        const DB_CONFIG = {
            host: process.env.PGHOST || 'localhost',
            port: process.env.PGPORT || 5432,
            database: process.env.PGDATABASE || 'london_times',
            username: process.env.PGUSER || 'your_username',
            password: process.env.PGPASSWORD || 'your_password',
        };

        sql = postgres(DB_CONFIG);
        console.log('✅ Database connection established (using postgres)');
    } catch (fallbackError) {
        console.warn('⚠️  Database not available:', fallbackError.message);
        console.log('📝 Only localStorage data will be reset');
    }
}

async function resetDatabase() {
    if (!sql) {
        console.log('⏭️  Skipping database reset (no connection)');
        return;
    }

    try {
        // Reset achievements table
        await sql`DELETE FROM achievements`;
        console.log('✅ Cleared all achievements from database');

        // Reset entries table (this removes all game history)
        const result = await sql`DELETE FROM entries`;
        console.log(`✅ Cleared ${result.count || 0} game entries from database`);

        // Reset streaks table
        await sql`DELETE FROM streaks`;
        console.log('✅ Cleared all streaks from database');

        console.log('🎉 Database reset completed successfully!');
    } catch (error) {
        console.error('❌ Error resetting database:', error.message);
        throw error;
    }
}

function generateLocalStorageResetScript() {
    return `
// Run this in your browser console to reset localStorage data
console.log('🔄 Resetting localStorage data...');

// Reset best times
localStorage.removeItem('sudoku_best_times');
console.log('✅ Cleared best times');

// Reset streak count
localStorage.removeItem('sudoku_streak');
console.log('✅ Cleared streak count');

// Reset settings (optional - uncomment if you want to reset settings too)
// localStorage.removeItem('sudoku_settings');
// console.log('✅ Cleared settings');

// Clear all game state and completed games
let cleared = 0;
const keysToRemove = [];

for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
        key.startsWith('sudoku_') ||
        key.startsWith('completed_') ||
        key.includes('partial_entry_') ||
        key.includes('game_state_') ||
        key.includes('notifications_')
    )) {
        keysToRemove.push(key);
    }
}

keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    cleared++;
});

console.log(\`✅ Cleared \${cleared} additional localStorage entries\`);
console.log('🎉 localStorage reset completed!');
console.log('🔄 Please refresh the page to see changes');
`;
}

async function main() {
    console.log('🚀 Starting reset process...');
    console.log('');

    try {
        // Reset database
        await resetDatabase();
        console.log('');

        // Generate localStorage reset script
        const script = generateLocalStorageResetScript();

        // Save the script to a file for easy copy-paste
        const scriptPath = path.join(__dirname, 'browser-reset-script.js');
        fs.writeFileSync(scriptPath, script.trim());

        console.log('📋 Browser localStorage reset script saved to: browser-reset-script.js');
        console.log('');
        console.log('📝 NEXT STEPS:');
        console.log('1. Open your browser and navigate to your application');
        console.log('2. Open Developer Tools (F12)');
        console.log('3. Go to the Console tab');
        console.log('4. Copy and paste the contents of browser-reset-script.js');
        console.log('5. Press Enter to execute');
        console.log('6. Refresh the page');
        console.log('');
        console.log('🎉 All data will be reset to zero!');

    } catch (error) {
        console.error('❌ Reset failed:', error.message);
        process.exit(1);
    } finally {
        if (sql) {
            await sql.end();
        }
    }
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { resetDatabase, generateLocalStorageResetScript };