require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function initializeDatabase() {
    console.log('Initializing database...');
    console.log('Using POSTGRES_URL:', process.env.POSTGRES_URL ? 'Set' : 'Not set');

    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
    });

    try {
        // Test connection first
        console.log('Testing connection...');
        const timeResult = await pool.query('SELECT NOW() as current_time');
        console.log('✅ Connection successful:', timeResult.rows[0].current_time);

        // Create entries table
        console.log('Creating entries table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS entries (
                id SERIAL PRIMARY KEY,
                date DATE UNIQUE NOT NULL,
                data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Entries table created/verified');

        // Create achievements table
        console.log('Creating achievements table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS achievements (
                id SERIAL PRIMARY KEY,
                achievement_id VARCHAR(255) NOT NULL,
                player VARCHAR(50) NOT NULL,
                unlocked_at TIMESTAMP NOT NULL,
                data JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(achievement_id, player, unlocked_at)
            )
        `);
        console.log('✅ Achievements table created/verified');

        // Create streaks table
        console.log('Creating streaks table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS streaks (
                id SERIAL PRIMARY KEY,
                player VARCHAR(50) UNIQUE NOT NULL,
                current_streak INTEGER DEFAULT 0,
                best_streak INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Streaks table created/verified');

        // Initialize default streak records
        console.log('Initializing default streak records...');
        await pool.query(`
            INSERT INTO streaks (player, current_streak, best_streak)
            VALUES ('faidao', 0, 0), ('filip', 0, 0)
            ON CONFLICT (player) DO NOTHING
        `);
        console.log('✅ Default streak records initialized');

        // Verify tables exist
        console.log('Verifying tables...');
        const tableCheck = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('entries', 'achievements', 'streaks')
            ORDER BY table_name
        `);
        console.log('✅ Tables verified:', tableCheck.rows.map(row => row.table_name));

        console.log('\n🎉 Database initialization completed successfully!');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('Database connection closed');
    }
}

initializeDatabase();