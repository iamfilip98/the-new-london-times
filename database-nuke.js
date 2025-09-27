#!/usr/bin/env node

/**
 * DATABASE NUKE - Direct database reset using @vercel/postgres
 */

async function nukeDatabase() {
    try {
        // Import the same sql connection used by the app
        const { sql } = require('@vercel/postgres');

        console.log('💣 NUKING DATABASE TABLES...');

        // Clear all tables in the correct order (avoiding foreign key constraints)
        await sql`DELETE FROM achievements`;
        console.log('✅ achievements table cleared');

        await sql`DELETE FROM entries`;
        console.log('✅ entries table cleared');

        await sql`DELETE FROM streaks`;
        console.log('✅ streaks table cleared');

        // Also clear any other tables that might exist
        try {
            await sql`DELETE FROM daily_puzzles`;
            console.log('✅ daily_puzzles table cleared');
        } catch (e) {
            console.log('ℹ️  daily_puzzles table not found or already empty');
        }

        try {
            await sql`DELETE FROM game_states`;
            console.log('✅ game_states table cleared');
        } catch (e) {
            console.log('ℹ️  game_states table not found or already empty');
        }

        console.log('🎉 DATABASE COMPLETELY NUKED!');
        console.log('📊 All tables are now empty');

        await sql.end();
        return true;

    } catch (error) {
        console.error('❌ Database nuke failed:', error.message);
        return false;
    }
}

if (require.main === module) {
    nukeDatabase().then(success => {
        if (success) {
            console.log('✅ Database reset completed successfully');
            process.exit(0);
        } else {
            console.log('❌ Database reset failed');
            process.exit(1);
        }
    });
}

module.exports = { nukeDatabase };