// Test the countSolutions function to verify it actually detects multiple solutions

function isValidPuzzleState(puzzle) {
  // Check rows for duplicates
  for (let row = 0; row < 9; row++) {
    const seen = new Set();
    for (let col = 0; col < 9; col++) {
      const num = puzzle[row][col];
      if (num !== 0) {
        if (seen.has(num)) return false;
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
        if (seen.has(num)) return false;
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
            if (seen.has(num)) return false;
            seen.add(num);
          }
        }
      }
    }
  }

  return true;
}

function countSolutions(puzzle, maxSolutions = 2) {
  if (!isValidPuzzleState(puzzle)) {
    return 0;
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
    if (solutions.length >= maxSolutions) return;

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

              if (solutions.length >= maxSolutions) return;
            }
          }
          if (!foundValid) return;
          return;
        }
      }
    }

    // Grid is complete - found a solution
    solutions.push(grid.map(row => [...row]));
  }

  solveAndCount(testGrid);
  return solutions.length;
}

// Test 1: Puzzle with unique solution (minimal Sudoku)
console.log('Test 1: Known unique solution puzzle');
const uniquePuzzle = [
  [0, 0, 3, 0, 2, 0, 6, 0, 0],
  [9, 0, 0, 3, 0, 5, 0, 0, 1],
  [0, 0, 1, 8, 0, 6, 4, 0, 0],
  [0, 0, 8, 1, 0, 2, 9, 0, 0],
  [7, 0, 0, 0, 0, 0, 0, 0, 8],
  [0, 0, 6, 7, 0, 8, 2, 0, 0],
  [0, 0, 2, 6, 0, 9, 5, 0, 0],
  [8, 0, 0, 2, 0, 3, 0, 0, 9],
  [0, 0, 5, 0, 1, 0, 3, 0, 0]
];
const count1 = countSolutions(uniquePuzzle, 3);
console.log(`Solutions found: ${count1} (expected: 1)`);
console.log(count1 === 1 ? '✓ PASS' : '✗ FAIL');

// Test 2: Puzzle with multiple solutions (remove more clues)
console.log('\nTest 2: Puzzle designed to have multiple solutions');
const multiplePuzzle = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 2, 3, 4, 5, 6, 7, 8, 9]
];
const count2 = countSolutions(multiplePuzzle, 3);
console.log(`Solutions found: ${count2} (expected: 2+)`);
console.log(count2 >= 2 ? '✓ PASS' : '✗ FAIL');

// Test 3: Easy puzzle with too few clues
console.log('\nTest 3: Under-constrained puzzle (only 17 clues scattered)');
const underConstrained = [
  [0, 0, 3, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 5, 0, 0, 1],
  [0, 0, 1, 0, 0, 6, 0, 0, 0],
  [0, 0, 8, 0, 0, 0, 9, 0, 0],
  [7, 0, 0, 0, 0, 0, 0, 0, 8],
  [0, 0, 6, 0, 0, 8, 0, 0, 0],
  [0, 0, 2, 6, 0, 0, 0, 0, 0],
  [8, 0, 0, 2, 0, 0, 0, 0, 9],
  [0, 0, 5, 0, 0, 0, 3, 0, 0]
];
const count3 = countSolutions(underConstrained, 3);
console.log(`Solutions found: ${count3} (expected: 2+ for under-constrained)`);
console.log(count3 >= 2 ? '✓ PASS (multiple solutions detected)' : '? Result: ' + count3);

console.log('\n========================================');
console.log('SUMMARY: countSolutions function test');
console.log('========================================');
console.log('If all tests pass, countSolutions is working correctly');
console.log('If tests fail, there is a bug in the solution counting logic');
