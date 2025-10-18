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

// ═══════════════════════════════════════════════
// DATABASE CLEANUP FUNCTION - Added 2025-10-17
// ═══════════════════════════════════════════════

async function cleanupOldPuzzles() {
  /*
   * Delete ALL puzzles from database for fresh start
   * This ensures no old puzzles contaminate testing
   */

  try {
    console.log('═══════════════════════════════════════════');
    console.log('CLEANING UP OLD PUZZLES FROM DATABASE');
    console.log('═══════════════════════════════════════════');

    // Delete ALL rows from daily_puzzles table
    const result = await sql`DELETE FROM daily_puzzles RETURNING date`;

    console.log(`Deleted ${result.rows.length} puzzle entries from database`);
    console.log('Database cleanup complete - fresh start ready');
    console.log('═══════════════════════════════════════════');

    return { success: true, deleted: result.rows.length };

  } catch (error) {
    console.error('Database cleanup failed:', error);
    return { success: false, error: error.message };
  }
}

// Generate a complete valid Sudoku solution
function generateCompleteSolution(seed) {
  const grid = Array(9).fill().map(() => Array(9).fill(0));

  // Seeded random number generator for deterministic puzzle generation
  let seedValue = seed || Date.now();
  function seededRandom() {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  }

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

          // Shuffle using seeded random for deterministic results
          for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom() * (i + 1));
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

// ═══════════════════════════════════════════════
// CLUE COUNTS - Single Source of Truth
// ═══════════════════════════════════════════════

const CLUE_COUNTS = {
  easy: 42,    // 39 empty cells - PERFECT, do not change
  medium: 25,  // 56 empty cells - was 24, now 25 per user feedback
  hard: 19     // 62 empty cells - was 18, now 19 per user feedback
};

const CANDIDATE_ATTEMPTS = {
  easy: 100,    // Increased to ensure we find valid puzzles
  medium: 150,  // Increased to ensure we find valid puzzles
  hard: 200     // Increased to ensure we find valid puzzles
};

// ═══════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════

function countFilledCells(grid) {
  let count = 0;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] !== 0) count++;
    }
  }
  return count;
}

function dateToSeed(dateString) {
  return new Date(dateString).getTime();
}

function shuffleWithSeed(array, seed) {
  const arr = [...array];
  let seedValue = seed;

  function seededRandom() {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  }

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function gridToString(grid) {
  return grid.flat().join('');
}

function stringToGrid(str) {
  const grid = [];
  for (let i = 0; i < 9; i++) {
    grid.push(str.slice(i * 9, (i + 1) * 9).split('').map(Number));
  }
  return grid;
}

function deepCopy(grid) {
  return grid.map(row => [...row]);
}

// ═══════════════════════════════════════════════
// CLUE REMOVAL - Strategic Cell Removal with Unique Solution Check
// ═══════════════════════════════════════════════

function removeCluesStrategically(solution, difficulty, seed) {
  const targetClues = CLUE_COUNTS[difficulty];
  const cellsToRemove = 81 - targetClues;

  const puzzle = deepCopy(solution);

  // Create list of all cell positions
  const allPositions = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      allPositions.push({ row, col });
    }
  }

  // Shuffle positions with seed for determinism
  const shuffledPositions = shuffleWithSeed(allPositions, seed);

  // Remove exactly the number of cells needed
  let removed = 0;
  for (let i = 0; i < shuffledPositions.length && removed < cellsToRemove; i++) {
    const { row, col } = shuffledPositions[i];
    puzzle[row][col] = 0;
    removed++;
  }

  return puzzle;
}

// ═══════════════════════════════════════════════
// SUDOKU SOLVING WITH TECHNIQUE TRACKING
// ═══════════════════════════════════════════════

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
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[startRow + i][startCol + j] === num) return false;
    }
  }

  return true;
}

function getCandidates(grid, row, col) {
  if (grid[row][col] !== 0) return [];

  const candidates = [];
  for (let num = 1; num <= 9; num++) {
    if (isValid(grid, row, col, num)) {
      candidates.push(num);
    }
  }
  return candidates;
}

function getAllCandidates(grid) {
  const candidates = Array(9).fill().map(() => Array(9).fill().map(() => []));

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        candidates[row][col] = getCandidates(grid, row, col);
      }
    }
  }

  return candidates;
}

function applyNakedSingles(grid, candidates) {
  let found = 0;
  let changed = true;

  while (changed) {
    changed = false;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0 && candidates[row][col].length === 1) {
          grid[row][col] = candidates[row][col][0];
          candidates[row][col] = [];
          found++;
          changed = true;

          // Update candidates for row, col, and box
          for (let i = 0; i < 9; i++) {
            if (candidates[row][i].length > 0) {
              candidates[row][i] = candidates[row][i].filter(n => n !== grid[row][col]);
            }
            if (candidates[i][col].length > 0) {
              candidates[i][col] = candidates[i][col].filter(n => n !== grid[row][col]);
            }
          }

          const boxRow = Math.floor(row / 3) * 3;
          const boxCol = Math.floor(col / 3) * 3;
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              const r = boxRow + i;
              const c = boxCol + j;
              if (candidates[r][c].length > 0) {
                candidates[r][c] = candidates[r][c].filter(n => n !== grid[row][col]);
              }
            }
          }
        }
      }
    }
  }

  return found;
}

function findHiddenPairs(grid, candidates) {
  let found = 0;

  // Check rows
  for (let row = 0; row < 9; row++) {
    for (let num1 = 1; num1 <= 9; num1++) {
      for (let num2 = num1 + 1; num2 <= 9; num2++) {
        const positions = [];
        for (let col = 0; col < 9; col++) {
          if (candidates[row][col].includes(num1) || candidates[row][col].includes(num2)) {
            positions.push(col);
          }
        }

        if (positions.length === 2) {
          const [col1, col2] = positions;
          if (candidates[row][col1].includes(num1) && candidates[row][col1].includes(num2) &&
              candidates[row][col2].includes(num1) && candidates[row][col2].includes(num2)) {
            found++;
          }
        }
      }
    }
  }

  // Check columns
  for (let col = 0; col < 9; col++) {
    for (let num1 = 1; num1 <= 9; num1++) {
      for (let num2 = num1 + 1; num2 <= 9; num2++) {
        const positions = [];
        for (let row = 0; row < 9; row++) {
          if (candidates[row][col].includes(num1) || candidates[row][col].includes(num2)) {
            positions.push(row);
          }
        }

        if (positions.length === 2) {
          const [row1, row2] = positions;
          if (candidates[row1][col].includes(num1) && candidates[row1][col].includes(num2) &&
              candidates[row2][col].includes(num1) && candidates[row2][col].includes(num2)) {
            found++;
          }
        }
      }
    }
  }

  return found;
}

function findHiddenTriples(grid, candidates) {
  let found = 0;

  // Check rows
  for (let row = 0; row < 9; row++) {
    for (let num1 = 1; num1 <= 9; num1++) {
      for (let num2 = num1 + 1; num2 <= 9; num2++) {
        for (let num3 = num2 + 1; num3 <= 9; num3++) {
          const positions = [];
          for (let col = 0; col < 9; col++) {
            if (candidates[row][col].includes(num1) ||
                candidates[row][col].includes(num2) ||
                candidates[row][col].includes(num3)) {
              positions.push(col);
            }
          }

          if (positions.length === 3) {
            found++;
          }
        }
      }
    }
  }

  // Check columns
  for (let col = 0; col < 9; col++) {
    for (let num1 = 1; num1 <= 9; num1++) {
      for (let num2 = num1 + 1; num2 <= 9; num2++) {
        for (let num3 = num2 + 1; num3 <= 9; num3++) {
          const positions = [];
          for (let row = 0; row < 9; row++) {
            if (candidates[row][col].includes(num1) ||
                candidates[row][col].includes(num2) ||
                candidates[row][col].includes(num3)) {
              positions.push(row);
            }
          }

          if (positions.length === 3) {
            found++;
          }
        }
      }
    }
  }

  return found;
}

function findHiddenQuads(grid, candidates) {
  let found = 0;

  // Check rows
  for (let row = 0; row < 9; row++) {
    for (let num1 = 1; num1 <= 9; num1++) {
      for (let num2 = num1 + 1; num2 <= 9; num2++) {
        for (let num3 = num2 + 1; num3 <= 9; num3++) {
          for (let num4 = num3 + 1; num4 <= 9; num4++) {
            const positions = [];
            for (let col = 0; col < 9; col++) {
              if (candidates[row][col].includes(num1) ||
                  candidates[row][col].includes(num2) ||
                  candidates[row][col].includes(num3) ||
                  candidates[row][col].includes(num4)) {
                positions.push(col);
              }
            }

            if (positions.length === 4) {
              found++;
            }
          }
        }
      }
    }
  }

  return found;
}

function countBottlenecks(grid, candidates) {
  let bottlenecks = 0;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0 && candidates[row][col].length >= 6) {
        bottlenecks++;
      }
    }
  }

  return bottlenecks;
}

function solvePuzzleWithTracking(puzzle) {
  const grid = deepCopy(puzzle);
  const candidates = getAllCandidates(grid);

  const stats = {
    nakedSingles: 0,
    hiddenPairs: 0,
    hiddenTriples: 0,
    hiddenQuads: 0,
    complexityScore: 0,
    bottlenecks: 0,
    solvable: false
  };

  // Apply naked singles
  stats.nakedSingles = applyNakedSingles(grid, candidates);

  // Count hidden techniques
  stats.hiddenPairs = findHiddenPairs(grid, candidates);
  stats.hiddenTriples = findHiddenTriples(grid, candidates);
  stats.hiddenQuads = findHiddenQuads(grid, candidates);

  // Count bottlenecks
  stats.bottlenecks = countBottlenecks(grid, candidates);

  // Calculate complexity score
  stats.complexityScore =
    stats.nakedSingles * 1 +
    stats.hiddenPairs * 3 +
    stats.hiddenTriples * 5 +
    stats.hiddenQuads * 8 +
    stats.bottlenecks * 10;

  // Check if solvable (all cells filled)
  stats.solvable = countFilledCells(grid) === 81;

  return stats;
}

// ═══════════════════════════════════════════════
// UNIQUE SOLUTION VALIDATION
// ═══════════════════════════════════════════════

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

// ═══════════════════════════════════════════════
// GAMEPLAY-DRIVEN VALIDATION HELPERS
// ═══════════════════════════════════════════════

// Simulate solving step by step to track gameplay experience
function simulateSolveWithGameplayTracking(puzzle) {
  const grid = deepCopy(puzzle);
  const steps = [];
  let moveCount = 0;
  const maxMoves = 81;

  while (countFilledCells(grid) < 81 && moveCount < maxMoves) {
    const candidates = getAllCandidates(grid);

    // Count immediate naked singles (cells with only 1 candidate)
    let immediateNakedSingles = 0;
    let nakedSinglesMade = 0;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0 && candidates[row][col].length === 1) {
          immediateNakedSingles++;
        }
      }
    }

    // Apply all available naked singles in this iteration
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0 && candidates[row][col].length === 1) {
          grid[row][col] = candidates[row][col][0];
          nakedSinglesMade++;
          moveCount++;
        }
      }
    }

    // Calculate total candidates and empty cells for this step
    let totalCandidates = 0;
    let emptyCells = 0;
    const newCandidates = getAllCandidates(grid);

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          emptyCells++;
          totalCandidates += newCandidates[row][col].length;
        }
      }
    }

    steps.push({
      moveNumber: moveCount,
      immediateNakedSingles,
      nakedSinglesMade,
      totalCandidates,
      emptyCells,
      avgCandidatesPerCell: emptyCells > 0 ? totalCandidates / emptyCells : 0,
      requiresCandidateAnalysis: immediateNakedSingles === 0 && emptyCells > 0
    });

    // If no progress, puzzle might need advanced techniques or be stuck
    if (nakedSinglesMade === 0) {
      break;
    }
  }

  return {
    steps,
    completed: countFilledCells(grid) === 81,
    totalMoves: moveCount
  };
}

// Check if puzzle requires candidate tracking
function requiresCandidates(puzzle) {
  const result = simulateSolveWithGameplayTracking(puzzle);

  // If completed, check if it required looking at multiple candidates
  if (!result.completed) return true; // Couldn't solve with just naked singles

  // Count how many times player needed to analyze candidates
  // (cells where there were no immediate naked singles)
  const forcedCandidateMoments = result.steps.filter(step =>
    step.requiresCandidateAnalysis && step.emptyCells > 0
  ).length;

  return forcedCandidateMoments > 0;
}

// Check if puzzle requires candidate ELIMINATION techniques
function requiresCandidateElimination(puzzle) {
  const grid = deepCopy(puzzle);
  let usedElimination = false;

  // Try to solve with only naked singles
  let changed = true;
  while (changed && countFilledCells(grid) < 81) {
    changed = false;
    const candidates = getAllCandidates(grid);

    // Apply naked singles
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0 && candidates[row][col].length === 1) {
          grid[row][col] = candidates[row][col][0];
          changed = true;
        }
      }
    }
  }

  // If not completed, it requires more than naked singles
  if (countFilledCells(grid) < 81) {
    // Check if puzzle has high candidate density (indicator of elimination need)
    const candidates = getAllCandidates(grid);
    let totalCandidates = 0;
    let emptyCells = 0;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          emptyCells++;
          totalCandidates += candidates[row][col].length;
        }
      }
    }

    const avgCandidates = emptyCells > 0 ? totalCandidates / emptyCells : 0;

    // High candidate density suggests elimination is needed
    usedElimination = avgCandidates >= 3.5;
  }

  return usedElimination;
}

// Check smooth progression (how many moves are available at each step)
function checkSmoothProgression(puzzle) {
  const result = simulateSolveWithGameplayTracking(puzzle);

  if (result.steps.length === 0) {
    return {
      minAvailableMoves: 0,
      maxAvailableMoves: 0,
      maxImmediateNakedSingles: 0
    };
  }

  const nakedSingles = result.steps.map(s => s.immediateNakedSingles);

  return {
    minAvailableMoves: Math.min(...nakedSingles),
    maxAvailableMoves: Math.max(...nakedSingles),
    maxImmediateNakedSingles: Math.max(...nakedSingles)
  };
}

// Count forced candidate moments
function countForcedCandidateMoments(puzzle) {
  const result = simulateSolveWithGameplayTracking(puzzle);
  return result.steps.filter(step => step.requiresCandidateAnalysis).length;
}

// Calculate average candidates per cell in first N moves
function calculateAverageCandidates(puzzle, firstMoves = 20) {
  const result = simulateSolveWithGameplayTracking(puzzle);
  const relevantSteps = result.steps.slice(0, firstMoves);

  if (relevantSteps.length === 0) return 0;

  const avgCandidates = relevantSteps.map(step => step.avgCandidatesPerCell);
  return avgCandidates.reduce((a, b) => a + b, 0) / avgCandidates.length;
}

// Count naked singles in first N moves
function countNakedSinglesInFirstMoves(puzzle, firstMoves = 20) {
  const result = simulateSolveWithGameplayTracking(puzzle);
  const relevantSteps = result.steps.slice(0, firstMoves);

  return relevantSteps.reduce((sum, step) => sum + step.nakedSinglesMade, 0);
}

// ═══════════════════════════════════════════════
// DIFFICULTY VALIDATION FUNCTIONS - GAMEPLAY-DRIVEN
// ═══════════════════════════════════════════════

function validateEasy(puzzle, solution) {
  const clueCount = countFilledCells(puzzle);
  const targetClues = CLUE_COUNTS.easy;

  console.log(`\nEASY VALIDATION (Gameplay-Driven):`);
  console.log(`  Clues: ${clueCount} (target: ${targetClues})`);

  // ========================================
  // CRITICAL: Verify unique solution FIRST
  // ========================================
  console.log(`  Checking unique solution...`);

  const solutionCount = countSolutions(puzzle);

  if (solutionCount === 0) {
    console.log(`  ❌ No solutions found`);
    return {
      valid: false,
      stats: null,
      clueCount,
      targetClues
    };
  }

  if (solutionCount > 1) {
    console.log(`  ❌ CRITICAL: Multiple solutions found (${solutionCount}+)`);
    console.log(`  This puzzle is NOT logically solvable - REJECTED`);
    return {
      valid: false,
      stats: null,
      clueCount,
      targetClues
    };
  }

  console.log(`  ✓ Unique solution verified`);

  // GAMEPLAY-DRIVEN VALIDATION
  // Easy: "Playable without candidates, challenging but not too much, fun"

  // 1. Must NOT require candidates
  const needsCandidates = requiresCandidates(puzzle);
  console.log(`  Requires candidates: ${needsCandidates ? 'YES ❌' : 'NO ✓'}`);

  // 2. Check smooth progression (1-3 obvious moves available)
  const progression = checkSmoothProgression(puzzle);
  console.log(`  Progression: min=${progression.minAvailableMoves}, max=${progression.maxAvailableMoves}`);

  // 3. Count naked singles
  const stats = solvePuzzleWithTracking(puzzle);
  console.log(`  Naked Singles: ${stats.nakedSingles} (need 15+)`);

  // 4. Hidden techniques should be minimal
  const hiddenTechniques = stats.hiddenPairs + stats.hiddenTriples + stats.hiddenQuads;
  console.log(`  Hidden Techniques: ${hiddenTechniques} (max 2)`);

  // 5. No bottlenecks
  console.log(`  Bottlenecks: ${stats.bottlenecks} (need 0)`);

  const valid =
    clueCount === targetClues &&
    !needsCandidates &&  // CRITICAL: Must be solvable without candidates
    progression.minAvailableMoves >= 1 &&  // Always have moves available
    progression.maxAvailableMoves <= 3 &&  // Not too many options
    stats.nakedSingles >= 15 &&  // Plenty of obvious moves
    hiddenTechniques <= 2 &&  // Minimal complexity
    stats.bottlenecks === 0 &&  // No difficult decision points
    stats.solvable;

  console.log(`  Valid: ${valid ? '✓' : '✗'}`);

  return {
    valid,
    stats: {
      ...stats,
      needsCandidates,
      progression
    },
    clueCount,
    targetClues
  };
}

function validateMedium(puzzle, solution) {
  const clueCount = countFilledCells(puzzle);
  const targetClues = CLUE_COUNTS.medium;

  console.log(`\nMEDIUM VALIDATION (Gameplay-Driven):`);
  console.log(`  Clues: ${clueCount} (target: ${targetClues})`);

  // ========================================
  // CRITICAL: Verify unique solution FIRST
  // ========================================
  console.log(`  Checking unique solution...`);

  const solutionCount = countSolutions(puzzle);

  if (solutionCount === 0) {
    console.log(`  ❌ No solutions found`);
    return {
      valid: false,
      stats: null,
      clueCount,
      targetClues
    };
  }

  if (solutionCount > 1) {
    console.log(`  ❌ CRITICAL: Multiple solutions found (${solutionCount}+)`);
    console.log(`  This puzzle is NOT logically solvable - REJECTED`);
    return {
      valid: false,
      stats: null,
      clueCount,
      targetClues
    };
  }

  console.log(`  ✓ Unique solution verified`);

  // GAMEPLAY-DRIVEN VALIDATION
  // Medium: "Needs candidates, forces thinking, can't see next move immediately"

  // 1. MUST require candidate tracking
  const needsCandidates = requiresCandidates(puzzle);
  console.log(`  Requires candidates: ${needsCandidates ? 'YES ✓' : 'NO ❌'}`);

  // 2. Max 2 naked singles available at any point (forces pause)
  const progression = checkSmoothProgression(puzzle);
  console.log(`  Max immediate naked singles: ${progression.maxImmediateNakedSingles} (max 2)`);

  // 3. Must have moments where player must mark candidates
  const forcedCandidateMoments = countForcedCandidateMoments(puzzle);
  console.log(`  Forced candidate moments: ${forcedCandidateMoments} (need 5+)`);

  // 4. Require hidden techniques
  const stats = solvePuzzleWithTracking(puzzle);
  const hiddenTechniques = stats.hiddenPairs + stats.hiddenTriples + stats.hiddenQuads;
  console.log(`  Hidden Techniques: ${hiddenTechniques} (need 3-5)`);

  // 5. Require bottlenecks (pause and think moments)
  console.log(`  Bottlenecks: ${stats.bottlenecks} (need 1-2)`);

  // 6. Should NOT require candidate elimination (only tracking)
  const needsElimination = requiresCandidateElimination(puzzle);
  console.log(`  Requires elimination: ${needsElimination ? 'YES ❌' : 'NO ✓'}`);

  const valid =
    clueCount === targetClues &&
    needsCandidates &&  // CRITICAL: Must require candidates
    progression.maxImmediateNakedSingles <= 2 &&  // Can't see next moves immediately
    forcedCandidateMoments >= 5 &&  // Must track candidates multiple times
    hiddenTechniques >= 3 && hiddenTechniques <= 5 &&  // Need pattern recognition
    stats.bottlenecks >= 1 && stats.bottlenecks <= 2 &&  // Pause and think moments
    !needsElimination &&  // Should not need elimination
    stats.solvable;

  console.log(`  Valid: ${valid ? '✓' : '✗'}`);

  return {
    valid,
    stats: {
      ...stats,
      needsCandidates,
      needsElimination,
      forcedCandidateMoments,
      progression
    },
    clueCount,
    targetClues
  };
}

function validateHard(puzzle, solution) {
  const clueCount = countFilledCells(puzzle);
  const targetClues = CLUE_COUNTS.hard;

  console.log(`\nHARD VALIDATION (Gameplay-Driven):`);
  console.log(`  Clues: ${clueCount} (target: ${targetClues})`);

  // ========================================
  // CRITICAL: Verify unique solution FIRST
  // ========================================
  console.log(`  Checking unique solution...`);

  const solutionCount = countSolutions(puzzle);

  if (solutionCount === 0) {
    console.log(`  ❌ No solutions found`);
    return {
      valid: false,
      stats: null,
      clueCount,
      targetClues
    };
  }

  if (solutionCount > 1) {
    console.log(`  ❌ CRITICAL: Multiple solutions found (${solutionCount}+)`);
    console.log(`  This puzzle is NOT logically solvable - REJECTED`);
    return {
      valid: false,
      stats: null,
      clueCount,
      targetClues
    };
  }

  console.log(`  ✓ Unique solution verified`);

  // GAMEPLAY-DRIVEN VALIDATION
  // Hard: "Requires candidates, MUST eliminate candidates to progress"

  // 1. MUST require candidate elimination
  const needsElimination = requiresCandidateElimination(puzzle);
  console.log(`  Requires elimination: ${needsElimination ? 'YES ✓' : 'NO ❌'}`);

  // 2. High candidate density early
  const avgCandidates = calculateAverageCandidates(puzzle, 20);
  console.log(`  Avg candidates per cell (first 20): ${avgCandidates.toFixed(2)} (need 4+)`);

  // 3. Require elimination techniques at least 3 times
  const stats = solvePuzzleWithTracking(puzzle);
  const eliminationTechniques = stats.hiddenPairs + stats.hiddenTriples + stats.hiddenQuads;
  console.log(`  Elimination techniques: ${eliminationTechniques} (need 3+)`);

  // 4. Very few naked singles early
  const nakedSinglesEarly = countNakedSinglesInFirstMoves(puzzle, 20);
  console.log(`  Naked singles in first 20 moves: ${nakedSinglesEarly} (max 3)`);

  // 5. Require hidden techniques
  const hiddenTechniques = stats.hiddenPairs + stats.hiddenTriples + stats.hiddenQuads;
  console.log(`  Hidden Techniques: ${hiddenTechniques} (need 4-6)`);

  // 6. Multiple bottlenecks
  console.log(`  Bottlenecks: ${stats.bottlenecks} (need 2-4)`);

  const valid =
    clueCount === targetClues &&
    needsElimination &&  // CRITICAL: Must require elimination
    avgCandidates >= 4 &&  // High complexity early on
    eliminationTechniques >= 3 &&  // Multiple elimination moves needed
    nakedSinglesEarly <= 3 &&  // Not too many easy moves at start
    hiddenTechniques >= 4 && hiddenTechniques <= 6 &&  // Complex pattern recognition
    stats.bottlenecks >= 2 && stats.bottlenecks <= 4 &&  // Multiple challenge points
    stats.solvable;

  console.log(`  Valid: ${valid ? '✓' : '✗'}`);

  return {
    valid,
    stats: {
      ...stats,
      needsElimination,
      avgCandidates,
      eliminationTechniques,
      nakedSinglesEarly
    },
    clueCount,
    targetClues
  };
}

function validatePuzzle(puzzle, solution, difficulty) {
  switch (difficulty) {
    case 'easy':
      return validateEasy(puzzle, solution);
    case 'medium':
      return validateMedium(puzzle, solution);
    case 'hard':
      return validateHard(puzzle, solution);
    default:
      throw new Error(`Unknown difficulty: ${difficulty}`);
  }
}

// ═══════════════════════════════════════════════
// MAIN PUZZLE GENERATION FUNCTION
// ═══════════════════════════════════════════════

function generateDailyPuzzle(solution, difficulty, seed) {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`GENERATING ${difficulty.toUpperCase()} PUZZLE`);
  console.log(`${'═'.repeat(50)}`);

  const maxAttempts = CANDIDATE_ATTEMPTS[difficulty];
  const targetClues = CLUE_COUNTS[difficulty];

  console.log(`Target clues: ${targetClues}`);
  console.log(`Max attempts: ${maxAttempts}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\n--- Attempt ${attempt}/${maxAttempts} ---`);

    // Remove clues strategically
    const puzzle = removeCluesStrategically(solution, difficulty, seed + attempt);

    // Verify clue count immediately after removal
    const cluesAfterRemoval = countFilledCells(puzzle);
    console.log(`Clues after removal: ${cluesAfterRemoval}`);

    if (cluesAfterRemoval !== targetClues) {
      console.error(`ERROR: Clue count mismatch after removal! Expected ${targetClues}, got ${cluesAfterRemoval}`);
      continue;
    }

    // Validate puzzle
    const validation = validatePuzzle(puzzle, solution, difficulty);

    if (validation.valid) {
      // Final verification before returning
      const finalClues = countFilledCells(puzzle);
      console.log(`\n✓ VALID ${difficulty.toUpperCase()} PUZZLE GENERATED!`);
      console.log(`Final clue count: ${finalClues} (target: ${targetClues})`);

      if (finalClues !== targetClues) {
        console.error(`CRITICAL ERROR: Final clue count mismatch! Expected ${targetClues}, got ${finalClues}`);
        continue;
      }

      return puzzle;
    }

    console.log(`✗ Attempt ${attempt} failed validation`);
  }

  // If no valid puzzle found after maxAttempts, keep trying with ONLY unique solution validation
  // We relax difficulty criteria but NEVER compromise on having a unique solution
  console.log(`\n⚠ No valid puzzle found after ${maxAttempts} attempts`);
  console.log(`Switching to relaxed mode: accepting any puzzle with unique solution and correct clue count`);

  for (let relaxedAttempt = 1; relaxedAttempt <= 1000; relaxedAttempt++) {
    const puzzle = removeCluesStrategically(solution, difficulty, seed + maxAttempts + relaxedAttempt);
    const clues = countFilledCells(puzzle);

    if (clues !== targetClues) {
      console.error(`Relaxed attempt ${relaxedAttempt}: Clue count mismatch! Expected ${targetClues}, got ${clues}`);
      continue;
    }

    // CRITICAL: Verify unique solution
    const solutionCount = countSolutions(puzzle);

    if (solutionCount === 1) {
      console.log(`✓ Found valid puzzle with unique solution on relaxed attempt ${relaxedAttempt}`);
      console.log(`Note: This puzzle may not meet all difficulty criteria but IS solvable`);
      return puzzle;
    }

    if (relaxedAttempt % 100 === 0) {
      console.log(`Relaxed attempt ${relaxedAttempt}: Still searching for unique solution...`);
    }
  }

  // If we still can't find a valid puzzle, throw an error - NEVER return an unsolvable puzzle
  throw new Error(`CRITICAL: Unable to generate a valid ${difficulty} puzzle with unique solution after ${maxAttempts + 1000} attempts`);
}

// ═══════════════════════════════════════════════
// GENERATE ALL THREE DIFFICULTIES
// ═══════════════════════════════════════════════

async function generateDailyPuzzles(date, forceSeed = null) {
  try {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`GENERATING DAILY PUZZLES FOR ${date}`);
    console.log(`${'═'.repeat(60)}`);

    // Use forceSeed if provided (for manual regeneration), otherwise use date-based seed
    const seed = forceSeed !== null ? forceSeed : dateToSeed(date);
    console.log(`Seed: ${seed}${forceSeed !== null ? ' (forced)' : ' (date-based)'}`);

    // Generate one solution for all difficulties
    console.log(`\nGenerating complete solution...`);
    const solution = generateCompleteSolution(seed);
    console.log(`Solution generated with ${countFilledCells(solution)} filled cells`);

    // Generate puzzles for each difficulty
    const easyPuzzle = generateDailyPuzzle(solution, 'easy', seed + 1);
    const mediumPuzzle = generateDailyPuzzle(solution, 'medium', seed + 2);
    const hardPuzzle = generateDailyPuzzle(solution, 'hard', seed + 3);

    // Final verification of all clue counts
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`FINAL VERIFICATION`);
    console.log(`${'═'.repeat(60)}`);
    console.log(`Easy clues: ${countFilledCells(easyPuzzle)} (target: ${CLUE_COUNTS.easy})`);
    console.log(`Medium clues: ${countFilledCells(mediumPuzzle)} (target: ${CLUE_COUNTS.medium})`);
    console.log(`Hard clues: ${countFilledCells(hardPuzzle)} (target: ${CLUE_COUNTS.hard})`);

    // Save to database
    await sql`
      INSERT INTO daily_puzzles (
        date,
        easy_puzzle, medium_puzzle, hard_puzzle,
        easy_solution, medium_solution, hard_solution
      )
      VALUES (
        ${date},
        ${gridToString(easyPuzzle)}, ${gridToString(mediumPuzzle)}, ${gridToString(hardPuzzle)},
        ${gridToString(solution)}, ${gridToString(solution)}, ${gridToString(solution)}
      )
      ON CONFLICT (date) DO UPDATE SET
        easy_puzzle = ${gridToString(easyPuzzle)},
        medium_puzzle = ${gridToString(mediumPuzzle)},
        hard_puzzle = ${gridToString(hardPuzzle)},
        easy_solution = ${gridToString(solution)},
        medium_solution = ${gridToString(solution)},
        hard_solution = ${gridToString(solution)},
        created_at = NOW()
    `;

    console.log(`\n✓ Puzzles saved to database for ${date}`);

    return {
      easy: {
        puzzle: easyPuzzle,
        solution: solution
      },
      medium: {
        puzzle: mediumPuzzle,
        solution: solution
      },
      hard: {
        puzzle: hardPuzzle,
        solution: solution
      }
    };

  } catch (error) {
    console.error('Failed to generate daily puzzles:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════
// DATABASE FUNCTIONS
// ═══════════════════════════════════════════════

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

// ═══════════════════════════════════════════════
// API HANDLER
// ═══════════════════════════════════════════════

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
        const { action, player, date, difficulty, state, forceSeed } = req.body;

        // Log the request for debugging
        console.log('POST /api/puzzles', { action, date: date ? 'present' : 'missing', forceSeed: forceSeed ? 'present' : 'missing' });

        if (action === 'cleanup') {
          const result = await cleanupOldPuzzles();
          return res.status(200).json(result);
        } else if (action === 'generate' && date) {
          // Generate new puzzles for specific date
          // If forceSeed is provided, use it to generate different puzzles for the same date
          const puzzles = await generateDailyPuzzles(date, forceSeed);
          return res.status(200).json(puzzles);
        } else if (action === 'save' && player && date && difficulty && state) {
          // Save game state
          await saveGameState(player, date, difficulty, state);
          return res.status(200).json({ success: true });
        } else if (action === 'reset' && date) {
          // Reset puzzles, game states, and completion times for specific date
          await sql`DELETE FROM daily_puzzles WHERE date = ${date}`;
          await sql`DELETE FROM game_states WHERE date = ${date}`;
          await sql`DELETE FROM individual_games WHERE date = ${date}`;
          return res.status(200).json({
            success: true,
            message: `Reset completed for ${date} (puzzles, game states, and times cleared)`
          });
        } else {
          console.error('Invalid request - action:', action, 'date:', date);
          return res.status(400).json({
            error: 'Invalid request parameters',
            received: { action, hasDate: !!date, hasPlayer: !!player, hasDifficulty: !!difficulty, hasState: !!state }
          });
        }
      }

      case 'DELETE': {
        const { date } = req.body;

        if (date) {
          // Delete puzzles, game states, and completion times for specific date
          await sql`DELETE FROM daily_puzzles WHERE date = ${date}`;
          await sql`DELETE FROM game_states WHERE date = ${date}`;
          await sql`DELETE FROM individual_games WHERE date = ${date}`;
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
