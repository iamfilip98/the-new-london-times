require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_PRISMA_URL,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  },
  max: 3,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 10000
});

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Ensure ratings table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS puzzle_ratings (
        id SERIAL PRIMARY KEY,
        player VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        difficulty VARCHAR(10) NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
        time INTEGER NOT NULL,
        errors INTEGER NOT NULL,
        hints INTEGER NOT NULL,
        score DECIMAL(10,2) NOT NULL,
        puzzle_grid TEXT NOT NULL,
        puzzle_solution TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create index for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ratings_player_date
      ON puzzle_ratings(player, date)
    `);

    if (req.method === 'GET') {
      // Retrieve ratings
      const { player, startDate, endDate, limit } = req.query;

      let query = 'SELECT * FROM puzzle_ratings WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (player) {
        query += ` AND player = $${paramIndex}`;
        params.push(player);
        paramIndex++;
      }

      if (startDate) {
        query += ` AND date >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND date <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      query += ' ORDER BY timestamp DESC';

      if (limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(parseInt(limit));
      }

      const result = await pool.query(query, params);

      return res.status(200).json({
        success: true,
        ratings: result.rows,
        count: result.rows.length
      });

    } else if (req.method === 'POST') {
      // Store new rating
      const { player, date, timestamp, difficulty, rating, time, errors, hints, score, puzzle } = req.body;

      // Validate required fields
      if (!player || !date || !timestamp || !difficulty || !rating || time === undefined || errors === undefined || hints === undefined || score === undefined || !puzzle) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['player', 'date', 'timestamp', 'difficulty', 'rating', 'time', 'errors', 'hints', 'score', 'puzzle']
        });
      }

      // Validate rating range
      if (rating < 1 || rating > 10) {
        return res.status(400).json({
          error: 'Rating must be between 1 and 10'
        });
      }

      // Insert rating
      const result = await pool.query(`
        INSERT INTO puzzle_ratings (
          player, date, timestamp, difficulty, rating,
          time, errors, hints, score, puzzle_grid, puzzle_solution
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        player,
        date,
        timestamp,
        difficulty,
        rating,
        time,
        errors,
        hints,
        score,
        puzzle.grid,
        puzzle.solution
      ]);

      return res.status(201).json({
        success: true,
        message: 'Rating saved successfully',
        rating: result.rows[0]
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Ratings API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};
