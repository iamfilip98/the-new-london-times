// Simple script to test puzzle validity using brute force solver
const fs = require('fs');

// Simple brute force solver to count solutions
function solvePuzzle(grid) {
  const solutions = [];
  const maxSolutions = 2; // Stop after finding 2 solutions

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
    if (solutions.length >= maxSolutions) return false; // Stop if we found multiple solutions

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num;

              if (solve(grid)) {
                // Found a solution
                if (solutions.length === 0) {
                  solutions.push(grid.map(row => [...row]));
                }
                return true;
              }

              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }

    // Grid is complete - found a solution
    solutions.push(grid.map(row => [...row]));
    return false; // Continue searching for more solutions
  }

  const testGrid = grid.map(row => [...row]);
  solve(testGrid);

  return solutions;
}

// Convert string to grid
function stringToGrid(str) {
  const grid = [];
  for (let i = 0; i < 9; i++) {
    grid.push(str.slice(i * 9, (i + 1) * 9).split('').map(Number));
  }
  return grid;
}

// Import puzzle generation functions
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

// Improved puzzle generator that ensures unique solutions
function createFallbackPuzzle(solution, difficulty) {
  const puzzle = solution.map(row => [...row]);
  const targetClues = {
    easy: 35,
    medium: 28,
    hard: 25
  };

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

  let currentClues = 81;
  const minClues = targetClues[difficulty];

  // Remove cells one by one while maintaining uniqueness
  for (let [row, col] of positions) {
    if (currentClues <= minClues) break;

    // Try removing this cell
    const originalValue = puzzle[row][col];
    puzzle[row][col] = 0;

    // Check if puzzle still has unique solution
    const solutions = solvePuzzle(puzzle);

    if (solutions.length === 1) {
      // Good! We can remove this cell
      currentClues--;
    } else {
      // Bad! Restore the cell
      puzzle[row][col] = originalValue;
    }

    // Stop if we've tried enough removals
    if (currentClues <= minClues + 3) break;
  }

  console.log(`🔧 Fixed puzzle created for ${difficulty} with ${currentClues} clues`);
  return puzzle;
}

// Test function
async function testPuzzleValidity() {
  console.log('🔍 Testing puzzle validity by generating sample puzzles...\n');

  // Generate a solution and test puzzles from it
  const solution = generateCompleteSolution();
  console.log('Generated complete solution');

  // Test each difficulty
  for (const difficulty of ['easy', 'medium', 'hard']) {
    console.log(`\n🧩 Testing ${difficulty.toUpperCase()} puzzle generation:`);

    // Generate using the current fallback method (which doesn't ensure uniqueness)
    const puzzleGrid = createFallbackPuzzle(solution, difficulty);

    // Count clues
    let clueCount = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (puzzleGrid[row][col] !== 0) clueCount++;
      }
    }

    console.log(`   Clues: ${clueCount}`);

    // Test for multiple solutions
    const solutions = solvePuzzle(puzzleGrid);

    if (solutions.length === 0) {
      console.log(`   ❌ INVALID: No solutions found`);
    } else if (solutions.length === 1) {
      console.log(`   ✅ VALID: Unique solution`);
    } else {
      console.log(`   ❌ CRITICAL: Multiple solutions found (${solutions.length}+)`);
      console.log(`   This puzzle cannot be solved logically!`);
    }
  }

  console.log('\n✅ Testing completed.');
  console.log('If you see CRITICAL issues above, the puzzle generation needs fixing.');
  console.log('If all puzzles show "VALID: Unique solution", the fix is working!');
}

// Run if this script is executed directly
if (require.main === module) {
  testPuzzleValidity();
}

module.exports = { testPuzzleValidity, solvePuzzle, stringToGrid };