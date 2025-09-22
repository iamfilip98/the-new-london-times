require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function testDatabase() {
    console.log('Testing database connection...');
    console.log('POSTGRES_URL exists:', !!process.env.POSTGRES_URL);

    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL_NON_POOLING + '&sslmode=disable',
        // Add better connection handling
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
    });

    try {
        // Test basic connection
        console.log('Testing basic connection...');
        const result = await pool.query('SELECT NOW() as current_time');
        console.log('✅ Database connection successful');
        console.log('Current time:', result.rows[0].current_time);

        // Test if tables exist
        console.log('\nChecking if tables exist...');
        const tableCheck = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('entries', 'achievements', 'streaks')
            ORDER BY table_name
        `);

        console.log('Existing tables:', tableCheck.rows.map(row => row.table_name));

        // Test entries table
        if (tableCheck.rows.some(row => row.table_name === 'entries')) {
            console.log('\nTesting entries table...');
            const entriesResult = await pool.query('SELECT COUNT(*) as count FROM entries');
            console.log('Entries count:', entriesResult.rows[0].count);

            const entriesData = await pool.query('SELECT date, data FROM entries ORDER BY date DESC LIMIT 3');
            console.log('Recent entries:', entriesData.rows);
        } else {
            console.log('❌ entries table does not exist');
        }

    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        console.error('Full error:', error);
    } finally {
        await pool.end();
        console.log('\nDatabase connection closed');
    }
}

testDatabase();