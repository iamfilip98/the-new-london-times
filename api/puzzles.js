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

// Generate a complete valid Sudoku solution
function generateCompleteSolution() {
  const grid = Array(9).fill().map(() => Array(9).fill(0));

  function isValid(grid, row, col, num) {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }

    // Check 3x3 box
    const startRow = row - row % 3;
    const startCol = col - col % 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[i + startRow][j + startCol] === num) return false;
      }
    }

    return true;
  }

  function solve(grid) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

          // Shuffle for randomness
          for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
          }

          for (let num of numbers) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num;

              if (solve(grid)) {
                return true;
              }

              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve(grid);
  return grid;
}

// Generate puzzle from solution by removing numbers
function generatePuzzle(solution, difficulty) {
  const puzzle = solution.map(row => [...row]);

  const cellsToRemove = {
    easy: 35,    // ~46 given numbers - more approachable
    medium: 45,  // ~36 given numbers - balanced challenge
    hard: 52     // ~29 given numbers - difficult but fair
  };

  const positions = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      positions.push([i, j]);
    }
  }

  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  let removed = 0;
  const targetCells = cellsToRemove[difficulty];

  // Enhanced removal strategy for better playability
  // Remove cells in multiple passes to ensure even distribution

  // Pass 1: Remove cells symmetrically for better visual balance
  const symmetricPositions = [];
  for (let i = 0; i < Math.floor(positions.length / 2); i++) {
    const [row, col] = positions[i];
    const symRow = 8 - row;
    const symCol = 8 - col;

    symmetricPositions.push([row, col]);
    if (row !== symRow || col !== symCol) {
      symmetricPositions.push([symRow, symCol]);
    }
  }

  // Shuffle symmetric positions
  for (let i = symmetricPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symmetricPositions[i], symmetricPositions[j]] = [symmetricPositions[j], symmetricPositions[i]];
  }

  // Remove cells with some strategy based on difficulty
  for (let [row, col] of symmetricPositions) {
    if (removed >= targetCells) break;

    if (puzzle[row][col] !== 0) {
      // For easier difficulties, prefer removing cells that leave more clues in their region
      if (difficulty === 'easy') {
        const regionClues = countRegionClues(puzzle, row, col);
        if (regionClues < 3) continue; // Don't remove if region would have too few clues
      }

      puzzle[row][col] = 0;
      removed++;
    }
  }

  // If we haven't removed enough cells, finish with remaining positions
  for (let [row, col] of positions) {
    if (removed >= targetCells) break;

    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      removed++;
    }
  }

  return puzzle;
}

// Helper function to count clues in a 3x3 region
function countRegionClues(grid, row, col) {
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  let count = 0;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[startRow + i][startCol + j] !== 0) {
        count++;
      }
    }
  }

  return count;
}

// Convert grid to 81-character string
function gridToString(grid) {
  return grid.flat().join('');
}

// Convert 81-character string to grid
function stringToGrid(str) {
  const grid = [];
  for (let i = 0; i < 9; i++) {
    grid.push(str.slice(i * 9, (i + 1) * 9).split('').map(Number));
  }
  return grid;
}

// Generate daily puzzles for a specific date
async function generateDailyPuzzles(date) {
  try {
    const solution = generateCompleteSolution();

    const puzzles = {
      easy: generatePuzzle(solution, 'easy'),
      medium: generatePuzzle(solution, 'medium'),
      hard: generatePuzzle(solution, 'hard')
    };

    // Store in database
    await sql`
      INSERT INTO daily_puzzles (
        date,
        easy_puzzle, medium_puzzle, hard_puzzle,
        easy_solution, medium_solution, hard_solution
      )
      VALUES (
        ${date},
        ${gridToString(puzzles.easy)},
        ${gridToString(puzzles.medium)},
        ${gridToString(puzzles.hard)},
        ${gridToString(solution)},
        ${gridToString(solution)},
        ${gridToString(solution)}
      )
      ON CONFLICT (date) DO UPDATE SET
        easy_puzzle = ${gridToString(puzzles.easy)},
        medium_puzzle = ${gridToString(puzzles.medium)},
        hard_puzzle = ${gridToString(puzzles.hard)},
        easy_solution = ${gridToString(solution)},
        medium_solution = ${gridToString(solution)},
        hard_solution = ${gridToString(solution)}
    `;

    return {
      easy: { puzzle: puzzles.easy, solution },
      medium: { puzzle: puzzles.medium, solution },
      hard: { puzzle: puzzles.hard, solution }
    };

  } catch (error) {
    console.error('Failed to generate daily puzzles:', error);
    throw error;
  }
}

// Get daily puzzles for a specific date
async function getDailyPuzzles(date) {
  try {
    const result = await sql`
      SELECT * FROM daily_puzzles WHERE date = ${date}
    `;

    if (result.rows.length === 0) {
      // Generate puzzles if they don't exist
      return await generateDailyPuzzles(date);
    }

    const row = result.rows[0];
    return {
      easy: {
        puzzle: stringToGrid(row.easy_puzzle),
        solution: stringToGrid(row.easy_solution)
      },
      medium: {
        puzzle: stringToGrid(row.medium_puzzle),
        solution: stringToGrid(row.medium_solution)
      },
      hard: {
        puzzle: stringToGrid(row.hard_puzzle),
        solution: stringToGrid(row.hard_solution)
      }
    };

  } catch (error) {
    console.error('Failed to get daily puzzles:', error);
    throw error;
  }
}

// Save/load game state
async function saveGameState(player, date, difficulty, state) {
  try {
    await sql`
      INSERT INTO game_states (
        player, date, difficulty, current_state,
        timer_seconds, hints_used, errors_made, last_updated
      )
      VALUES (
        ${player}, ${date}, ${difficulty}, ${JSON.stringify(state)},
        ${state.timer || 0}, ${state.hints || 0}, ${state.errors || 0}, NOW()
      )
      ON CONFLICT (player, date, difficulty) DO UPDATE SET
        current_state = ${JSON.stringify(state)},
        timer_seconds = ${state.timer || 0},
        hints_used = ${state.hints || 0},
        errors_made = ${state.errors || 0},
        last_updated = NOW()
    `;

    return true;
  } catch (error) {
    console.error('Failed to save game state:', error);
    throw error;
  }
}

async function getGameState(player, date, difficulty) {
  try {
    const result = await sql`
      SELECT * FROM game_states
      WHERE player = ${player} AND date = ${date} AND difficulty = ${difficulty}
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...JSON.parse(row.current_state),
      timer: row.timer_seconds,
      hints: row.hints_used,
      errors: row.errors_made,
      lastUpdated: row.last_updated
    };

  } catch (error) {
    console.error('Failed to get game state:', error);
    return null;
  }
}

module.exports = async function handler(req, res) {
  // Initialize database on first request
  try {
    await initPuzzleDatabase();
  } catch (error) {
    console.error('Puzzle database initialization failed:', error);
    return res.status(500).json({ error: 'Database initialization failed' });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { date, player, difficulty } = req.query;

        if (player && date && difficulty) {
          // Get specific game state
          const gameState = await getGameState(player, date, difficulty);
          return res.status(200).json(gameState);
        } else if (date) {
          // Get daily puzzles
          const puzzles = await getDailyPuzzles(date);
          return res.status(200).json(puzzles);
        } else {
          // Get today's puzzles
          const today = new Date().toISOString().split('T')[0];
          const puzzles = await getDailyPuzzles(today);
          return res.status(200).json(puzzles);
        }
      }

      case 'POST': {
        const { action, player, date, difficulty, state } = req.body;

        if (action === 'generate' && date) {
          // Generate new puzzles for specific date
          const puzzles = await generateDailyPuzzles(date);
          return res.status(200).json(puzzles);
        } else if (action === 'save' && player && date && difficulty && state) {
          // Save game state
          await saveGameState(player, date, difficulty, state);
          return res.status(200).json({ success: true });
        } else if (action === 'reset' && date) {
          // Reset puzzles and game states for specific date
          await sql`DELETE FROM daily_puzzles WHERE date = ${date}`;
          await sql`DELETE FROM game_states WHERE date = ${date}`;
          return res.status(200).json({
            success: true,
            message: `Reset completed for ${date}`
          });
        } else {
          return res.status(400).json({ error: 'Invalid request parameters' });
        }
      }

      case 'DELETE': {
        const { date } = req.body;

        if (date) {
          // Delete puzzles and game states for specific date
          await sql`DELETE FROM daily_puzzles WHERE date = ${date}`;
          await sql`DELETE FROM game_states WHERE date = ${date}`;
          return res.status(200).json({
            success: true,
            message: `Deleted all data for ${date}`
          });
        } else {
          return res.status(400).json({ error: 'Date parameter required' });
        }
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Puzzle API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};