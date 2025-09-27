#!/usr/bin/env node

/**
 * NUCLEAR RESET - Completely wipe all data
 * This script will completely reset EVERYTHING:
 * - All database tables (entries, achievements, streaks)
 * - All localStorage data
 * - All browser cache and application state
 */

const path = require('path');

// Try to connect to database using the same method as the app
async function connectToDatabase() {
    try {
        // Import the database connection from the app
        const dbPath = path.join(__dirname, 'lib', 'db.js');
        console.log('Attempting to connect to database...');

        // Try Vercel postgres first
        const { sql } = require('@vercel/postgres');
        return sql;
    } catch (error) {
        console.log('Vercel postgres not available, database reset will be skipped');
        return null;
    }
}

async function nukeDatabase(sql) {
    if (!sql) {
        console.log('⏭️  Skipping database reset (no connection)');
        return;
    }

    try {
        console.log('💣 NUKING DATABASE...');

        // Delete all data from all tables
        await sql`TRUNCATE TABLE achievements RESTART IDENTITY CASCADE`;
        console.log('✅ Achievements table cleared');

        await sql`TRUNCATE TABLE entries RESTART IDENTITY CASCADE`;
        console.log('✅ Entries table cleared');

        await sql`TRUNCATE TABLE streaks RESTART IDENTITY CASCADE`;
        console.log('✅ Streaks table cleared');

        console.log('🎉 Database completely cleared!');
    } catch (error) {
        console.error('❌ Database reset failed:', error.message);
        // Don't throw - continue with localStorage reset
    }
}

function generateNuclearBrowserScript() {
    return `
// NUCLEAR RESET - Run this in your browser console
console.log('💣 NUCLEAR RESET - Clearing ALL data...');

// 1. Clear ALL localStorage
console.log('🧹 Clearing localStorage...');
localStorage.clear();
console.log('✅ localStorage cleared');

// 2. Clear ALL sessionStorage
console.log('🧹 Clearing sessionStorage...');
sessionStorage.clear();
console.log('✅ sessionStorage cleared');

// 3. Reset app state if available
if (window.achievementsManager) {
    console.log('🎯 Resetting achievements manager...');
    window.achievementsManager.unlockedAchievements = [];
    window.achievementsManager.needsInitialCleanup = true;
}

if (window.sudokuEngine) {
    console.log('🎮 Resetting sudoku engine...');
    window.sudokuEngine.bestTime = { easy: null, medium: null, hard: null };
    window.sudokuEngine.streakCount = 0;
    window.sudokuEngine.timer = 0;
    window.sudokuEngine.hints = 0;
    window.sudokuEngine.errors = 0;
    window.sudokuEngine.gameStarted = false;
    window.sudokuEngine.gameCompleted = false;
}

if (window.sudokuApp) {
    console.log('📱 Resetting sudoku app...');
    // Reset any cached data
    window.sudokuApp.dailyPuzzles = null;
    window.sudokuApp.entries = [];
}

// 4. Clear any cached API data
console.log('🌐 Clearing any cached data...');

// 5. Force reload to ensure clean state
console.log('🎉 NUCLEAR RESET COMPLETE!');
console.log('🔄 Reloading page in 2 seconds...');

setTimeout(() => {
    window.location.reload(true); // Force reload
}, 2000);
`;
}

async function main() {
    console.log('💣 NUCLEAR RESET INITIATED');
    console.log('This will destroy ALL data and start completely fresh');
    console.log('');

    // Connect to database
    const sql = await connectToDatabase();

    // Reset database
    await nukeDatabase(sql);

    // Generate browser script
    const browserScript = generateNuclearBrowserScript();
    const scriptPath = path.join(__dirname, 'nuclear-browser-reset.js');
    require('fs').writeFileSync(scriptPath, browserScript.trim());

    console.log('');
    console.log('📋 Browser reset script created: nuclear-browser-reset.js');
    console.log('');
    console.log('🚨 FINAL STEP - RUN THIS IN YOUR BROWSER:');
    console.log('1. Open your website in browser');
    console.log('2. Open Developer Tools (F12)');
    console.log('3. Go to Console tab');
    console.log('4. Copy and paste the contents of nuclear-browser-reset.js');
    console.log('5. Press Enter');
    console.log('6. Page will automatically reload with fresh data');
    console.log('');
    console.log('💣 NUCLEAR RESET READY TO EXECUTE!');

    if (sql) {
        await sql.end();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { nukeDatabase, generateNuclearBrowserScript };