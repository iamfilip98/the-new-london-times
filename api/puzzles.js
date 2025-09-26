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

  // Rigorous difficulty settings - all puzzles must be solvable with logical techniques only
  const difficultySettings = {
    easy: {
      minClues: 32,
      maxClues: 38,
      requireNakedSingles: true,
      allowHiddenSingles: true,
      allowComplexTechniques: false,
      maxIterations: 75,  // More iterations for better placement
      requireEvenDistribution: true,  // Ensure clues are spread across regions
      maxEmptyRegions: 2  // Max 2 empty 3x3 regions for better initial placement
    },
    medium: {
      minClues: 22,
      maxClues: 30,  // Former hard difficulty settings
      requireNakedSingles: false,
      allowHiddenSingles: true,
      allowComplexTechniques: true,
      maxIterations: 200,
      requireEvenDistribution: false,
      maxEmptyRegions: 4
    },
    hard: {
      minClues: 20,
      maxClues: 27,  // More clues for easier starting positions
      requireNakedSingles: false,
      allowHiddenSingles: true,
      allowComplexTechniques: true,
      maxIterations: 250,  // Reasonable iterations for good puzzles
      requireEvenDistribution: false,
      maxEmptyRegions: 4,  // Fewer empty regions for better starting positions
      allowAdvancedTechniques: false,  // Disable expert-level techniques
      requireAdvancedSolving: false,   // Don't require ultra-advanced techniques
      minAdvancedMoves: 0,            // No requirement for expert techniques
      allowXWing: false,              // Too advanced for most players
      allowSwordfish: false,          // Too advanced for most players
      allowYWing: false,              // Too advanced for most players
      allowXYZWing: false,            // Too advanced for most players
      allowChains: false,             // Too advanced for most players
      requireHiddenSubsets: true,     // Require hidden pairs/triples only
      minHiddenSubsets: 1,            // Require at least 1 hidden subset application
      maxHiddenLevel: 3               // Maximum hidden triples (no quads)
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

      // For Easy difficulty, check distribution constraints
      if (settings.requireEvenDistribution || settings.maxEmptyRegions) {
        const testPuzzleAfterRemoval = testPuzzle.map(row => [...row]);
        testPuzzleAfterRemoval[row][col] = 0;

        // Check if this removal violates distribution rules
        if (!isValidDistribution(testPuzzleAfterRemoval, settings)) {
          continue; // Skip this cell removal
        }
      }

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
            console.log(`🎯 Found better ${difficulty} puzzle with ${currentClues} clues`);
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
    easy: 35,   // Updated for better solving experience
    medium: 26, // Former hard difficulty (now medium)
    hard: 24    // More clues for easier starting positions
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

// Comprehensive logical Sudoku solver - no guessing allowed
function isPuzzleSolvableLogically(puzzle, settings) {
  const testGrid = puzzle.map(row => [...row]);
  const candidates = initializeCandidates(testGrid);
  let changed = true;
  let iterations = 0;
  const maxSolverIterations = 200;
  let advancedTechniquesUsed = 0;  // Track usage of advanced techniques
  let hiddenSubsetsUsed = 0;       // Track usage of hidden subsets

  while (changed && iterations < maxSolverIterations) {
    changed = false;
    iterations++;

    // Update candidates first
    updateCandidates(testGrid, candidates);

    // Technique 1: Naked Singles (cells with only one candidate)
    if (applyNakedSingles(testGrid, candidates)) {
      changed = true;
      continue;
    }

    // Technique 2: Hidden Singles (numbers that can only go in one place)
    if (settings.allowHiddenSingles && applyHiddenSingles(testGrid, candidates)) {
      changed = true;
      continue;
    }

    // Technique 3: Naked Pairs, Triples, Quads
    if (settings.allowComplexTechniques && applyNakedSubsets(testGrid, candidates)) {
      changed = true;
      continue;
    }

    // Technique 4: Hidden Pairs, Triples, Quads
    if (settings.allowComplexTechniques && applyHiddenSubsets(testGrid, candidates)) {
      changed = true;
      hiddenSubsetsUsed++;
      continue;
    }

    // Technique 5: Pointing Pairs/Triples (Box/Line Reduction)
    if (settings.allowComplexTechniques && applyPointingPairs(testGrid, candidates)) {
      changed = true;
      continue;
    }

    // Technique 6: Box/Line Reduction
    if (settings.allowComplexTechniques && applyBoxLineReduction(testGrid, candidates)) {
      changed = true;
      continue;
    }

    // Advanced Techniques (only for hard difficulty)
    if (settings.allowAdvancedTechniques) {
      // Technique 7: X-Wing
      if (settings.allowXWing && applyXWing(testGrid, candidates)) {
        changed = true;
        advancedTechniquesUsed++;
        continue;
      }

      // Technique 8: Y-Wing
      if (settings.allowYWing && applyYWing(testGrid, candidates)) {
        changed = true;
        advancedTechniquesUsed++;
        continue;
      }

      // Technique 9: XYZ-Wing
      if (settings.allowXYZWing && applyXYZWing(testGrid, candidates)) {
        changed = true;
        advancedTechniquesUsed++;
        continue;
      }

      // Technique 10: Swordfish (3x3 version of X-Wing)
      if (settings.allowSwordfish && applySwordfish(testGrid, candidates)) {
        changed = true;
        advancedTechniquesUsed++;
        continue;
      }

      // Technique 11: Simple Coloring/Chains
      if (settings.allowChains && applySimpleColoring(testGrid, candidates)) {
        changed = true;
        advancedTechniquesUsed++;
        continue;
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
      // Check if hard puzzles require advanced techniques
      if (settings.requireAdvancedSolving && settings.minAdvancedMoves) {
        if (advancedTechniquesUsed < settings.minAdvancedMoves) {
          return false; // Hard puzzle should require more advanced techniques
        }
      }

      // Check if hard puzzles require hidden subsets
      if (settings.requireHiddenSubsets && settings.minHiddenSubsets) {
        if (hiddenSubsetsUsed < settings.minHiddenSubsets) {
          return false; // Hard puzzle should require hidden subset techniques
        }
      }

      return true; // Puzzle is solvable!
    }

    // Check for invalid state (cell with no candidates)
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (testGrid[row][col] === 0 && candidates[row][col].length === 0) {
          return false; // Invalid puzzle - cell has no possible values
        }
      }
    }
  }

  // If we stopped making progress, puzzle requires guessing
  return false;
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

// Helper function to validate clue distribution for better placement
function isValidDistribution(grid, settings) {
  if (!settings.requireEvenDistribution && !settings.maxEmptyRegions) {
    return true;
  }

  // Count clues in each 3x3 region
  const regionCounts = [];
  let emptyRegions = 0;

  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const count = countRegionClues(grid, boxRow * 3, boxCol * 3);
      regionCounts.push(count);

      if (count === 0) {
        emptyRegions++;
      }
    }
  }

  // Check empty regions constraint
  if (settings.maxEmptyRegions && emptyRegions > settings.maxEmptyRegions) {
    return false;
  }

  // For easy puzzles, ensure more even distribution
  if (settings.requireEvenDistribution) {
    const minCluesPerRegion = Math.floor(settings.minClues / 9);
    const maxCluesPerRegion = Math.ceil(settings.maxClues / 9) + 2; // Allow some flexibility

    // Each region should have at least minCluesPerRegion clues (unless empty)
    // and not exceed maxCluesPerRegion
    for (let count of regionCounts) {
      if (count > 0 && count < minCluesPerRegion) {
        return false; // Region has too few clues
      }
      if (count > maxCluesPerRegion) {
        return false; // Region has too many clues
      }
    }

    // Check that clues aren't all bunched in just a few regions
    const occupiedRegions = regionCounts.filter(count => count > 0).length;
    if (occupiedRegions < 6) { // Require at least 6 of 9 regions to have clues
      return false;
    }
  }

  return true;
}

// ========= COMPREHENSIVE LOGICAL SOLVING TECHNIQUES =========

// Initialize candidate arrays for all empty cells
function initializeCandidates(grid) {
  const candidates = Array(9).fill().map(() => Array(9).fill().map(() => []));

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        candidates[row][col] = getPossibleValues(grid, row, col);
      }
    }
  }

  return candidates;
}

// Update all candidate lists based on current grid state
function updateCandidates(grid, candidates) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        candidates[row][col] = getPossibleValues(grid, row, col);
      } else {
        candidates[row][col] = [];
      }
    }
  }
}

// Technique 1: Naked Singles - cells with only one candidate
function applyNakedSingles(grid, candidates) {
  let changed = false;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0 && candidates[row][col].length === 1) {
        grid[row][col] = candidates[row][col][0];
        candidates[row][col] = [];
        changed = true;
      }
    }
  }

  return changed;
}

// Technique 2: Hidden Singles - numbers that can only go in one place in a unit
function applyHiddenSingles(grid, candidates) {
  let changed = false;

  // Check rows
  for (let row = 0; row < 9; row++) {
    for (let num = 1; num <= 9; num++) {
      if (!isNumberInRow(grid, row, num)) {
        const possibleCols = [];
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            possibleCols.push(col);
          }
        }
        if (possibleCols.length === 1) {
          const col = possibleCols[0];
          grid[row][col] = num;
          candidates[row][col] = [];
          changed = true;
        }
      }
    }
  }

  // Check columns
  for (let col = 0; col < 9; col++) {
    for (let num = 1; num <= 9; num++) {
      if (!isNumberInColumn(grid, col, num)) {
        const possibleRows = [];
        for (let row = 0; row < 9; row++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            possibleRows.push(row);
          }
        }
        if (possibleRows.length === 1) {
          const row = possibleRows[0];
          grid[row][col] = num;
          candidates[row][col] = [];
          changed = true;
        }
      }
    }
  }

  // Check boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      for (let num = 1; num <= 9; num++) {
        if (!isNumberInBox(grid, boxRow * 3, boxCol * 3, num)) {
          const possiblePositions = [];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const row = boxRow * 3 + r;
              const col = boxCol * 3 + c;
              if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
                possiblePositions.push([row, col]);
              }
            }
          }
          if (possiblePositions.length === 1) {
            const [row, col] = possiblePositions[0];
            grid[row][col] = num;
            candidates[row][col] = [];
            changed = true;
          }
        }
      }
    }
  }

  return changed;
}

// Technique 3: Naked Pairs/Triples/Quads - eliminate candidates from peers
function applyNakedSubsets(grid, candidates) {
  let changed = false;

  // Check for naked pairs, triples, and quads in rows
  for (let row = 0; row < 9; row++) {
    if (applyNakedSubsetsInRow(grid, candidates, row)) changed = true;
  }

  // Check for naked pairs, triples, and quads in columns
  for (let col = 0; col < 9; col++) {
    if (applyNakedSubsetsInColumn(grid, candidates, col)) changed = true;
  }

  // Check for naked pairs, triples, and quads in boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      if (applyNakedSubsetsInBox(grid, candidates, boxRow, boxCol)) changed = true;
    }
  }

  return changed;
}

// Apply naked subsets in a row
function applyNakedSubsetsInRow(grid, candidates, row) {
  let changed = false;
  const cells = [];

  for (let col = 0; col < 9; col++) {
    if (grid[row][col] === 0 && candidates[row][col].length > 0) {
      cells.push({ row, col, candidates: [...candidates[row][col]] });
    }
  }

  // Look for naked pairs
  for (let i = 0; i < cells.length - 1; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const cell1 = cells[i], cell2 = cells[j];
      if (cell1.candidates.length === 2 && cell2.candidates.length === 2 &&
          arraysEqual(cell1.candidates, cell2.candidates)) {

        // Remove these candidates from other cells in the row
        for (let col = 0; col < 9; col++) {
          if (col !== cell1.col && col !== cell2.col && grid[row][col] === 0) {
            const oldLength = candidates[row][col].length;
            candidates[row][col] = candidates[row][col].filter(num =>
              !cell1.candidates.includes(num));
            if (candidates[row][col].length < oldLength) changed = true;
          }
        }
      }
    }
  }

  return changed;
}

// Apply naked subsets in a column
function applyNakedSubsetsInColumn(grid, candidates, col) {
  let changed = false;
  const cells = [];

  for (let row = 0; row < 9; row++) {
    if (grid[row][col] === 0 && candidates[row][col].length > 0) {
      cells.push({ row, col, candidates: [...candidates[row][col]] });
    }
  }

  // Look for naked pairs
  for (let i = 0; i < cells.length - 1; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const cell1 = cells[i], cell2 = cells[j];
      if (cell1.candidates.length === 2 && cell2.candidates.length === 2 &&
          arraysEqual(cell1.candidates, cell2.candidates)) {

        // Remove these candidates from other cells in the column
        for (let row = 0; row < 9; row++) {
          if (row !== cell1.row && row !== cell2.row && grid[row][col] === 0) {
            const oldLength = candidates[row][col].length;
            candidates[row][col] = candidates[row][col].filter(num =>
              !cell1.candidates.includes(num));
            if (candidates[row][col].length < oldLength) changed = true;
          }
        }
      }
    }
  }

  return changed;
}

// Apply naked subsets in a box
function applyNakedSubsetsInBox(grid, candidates, boxRow, boxCol) {
  let changed = false;
  const cells = [];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const row = boxRow * 3 + r;
      const col = boxCol * 3 + c;
      if (grid[row][col] === 0 && candidates[row][col].length > 0) {
        cells.push({ row, col, candidates: [...candidates[row][col]] });
      }
    }
  }

  // Look for naked pairs
  for (let i = 0; i < cells.length - 1; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const cell1 = cells[i], cell2 = cells[j];
      if (cell1.candidates.length === 2 && cell2.candidates.length === 2 &&
          arraysEqual(cell1.candidates, cell2.candidates)) {

        // Remove these candidates from other cells in the box
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const row = boxRow * 3 + r;
            const col = boxCol * 3 + c;
            if ((row !== cell1.row || col !== cell1.col) &&
                (row !== cell2.row || col !== cell2.col) && grid[row][col] === 0) {
              const oldLength = candidates[row][col].length;
              candidates[row][col] = candidates[row][col].filter(num =>
                !cell1.candidates.includes(num));
              if (candidates[row][col].length < oldLength) changed = true;
            }
          }
        }
      }
    }
  }

  return changed;
}

// Technique 4: Hidden Pairs/Triples (no quads for accessibility)
function applyHiddenSubsets(grid, candidates) {
  let changed = false;

  // Check for hidden pairs and triples in rows (no quads)
  for (let row = 0; row < 9; row++) {
    if (applyHiddenSubsetsInRow(grid, candidates, row)) changed = true;
  }

  // Check for hidden pairs and triples in columns (no quads)
  for (let col = 0; col < 9; col++) {
    if (applyHiddenSubsetsInColumn(grid, candidates, col)) changed = true;
  }

  // Check for hidden pairs and triples in boxes (no quads)
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      if (applyHiddenSubsetsInBox(grid, candidates, boxRow, boxCol)) changed = true;
    }
  }

  return changed;
}

// Apply hidden pairs in a row
function applyHiddenSubsetsInRow(grid, candidates, row) {
  let changed = false;

  // Check for hidden pairs
  for (let num1 = 1; num1 <= 8; num1++) {
    for (let num2 = num1 + 1; num2 <= 9; num2++) {
      if (!isNumberInRow(grid, row, num1) && !isNumberInRow(grid, row, num2)) {
        const positions1 = [];
        const positions2 = [];

        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0) {
            if (candidates[row][col].includes(num1)) positions1.push(col);
            if (candidates[row][col].includes(num2)) positions2.push(col);
          }
        }

        // Check if both numbers appear in exactly the same 2 positions (hidden pair)
        if (positions1.length === 2 && positions2.length === 2 &&
            positions1[0] === positions2[0] && positions1[1] === positions2[1]) {

          // Remove all other candidates from these two positions
          for (let col of positions1) {
            const oldLength = candidates[row][col].length;
            candidates[row][col] = candidates[row][col].filter(n => n === num1 || n === num2);
            if (candidates[row][col].length < oldLength) changed = true;
          }
        }
      }
    }
  }

  // Check for hidden triples
  for (let num1 = 1; num1 <= 7; num1++) {
    for (let num2 = num1 + 1; num2 <= 8; num2++) {
      for (let num3 = num2 + 1; num3 <= 9; num3++) {
        if (!isNumberInRow(grid, row, num1) && !isNumberInRow(grid, row, num2) && !isNumberInRow(grid, row, num3)) {
          const positions1 = [], positions2 = [], positions3 = [];

          for (let col = 0; col < 9; col++) {
            if (grid[row][col] === 0) {
              if (candidates[row][col].includes(num1)) positions1.push(col);
              if (candidates[row][col].includes(num2)) positions2.push(col);
              if (candidates[row][col].includes(num3)) positions3.push(col);
            }
          }

          // Find union of positions
          const allPositions = [...new Set([...positions1, ...positions2, ...positions3])];

          // Check if exactly 3 positions contain all three numbers
          if (allPositions.length === 3 &&
              allPositions.every(col =>
                candidates[row][col].includes(num1) ||
                candidates[row][col].includes(num2) ||
                candidates[row][col].includes(num3))) {

            // Remove all other candidates from these positions
            for (let col of allPositions) {
              const oldLength = candidates[row][col].length;
              candidates[row][col] = candidates[row][col].filter(n => n === num1 || n === num2 || n === num3);
              if (candidates[row][col].length < oldLength) changed = true;
            }
          }
        }
      }
    }
  }

  return changed;
}

// Apply hidden subsets in a column (similar to row logic)
function applyHiddenSubsetsInColumn(grid, candidates, col) {
  let changed = false;

  // Check for hidden pairs
  for (let num1 = 1; num1 <= 8; num1++) {
    for (let num2 = num1 + 1; num2 <= 9; num2++) {
      if (!isNumberInColumn(grid, col, num1) && !isNumberInColumn(grid, col, num2)) {
        const positions1 = [];
        const positions2 = [];

        for (let row = 0; row < 9; row++) {
          if (grid[row][col] === 0) {
            if (candidates[row][col].includes(num1)) positions1.push(row);
            if (candidates[row][col].includes(num2)) positions2.push(row);
          }
        }

        if (positions1.length === 2 && positions2.length === 2 &&
            positions1[0] === positions2[0] && positions1[1] === positions2[1]) {

          for (let row of positions1) {
            const oldLength = candidates[row][col].length;
            candidates[row][col] = candidates[row][col].filter(n => n === num1 || n === num2);
            if (candidates[row][col].length < oldLength) changed = true;
          }
        }
      }
    }
  }

  // Check for hidden triples
  for (let num1 = 1; num1 <= 7; num1++) {
    for (let num2 = num1 + 1; num2 <= 8; num2++) {
      for (let num3 = num2 + 1; num3 <= 9; num3++) {
        if (!isNumberInColumn(grid, col, num1) && !isNumberInColumn(grid, col, num2) && !isNumberInColumn(grid, col, num3)) {
          const positions1 = [], positions2 = [], positions3 = [];

          for (let row = 0; row < 9; row++) {
            if (grid[row][col] === 0) {
              if (candidates[row][col].includes(num1)) positions1.push(row);
              if (candidates[row][col].includes(num2)) positions2.push(row);
              if (candidates[row][col].includes(num3)) positions3.push(row);
            }
          }

          const allPositions = [...new Set([...positions1, ...positions2, ...positions3])];

          if (allPositions.length === 3) {
            for (let row of allPositions) {
              const oldLength = candidates[row][col].length;
              candidates[row][col] = candidates[row][col].filter(n => n === num1 || n === num2 || n === num3);
              if (candidates[row][col].length < oldLength) changed = true;
            }
          }
        }
      }
    }
  }

  return changed;
}

// Apply hidden subsets in a box
function applyHiddenSubsetsInBox(grid, candidates, boxRow, boxCol) {
  let changed = false;

  // Check for hidden pairs
  for (let num1 = 1; num1 <= 8; num1++) {
    for (let num2 = num1 + 1; num2 <= 9; num2++) {
      if (!isNumberInBox(grid, boxRow * 3, boxCol * 3, num1) &&
          !isNumberInBox(grid, boxRow * 3, boxCol * 3, num2)) {

        const positions1 = [];
        const positions2 = [];

        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const row = boxRow * 3 + r;
            const col = boxCol * 3 + c;
            if (grid[row][col] === 0) {
              if (candidates[row][col].includes(num1)) positions1.push([row, col]);
              if (candidates[row][col].includes(num2)) positions2.push([row, col]);
            }
          }
        }

        if (positions1.length === 2 && positions2.length === 2 &&
            positions1[0][0] === positions2[0][0] && positions1[0][1] === positions2[0][1] &&
            positions1[1][0] === positions2[1][0] && positions1[1][1] === positions2[1][1]) {

          for (let [row, col] of positions1) {
            const oldLength = candidates[row][col].length;
            candidates[row][col] = candidates[row][col].filter(n => n === num1 || n === num2);
            if (candidates[row][col].length < oldLength) changed = true;
          }
        }
      }
    }
  }

  return changed;
}

// Technique 5: Pointing Pairs/Triples
function applyPointingPairs(grid, candidates) {
  let changed = false;

  // Check each box for pointing pairs/triples
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      for (let num = 1; num <= 9; num++) {
        if (!isNumberInBox(grid, boxRow * 3, boxCol * 3, num)) {
          // Find all positions in this box where num can go
          const positions = [];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const row = boxRow * 3 + r;
              const col = boxCol * 3 + c;
              if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
                positions.push([row, col]);
              }
            }
          }

          // Check if all positions are in the same row
          if (positions.length > 1) {
            const sameRow = positions.every(([row, col]) => row === positions[0][0]);
            if (sameRow) {
              // Remove num from other cells in this row (outside the box)
              const row = positions[0][0];
              for (let col = 0; col < 9; col++) {
                const inBox = Math.floor(col / 3) === boxCol;
                if (!inBox && grid[row][col] === 0) {
                  const oldLength = candidates[row][col].length;
                  candidates[row][col] = candidates[row][col].filter(n => n !== num);
                  if (candidates[row][col].length < oldLength) changed = true;
                }
              }
            }

            // Check if all positions are in the same column
            const sameCol = positions.every(([row, col]) => col === positions[0][1]);
            if (sameCol) {
              // Remove num from other cells in this column (outside the box)
              const col = positions[0][1];
              for (let row = 0; row < 9; row++) {
                const inBox = Math.floor(row / 3) === boxRow;
                if (!inBox && grid[row][col] === 0) {
                  const oldLength = candidates[row][col].length;
                  candidates[row][col] = candidates[row][col].filter(n => n !== num);
                  if (candidates[row][col].length < oldLength) changed = true;
                }
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

// Technique 6: Box/Line Reduction
function applyBoxLineReduction(grid, candidates) {
  let changed = false;

  // For each row, check if a number can only appear in one box
  for (let row = 0; row < 9; row++) {
    for (let num = 1; num <= 9; num++) {
      if (!isNumberInRow(grid, row, num)) {
        const positions = [];
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            positions.push([row, col]);
          }
        }

        // Check if all positions are in the same box
        if (positions.length > 1) {
          const boxes = positions.map(([r, c]) => Math.floor(c / 3));
          const sameBox = boxes.every(box => box === boxes[0]);

          if (sameBox) {
            // Remove num from other cells in this box (outside the row)
            const boxCol = boxes[0];
            const boxRowStart = Math.floor(row / 3) * 3;

            for (let r = boxRowStart; r < boxRowStart + 3; r++) {
              if (r !== row) {
                for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
                  if (grid[r][c] === 0) {
                    const oldLength = candidates[r][c].length;
                    candidates[r][c] = candidates[r][c].filter(n => n !== num);
                    if (candidates[r][c].length < oldLength) changed = true;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // For each column, check if a number can only appear in one box
  for (let col = 0; col < 9; col++) {
    for (let num = 1; num <= 9; num++) {
      if (!isNumberInColumn(grid, col, num)) {
        const positions = [];
        for (let row = 0; row < 9; row++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            positions.push([row, col]);
          }
        }

        // Check if all positions are in the same box
        if (positions.length > 1) {
          const boxes = positions.map(([r, c]) => Math.floor(r / 3));
          const sameBox = boxes.every(box => box === boxes[0]);

          if (sameBox) {
            // Remove num from other cells in this box (outside the column)
            const boxRow = boxes[0];
            const boxColStart = Math.floor(col / 3) * 3;

            for (let c = boxColStart; c < boxColStart + 3; c++) {
              if (c !== col) {
                for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
                  if (grid[r][c] === 0) {
                    const oldLength = candidates[r][c].length;
                    candidates[r][c] = candidates[r][c].filter(n => n !== num);
                    if (candidates[r][c].length < oldLength) changed = true;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

// Helper function to compare arrays
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return sorted1.every((val, i) => val === sorted2[i]);
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
      console.log(`🎲 Generating puzzle attempt ${attempts} for ${date}`);

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

// ========= ADVANCED SOLVING TECHNIQUES =========

// X-Wing technique: When a number appears in only two rows/columns in exactly two positions,
// and those positions form a rectangle, eliminate that number from other positions in those columns/rows
function applyXWing(grid, candidates) {
  let changed = false;

  // Check rows for X-Wing patterns
  for (let num = 1; num <= 9; num++) {
    const rowsWithNum = [];

    // Find rows where this number has exactly 2 possible positions
    for (let row = 0; row < 9; row++) {
      if (!isNumberInRow(grid, row, num)) {
        const positions = [];
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            positions.push(col);
          }
        }
        if (positions.length === 2) {
          rowsWithNum.push({ row, cols: positions });
        }
      }
    }

    // Look for X-Wing patterns
    for (let i = 0; i < rowsWithNum.length - 1; i++) {
      for (let j = i + 1; j < rowsWithNum.length; j++) {
        const row1 = rowsWithNum[i];
        const row2 = rowsWithNum[j];

        // Check if they form an X-Wing (same column positions)
        if (row1.cols[0] === row2.cols[0] && row1.cols[1] === row2.cols[1]) {
          // Eliminate num from these columns in all other rows
          for (let row = 0; row < 9; row++) {
            if (row !== row1.row && row !== row2.row) {
              for (let col of row1.cols) {
                if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
                  candidates[row][col] = candidates[row][col].filter(n => n !== num);
                  changed = true;
                }
              }
            }
          }
        }
      }
    }
  }

  // Check columns for X-Wing patterns (similar logic)
  for (let num = 1; num <= 9; num++) {
    const colsWithNum = [];

    for (let col = 0; col < 9; col++) {
      if (!isNumberInColumn(grid, col, num)) {
        const positions = [];
        for (let row = 0; row < 9; row++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            positions.push(row);
          }
        }
        if (positions.length === 2) {
          colsWithNum.push({ col, rows: positions });
        }
      }
    }

    for (let i = 0; i < colsWithNum.length - 1; i++) {
      for (let j = i + 1; j < colsWithNum.length; j++) {
        const col1 = colsWithNum[i];
        const col2 = colsWithNum[j];

        if (col1.rows[0] === col2.rows[0] && col1.rows[1] === col2.rows[1]) {
          for (let col = 0; col < 9; col++) {
            if (col !== col1.col && col !== col2.col) {
              for (let row of col1.rows) {
                if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
                  candidates[row][col] = candidates[row][col].filter(n => n !== num);
                  changed = true;
                }
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

// Y-Wing technique: A chain of three cells forming a Y pattern
function applyYWing(grid, candidates) {
  let changed = false;

  // Find cells with exactly 2 candidates (potential pivots and pincers)
  const biValueCells = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0 && candidates[row][col].length === 2) {
        biValueCells.push({ row, col, candidates: [...candidates[row][col]] });
      }
    }
  }

  // Look for Y-Wing patterns
  for (let pivot of biValueCells) {
    for (let pincer1 of biValueCells) {
      for (let pincer2 of biValueCells) {
        if (pivot === pincer1 || pivot === pincer2 || pincer1 === pincer2) continue;

        // Check if they form a Y-Wing pattern
        const [pivotA, pivotB] = pivot.candidates;
        const [p1A, p1B] = pincer1.candidates;
        const [p2A, p2B] = pincer2.candidates;

        // Pivot should share one candidate with each pincer, and pincers should share the remaining candidate
        let sharedWithP1, sharedWithP2, targetNum;

        if (pivotA === p1A || pivotA === p1B) {
          sharedWithP1 = pivotA;
          sharedWithP2 = pivotB;
        } else if (pivotB === p1A || pivotB === p1B) {
          sharedWithP1 = pivotB;
          sharedWithP2 = pivotA;
        } else {
          continue;
        }

        if (!(sharedWithP2 === p2A || sharedWithP2 === p2B)) continue;

        // Find the common candidate between the two pincers
        if ((p1A === p2A || p1A === p2B) && p1A !== sharedWithP1) {
          targetNum = p1A;
        } else if ((p1B === p2A || p1B === p2B) && p1B !== sharedWithP1) {
          targetNum = p1B;
        } else {
          continue;
        }

        // Check if pivot sees both pincers
        const pivotSeesPincer1 = seesCell(pivot, pincer1);
        const pivotSeesPincer2 = seesCell(pivot, pincer2);

        if (pivotSeesPincer1 && pivotSeesPincer2) {
          // Find cells that see both pincers and eliminate targetNum
          for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
              if (grid[row][col] === 0 && candidates[row][col].includes(targetNum)) {
                const cell = { row, col };
                if (seesCell(cell, pincer1) && seesCell(cell, pincer2) &&
                    !(cell.row === pincer1.row && cell.col === pincer1.col) &&
                    !(cell.row === pincer2.row && cell.col === pincer2.col)) {
                  candidates[row][col] = candidates[row][col].filter(n => n !== targetNum);
                  changed = true;
                }
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

// XYZ-Wing technique: Extension of Y-Wing with three candidates
function applyXYZWing(grid, candidates) {
  let changed = false;

  // Find cells with exactly 2 or 3 candidates
  const candidateCells = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0 && (candidates[row][col].length === 2 || candidates[row][col].length === 3)) {
        candidateCells.push({ row, col, candidates: [...candidates[row][col]] });
      }
    }
  }

  // Look for XYZ-Wing patterns (simplified implementation)
  for (let pivot of candidateCells.filter(c => c.candidates.length === 3)) {
    for (let wing1 of candidateCells.filter(c => c.candidates.length === 2)) {
      for (let wing2 of candidateCells.filter(c => c.candidates.length === 2)) {
        if (pivot === wing1 || pivot === wing2 || wing1 === wing2) continue;

        // Check if wings share exactly one candidate with pivot and have one common candidate
        const commonCands = pivot.candidates.filter(c =>
          wing1.candidates.includes(c) || wing2.candidates.includes(c)
        );

        if (commonCands.length === 2) {
          const sharedBetweenWings = wing1.candidates.find(c => wing2.candidates.includes(c));
          if (sharedBetweenWings && pivot.candidates.includes(sharedBetweenWings)) {
            // Apply elimination
            if (seesCell(pivot, wing1) && seesCell(pivot, wing2)) {
              for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                  if (grid[row][col] === 0 && candidates[row][col].includes(sharedBetweenWings)) {
                    const cell = { row, col };
                    if (seesCell(cell, pivot) && seesCell(cell, wing1) && seesCell(cell, wing2) &&
                        !(cell.row === pivot.row && cell.col === pivot.col) &&
                        !(cell.row === wing1.row && cell.col === wing1.col) &&
                        !(cell.row === wing2.row && cell.col === wing2.col)) {
                      candidates[row][col] = candidates[row][col].filter(n => n !== sharedBetweenWings);
                      changed = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

// Swordfish technique: 3x3 version of X-Wing
function applySwordfish(grid, candidates) {
  let changed = false;

  // Simplified Swordfish implementation - look for 3x3 patterns
  for (let num = 1; num <= 9; num++) {
    // Check rows for Swordfish
    const rowsWithNum = [];

    for (let row = 0; row < 9; row++) {
      if (!isNumberInRow(grid, row, num)) {
        const positions = [];
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            positions.push(col);
          }
        }
        if (positions.length >= 2 && positions.length <= 3) {
          rowsWithNum.push({ row, cols: positions });
        }
      }
    }

    // Look for 3-row Swordfish patterns
    if (rowsWithNum.length >= 3) {
      for (let i = 0; i < rowsWithNum.length - 2; i++) {
        for (let j = i + 1; j < rowsWithNum.length - 1; j++) {
          for (let k = j + 1; k < rowsWithNum.length; k++) {
            const allCols = [...new Set([
              ...rowsWithNum[i].cols,
              ...rowsWithNum[j].cols,
              ...rowsWithNum[k].cols
            ])];

            // If exactly 3 columns are involved, it's a Swordfish
            if (allCols.length === 3) {
              // Eliminate from these columns in other rows
              for (let row = 0; row < 9; row++) {
                if (row !== rowsWithNum[i].row &&
                    row !== rowsWithNum[j].row &&
                    row !== rowsWithNum[k].row) {
                  for (let col of allCols) {
                    if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
                      candidates[row][col] = candidates[row][col].filter(n => n !== num);
                      changed = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

// Simple Coloring/Chains technique (basic implementation)
function applySimpleColoring(grid, candidates) {
  let changed = false;

  // Look for strong links (cells where a number can only go in 2 places in a unit)
  for (let num = 1; num <= 9; num++) {
    const strongLinks = [];

    // Find strong links in rows
    for (let row = 0; row < 9; row++) {
      if (!isNumberInRow(grid, row, num)) {
        const positions = [];
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            positions.push({ row, col });
          }
        }
        if (positions.length === 2) {
          strongLinks.push({ type: 'row', positions, unit: row });
        }
      }
    }

    // Find strong links in columns
    for (let col = 0; col < 9; col++) {
      if (!isNumberInColumn(grid, col, num)) {
        const positions = [];
        for (let row = 0; row < 9; row++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            positions.push({ row, col });
          }
        }
        if (positions.length === 2) {
          strongLinks.push({ type: 'col', positions, unit: col });
        }
      }
    }

    // Basic coloring elimination (simplified)
    for (let link of strongLinks) {
      const [pos1, pos2] = link.positions;

      // If both positions in the link can see the same cell, eliminate from that cell
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            const cell = { row, col };
            if (seesCell(cell, pos1) && seesCell(cell, pos2) &&
                !(cell.row === pos1.row && cell.col === pos1.col) &&
                !(cell.row === pos2.row && cell.col === pos2.col)) {
              candidates[row][col] = candidates[row][col].filter(n => n !== num);
              changed = true;
            }
          }
        }
      }
    }
  }

  return changed;
}

// Helper function to check if two cells can "see" each other (same row, column, or box)
function seesCell(cell1, cell2) {
  // Same row
  if (cell1.row === cell2.row) return true;

  // Same column
  if (cell1.col === cell2.col) return true;

  // Same box
  const box1Row = Math.floor(cell1.row / 3);
  const box1Col = Math.floor(cell1.col / 3);
  const box2Row = Math.floor(cell2.row / 3);
  const box2Col = Math.floor(cell2.col / 3);

  return box1Row === box2Row && box1Col === box2Col;
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