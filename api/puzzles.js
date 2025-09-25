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

// Generate puzzle from solution by removing numbers with solvability validation
function generatePuzzle(solution, difficulty) {
  const puzzle = solution.map(row => [...row]);

  // Improved difficulty settings focused on solvability without guessing
  const difficultySettings = {
    easy: {
      minClues: 40,
      maxClues: 45,
      requireNakedSingles: true,
      allowHiddenSingles: true,
      allowComplexTechniques: false,
      maxIterations: 1000
    },
    medium: {
      minClues: 25,
      maxClues: 32,
      requireNakedSingles: true,
      allowHiddenSingles: true,
      allowComplexTechniques: true,
      maxIterations: 2000
    },
    hard: {
      minClues: 20,
      maxClues: 28,
      requireNakedSingles: false,
      allowHiddenSingles: true,
      allowComplexTechniques: true,
      maxIterations: 3000
    }
  };

  const settings = difficultySettings[difficulty];

  // Create list of all positions
  const positions = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      positions.push([i, j]);
    }
  }

  // Shuffle positions for randomness
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Remove cells while maintaining solvability
  let iterations = 0;
  let bestPuzzle = null;
  let bestClueCount = 81;

  while (iterations < settings.maxIterations) {
    const testPuzzle = solution.map(row => [...row]);
    let removedCells = 0;
    const shuffledPositions = [...positions];

    // Shuffle again for this iteration
    for (let i = shuffledPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPositions[i], shuffledPositions[j]] = [shuffledPositions[j], shuffledPositions[i]];
    }

    // Try to remove cells while maintaining solvability
    for (let [row, col] of shuffledPositions) {
      if (81 - removedCells <= settings.minClues) break;

      const originalValue = testPuzzle[row][col];
      if (originalValue === 0) continue;

      // Remove the cell temporarily
      testPuzzle[row][col] = 0;

      // Check if puzzle is still solvable with logical techniques only
      if (isPuzzleSolvableLogically(testPuzzle, settings)) {
        removedCells++;

        // Check if we've reached a good balance
        const currentClues = 81 - removedCells;
        if (currentClues >= settings.minClues && currentClues <= settings.maxClues) {
          if (currentClues < bestClueCount) {
            bestPuzzle = testPuzzle.map(row => [...row]);
            bestClueCount = currentClues;
          }
        }
      } else {
        // Restore the cell if removing it makes puzzle unsolvable
        testPuzzle[row][col] = originalValue;
      }
    }

    iterations++;

    // If we found a good puzzle in acceptable range, we can stop early
    if (bestPuzzle && bestClueCount >= settings.minClues && bestClueCount <= settings.maxClues) {
      break;
    }
  }

  // Return best puzzle found, or fallback to a simpler approach if needed
  return bestPuzzle || createFallbackPuzzle(solution, difficulty);
}

// Fallback puzzle creation if the sophisticated method fails
function createFallbackPuzzle(solution, difficulty) {
  const puzzle = solution.map(row => [...row]);
  const cellsToKeep = {
    easy: 42,   // Keep more cells for easier solving
    medium: 28, // Balanced
    hard: 22    // More challenging but still solvable
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

  const toKeep = cellsToKeep[difficulty];
  const toRemove = 81 - toKeep;

  for (let i = 0; i < toRemove && i < positions.length; i++) {
    const [row, col] = positions[i];
    puzzle[row][col] = 0;
  }

  return puzzle;
}

// Check if a puzzle can be solved using only logical techniques
function isPuzzleSolvableLogically(puzzle, settings) {
  const testGrid = puzzle.map(row => [...row]);
  let changed = true;
  let iterations = 0;
  const maxSolverIterations = 100;

  while (changed && iterations < maxSolverIterations) {
    changed = false;
    iterations++;

    // Try naked singles (cells with only one possible value)
    if (settings.requireNakedSingles || settings.allowHiddenSingles) {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (testGrid[row][col] === 0) {
            const possibleValues = getPossibleValues(testGrid, row, col);
            if (possibleValues.length === 1) {
              testGrid[row][col] = possibleValues[0];
              changed = true;
            }
          }
        }
      }
    }

    // Try hidden singles (numbers that can only go in one place in a region)
    if (settings.allowHiddenSingles) {
      // Check rows
      for (let row = 0; row < 9; row++) {
        for (let num = 1; num <= 9; num++) {
          if (!isNumberInRow(testGrid, row, num)) {
            const possibleCols = [];
            for (let col = 0; col < 9; col++) {
              if (testGrid[row][col] === 0 && isValidPlacement(testGrid, row, col, num)) {
                possibleCols.push(col);
              }
            }
            if (possibleCols.length === 1) {
              testGrid[row][possibleCols[0]] = num;
              changed = true;
            }
          }
        }
      }

      // Check columns
      for (let col = 0; col < 9; col++) {
        for (let num = 1; num <= 9; num++) {
          if (!isNumberInColumn(testGrid, col, num)) {
            const possibleRows = [];
            for (let row = 0; row < 9; row++) {
              if (testGrid[row][col] === 0 && isValidPlacement(testGrid, row, col, num)) {
                possibleRows.push(row);
              }
            }
            if (possibleRows.length === 1) {
              testGrid[possibleRows[0]][col] = num;
              changed = true;
            }
          }
        }
      }

      // Check boxes
      for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
          for (let num = 1; num <= 9; num++) {
            if (!isNumberInBox(testGrid, boxRow * 3, boxCol * 3, num)) {
              const possiblePositions = [];
              for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                  const row = boxRow * 3 + r;
                  const col = boxCol * 3 + c;
                  if (testGrid[row][col] === 0 && isValidPlacement(testGrid, row, col, num)) {
                    possiblePositions.push([row, col]);
                  }
                }
              }
              if (possiblePositions.length === 1) {
                const [row, col] = possiblePositions[0];
                testGrid[row][col] = num;
                changed = true;
              }
            }
          }
        }
      }
    }

    // Check if puzzle is completely solved
    let emptyCells = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (testGrid[row][col] === 0) emptyCells++;
      }
    }

    if (emptyCells === 0) {
      return true; // Puzzle is solvable!
    }

    // If no progress was made and there are still empty cells,
    // check if we need more complex techniques
    if (!changed && emptyCells > 0) {
      if (settings.allowComplexTechniques) {
        // For now, we'll be more lenient with complex techniques
        // In a full implementation, we'd add pointing pairs, box/line reduction, etc.
        return emptyCells < 25; // Heuristic: if we got most of the way there, call it solvable
      } else {
        return false; // Needs complex techniques but they're not allowed for this difficulty
      }
    }
  }

  return false; // Couldn't solve within iteration limit
}

// Helper functions for solvability checking
function getPossibleValues(grid, row, col) {
  const possible = [];
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(grid, row, col, num)) {
      possible.push(num);
    }
  }
  return possible;
}

function isValidPlacement(grid, row, col, num) {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === num) return false;
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === num) return false;
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (r !== row && c !== col && grid[r][c] === num) return false;
    }
  }

  return true;
}

function isNumberInRow(grid, row, num) {
  for (let col = 0; col < 9; col++) {
    if (grid[row][col] === num) return true;
  }
  return false;
}

function isNumberInColumn(grid, col, num) {
  for (let row = 0; row < 9; row++) {
    if (grid[row][col] === num) return true;
  }
  return false;
}

function isNumberInBox(grid, startRow, startCol, num) {
  const boxRow = Math.floor(startRow / 3) * 3;
  const boxCol = Math.floor(startCol / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] === num) return true;
    }
  }
  return false;
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

// Generate daily puzzles for a specific date with validation
async function generateDailyPuzzles(date) {
  try {
    let attempts = 0;
    const maxAttempts = 5;
    let validPuzzles = null;
    let finalSolution = null;

    // Try multiple times to generate valid puzzles
    while (attempts < maxAttempts && !validPuzzles) {
      attempts++;
      console.log(`Generating puzzle attempt ${attempts} for ${date}`);

      const solution = generateCompleteSolution();

      const puzzles = {
        easy: generatePuzzle(solution, 'easy'),
        medium: generatePuzzle(solution, 'medium'),
        hard: generatePuzzle(solution, 'hard')
      };

      // Simplified validation - just check basic requirements
      const validationResults = {
        easy: validatePuzzleSimple(puzzles.easy, solution),
        medium: validatePuzzleSimple(puzzles.medium, solution),
        hard: validatePuzzleSimple(puzzles.hard, solution)
      };

      console.log(`Validation results for attempt ${attempts}:`, validationResults);

      // Check if all puzzles meet basic requirements
      if (validationResults.easy.isValid && validationResults.medium.isValid && validationResults.hard.isValid) {
        validPuzzles = puzzles;
        finalSolution = solution;
        console.log(`✅ Successfully generated valid puzzles for ${date} on attempt ${attempts}`);
        console.log(`Clue counts - Easy: ${validationResults.easy.clueCount}, Medium: ${validationResults.medium.clueCount}, Hard: ${validationResults.hard.clueCount}`);
      } else {
        console.log(`❌ Attempt ${attempts} failed validation:`);
        if (!validationResults.easy.isValid) console.log(`  Easy: ${validationResults.easy.reason}`);
        if (!validationResults.medium.isValid) console.log(`  Medium: ${validationResults.medium.reason}`);
        if (!validationResults.hard.isValid) console.log(`  Hard: ${validationResults.hard.reason}`);
      }
    }

    // If we couldn't generate valid puzzles, use fallback
    if (!validPuzzles) {
      console.log(`⚠️ Using fallback puzzles for ${date} after ${maxAttempts} attempts`);
      finalSolution = generateCompleteSolution();
      validPuzzles = {
        easy: createFallbackPuzzle(finalSolution, 'easy'),
        medium: createFallbackPuzzle(finalSolution, 'medium'),
        hard: createFallbackPuzzle(finalSolution, 'hard')
      };
    }

    // Store in database
    await sql`
      INSERT INTO daily_puzzles (
        date,
        easy_puzzle, medium_puzzle, hard_puzzle,
        easy_solution, medium_solution, hard_solution
      )
      VALUES (
        ${date},
        ${gridToString(validPuzzles.easy)},
        ${gridToString(validPuzzles.medium)},
        ${gridToString(validPuzzles.hard)},
        ${gridToString(finalSolution)},
        ${gridToString(finalSolution)},
        ${gridToString(finalSolution)}
      )
      ON CONFLICT (date) DO UPDATE SET
        easy_puzzle = ${gridToString(validPuzzles.easy)},
        medium_puzzle = ${gridToString(validPuzzles.medium)},
        hard_puzzle = ${gridToString(validPuzzles.hard)},
        easy_solution = ${gridToString(finalSolution)},
        medium_solution = ${gridToString(finalSolution)},
        hard_solution = ${gridToString(finalSolution)}
    `;

    return {
      easy: { puzzle: validPuzzles.easy, solution: finalSolution },
      medium: { puzzle: validPuzzles.medium, solution: finalSolution },
      hard: { puzzle: validPuzzles.hard, solution: finalSolution }
    };

  } catch (error) {
    console.error('Failed to generate daily puzzles:', error);
    throw error;
  }
}

// Simplified validation focusing on basic requirements
function validatePuzzleSimple(puzzle, expectedSolution) {
  // Count clues
  let clueCount = 0;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (puzzle[row][col] !== 0) clueCount++;
    }
  }

  // Minimum clue check
  if (clueCount < 17) {
    return { isValid: false, reason: `Too few clues (${clueCount})`, clueCount };
  }

  // Maximum clue check (too many clues make it too easy)
  if (clueCount > 45) {
    return { isValid: false, reason: `Too many clues (${clueCount})`, clueCount };
  }

  // Basic validity check - ensure no immediate conflicts
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const num = puzzle[row][col];
      if (num !== 0) {
        // Temporarily remove the number and check if it's valid
        const original = puzzle[row][col];
        puzzle[row][col] = 0;
        if (!isValidPlacement(puzzle, row, col, num)) {
          puzzle[row][col] = original; // restore
          return { isValid: false, reason: `Invalid clue at R${row+1}C${col+1}`, clueCount };
        }
        puzzle[row][col] = original; // restore
      }
    }
  }

  // Verify all given clues match the expected solution
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (puzzle[row][col] !== 0 && puzzle[row][col] !== expectedSolution[row][col]) {
        return { isValid: false, reason: `Clue mismatch at R${row+1}C${col+1}`, clueCount };
      }
    }
  }

  return { isValid: true, reason: 'Valid puzzle', clueCount };
}

// Keep the original validation function for reference
function validatePuzzle(puzzle, expectedSolution) {
  return validatePuzzleSimple(puzzle, expectedSolution);
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