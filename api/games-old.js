const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_PRISMA_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { date } = req.query;
    
    // Return empty progress structure
    const progress = {
      faidao: { easy: null, medium: null, hard: null },
      filip: { easy: null, medium: null, hard: null }
    };

    return res.status(200).json(progress);
  } catch (error) {
    console.error('Games API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};
