require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');

async function initializeDatabase() {

    const pool = new Pool({
        connectionString: process.env.POSTGRES_PRISMA_URL,
        ssl: {
            rejectUnauthorized: false,
            checkServerIdentity: () => undefined
        },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
    });

    try {
        // Test connection first
        const timeResult = await pool.query('SELECT NOW() as current_time');

        // Create entries table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS entries (
                id SERIAL PRIMARY KEY,
                date DATE UNIQUE NOT NULL,
                data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create achievements table
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

        // Create streaks table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS streaks (
                id SERIAL PRIMARY KEY,
                player VARCHAR(50) UNIQUE NOT NULL,
                current_streak INTEGER DEFAULT 0,
                best_streak INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create challenges table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS challenges (
                id SERIAL PRIMARY KEY,
                challenge_id VARCHAR(255) UNIQUE NOT NULL,
                data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Initialize default streak records
        await pool.query(`
            INSERT INTO streaks (player, current_streak, best_streak)
            VALUES ('faidao', 0, 0), ('filip', 0, 0)
            ON CONFLICT (player) DO NOTHING
        `);

        // Verify tables exist
        const tableCheck = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('entries', 'achievements', 'streaks', 'challenges')
            ORDER BY table_name
        `);


    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

initializeDatabase();