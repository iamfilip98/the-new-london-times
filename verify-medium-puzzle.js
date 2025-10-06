// Script to verify today's medium puzzle has only one solution
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

// Convert 81-character string to grid
function stringToGrid(str) {
  const grid = [];
  for (let i = 0; i < 9; i++) {
    grid.push(str.slice(i * 9, (i + 1) * 9).split('').map(Number));
  }
  return grid;
}

// Count solutions (from api/puzzles.js)
function countSolutions(puzzle, maxSolutions = 2) {
  // First check if the puzzle has any immediate conflicts
  if (!isValidPuzzleState(puzzle)) {
    return 0; // Invalid puzzle
  }

  const solutions = [];
  const testGrid = puzzle.map(row => [...row]);

  function isValidForSolver(grid, row, col, num) {
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

  function solveAndCount(grid) {
    if (solutions.length >= maxSolutions) return; // Stop if we found enough solutions

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          let foundValid = false;
          for (let num = 1; num <= 9; num++) {
            if (isValidForSolver(grid, row, col, num)) {
              foundValid = true;
              grid[row][col] = num;
              solveAndCount(grid);
              grid[row][col] = 0;

              // Early exit if we found enough solutions
              if (solutions.length >= maxSolutions) return;
            }
          }
          if (!foundValid) return; // No valid numbers for this cell
          return; // Processed this empty cell
        }
      }
    }

    // Grid is complete - found a solution
    solutions.push(grid.map(row => [...row]));
  }

  solveAndCount(testGrid);
  return solutions.length;
}

// Helper function to check if puzzle has any immediate conflicts
function isValidPuzzleState(puzzle) {
  // Check rows for duplicates
  for (let row = 0; row < 9; row++) {
    const seen = new Set();
    for (let col = 0; col < 9; col++) {
      const num = puzzle[row][col];
      if (num !== 0) {
        if (seen.has(num)) return false; // Duplicate in row
        seen.add(num);
      }
    }
  }

  // Check columns for duplicates
  for (let col = 0; col < 9; col++) {
    const seen = new Set();
    for (let row = 0; row < 9; row++) {
      const num = puzzle[row][col];
      if (num !== 0) {
        if (seen.has(num)) return false; // Duplicate in column
        seen.add(num);
      }
    }
  }

  // Check 3x3 boxes for duplicates
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const num = puzzle[boxRow * 3 + r][boxCol * 3 + c];
          if (num !== 0) {
            if (seen.has(num)) return false; // Duplicate in box
            seen.add(num);
          }
        }
      }
    }
  }

  return true; // No conflicts found
}

// Print grid
function printGrid(grid) {
  for (let row = 0; row < 9; row++) {
    if (row % 3 === 0 && row !== 0) {
      console.log('------+-------+------');
    }
    let rowStr = '';
    for (let col = 0; col < 9; col++) {
      if (col % 3 === 0 && col !== 0) {
        rowStr += '| ';
      }
      rowStr += (grid[row][col] === 0 ? '.' : grid[row][col]) + ' ';
    }
    console.log(rowStr);
  }
}

// Count clues
function countClues(grid) {
  let count = 0;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] !== 0) count++;
    }
  }
  return count;
}

async function verifyMediumPuzzle() {
  try {
    const today = '2025-09-26'; // Most recent puzzle date in DB
    console.log(`🔍 Verifying medium puzzle for ${today}...\n`);

    // Fetch today's puzzles from database
    const result = await sql`
      SELECT medium_puzzle FROM daily_puzzles WHERE date = ${today}
    `;

    if (result.rows.length === 0) {
      console.log('❌ No puzzle found for today. Generate one first.');
      process.exit(1);
    }

    const mediumPuzzleStr = result.rows[0].medium_puzzle;
    const mediumPuzzle = stringToGrid(mediumPuzzleStr);

    console.log('📋 Medium Puzzle:');
    printGrid(mediumPuzzle);

    const clueCount = countClues(mediumPuzzle);
    console.log(`\n📊 Clue count: ${clueCount}`);

    console.log('\n🧮 Counting solutions (this may take a moment)...');
    const solutionCount = countSolutions(mediumPuzzle, 2); // Check for up to 2 solutions

    console.log(`\n📈 Solution count: ${solutionCount}`);

    if (solutionCount === 1) {
      console.log('✅ SUCCESS: The medium puzzle has exactly ONE solution!');
      process.exit(0);
    } else if (solutionCount === 0) {
      console.log('❌ FAIL: The medium puzzle has NO solutions!');
      process.exit(1);
    } else {
      console.log(`❌ FAIL: The medium puzzle has MULTIPLE solutions (${solutionCount}+)!`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyMediumPuzzle();
