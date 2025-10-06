// Transcribing the grid from the screenshot
// Orange cells = currently selected, Blue = user filled, Black = original clues

const grid = [
  // Row 1: 3 8 1 | 9 4 2(orange) | 5 6 7
  [3, 8, 1, 9, 4, 2, 5, 6, 7],

  // Row 2: _(4,7) 2(orange) _(4,7) | _(1,5) 6 _(1,5) | _ 8 3
  // The last cell appears to be empty, not 9
  [0, 2, 0, 0, 6, 0, 0, 8, 3],

  // Row 3: 9 6 5 | 3 7 8 | 4 1 2(orange)
  [9, 6, 5, 3, 7, 8, 4, 1, 2],

  // Row 4: _(1,4) 5 8 | _(1,4) 9 3 | 7 2(orange) 6
  [0, 5, 8, 0, 9, 3, 7, 2, 6],

  // Row 5: 6 _(1,4,7) _(4,7) | 2(orange) 8 _(1,4) | 9 5 3
  [6, 0, 0, 2, 8, 0, 9, 5, 3],

  // Row 6: 2(orange) 3 9 | 6 5 7 | 1 8 4
  [2, 3, 9, 6, 5, 7, 1, 8, 4],

  // Row 7: 8 9 3 | 7 1 6 | 2(orange) 4 5
  [8, 9, 3, 7, 1, 6, 2, 4, 5],

  // Row 8: _(4,5,7) _(4,7) 2(orange) | 8 3 _(4,5) | 6 9 1
  [0, 0, 2, 8, 3, 0, 6, 9, 1],

  // Row 9: _(1,4,5) _(1,4) _ | 6 _(4,5) 2(orange) | 9 3 7 8
  // Wait, this row has 10 values! Let me recount...
  // Looking again: _ _ _ | 6 _ 2(orange) | 9 3 7 ... and then 8?
  // I think the rightmost 8 might be just outside the grid border or it's position 9
  [0, 0, 0, 6, 0, 2, 9, 3, 7], // Assuming position 9 is 7 not 8
];

// Wait, let me look at the complete rows to figure this out
// Row 3 shows: 9 6 5 3 7 8 4 1 2 - that's 9 cells ✓
// Row 6 shows: 2 3 9 6 5 7 1 8 4 - that's 9 cells ✓
// Row 7 shows: 8 9 3 7 1 6 2 4 5 - that's 9 cells ✓

// Looking at row 9 more carefully, I see: _, _, _ (in box 1), then 6, _, 2 (in box 2), then 9, 3, 7 (in box 3)
// And there might be an 8 visible but it could be a user note or outside

// Let me verify using column constraints
// Column 9 (rightmost): 7, 3, 2, 6, 3, 4, 5, 1, 7
// That has duplicate 7 and 3! So something's wrong

// Let me re-examine row 2 more carefully
// I see candidates (4,7) in small text, then 2(orange), then more cells
// Actually looking at the grid pattern, I think row 2 might be:
// _(4,7), 2(orange), _(4,7), _(1,5), 6, _(1,5), _, 8, 3
// Nope, still 9 cells but wait - maybe there IS a 9 at the end!

console.log("Let me try a different approach - reading by columns:");
console.log("\nColumn 1: 3, ?, 9, ?, 6, 2, 8, ?, ?");
console.log("Column 2: 8, 2, 6, 5, ?, 3, 9, ?, ?");
console.log("Column 3: 1, ?, 5, 8, ?, 9, 3, 2, ?");
console.log("Column 4: 9, ?, 3, ?, 2, 6, 7, 8, 6"); // 6 appears twice? Impossible!

console.log("\nHmm, there's definitely an error in my transcription.");
console.log("Let me start over and be more careful...\n");

// Starting fresh - looking at complete rows first to anchor
const correctGrid = [
  [3, 8, 1, 9, 4, 2, 5, 6, 7],  // Row 1: COMPLETE
  [0, 2, 0, 0, 6, 0, 0, 8, 3],  // Row 2: positions 1,3,4,6,7 are empty ... wait let me verify
  [9, 6, 5, 3, 7, 8, 4, 1, 2],  // Row 3: COMPLETE
  [0, 5, 8, 0, 9, 3, 7, 2, 6],  // Row 4: positions 1,4 empty
  [6, 0, 0, 2, 8, 0, 9, 5, 3],  // Row 5: positions 2,3,6 empty
  [2, 3, 9, 6, 5, 7, 1, 8, 4],  // Row 6: COMPLETE
  [8, 9, 3, 7, 1, 6, 2, 4, 5],  // Row 7: COMPLETE
  [0, 0, 2, 8, 3, 0, 6, 9, 1],  // Row 8: positions 1,2,6 empty
  [0, 0, 0, 6, 0, 2, 9, 3, 0],  // Row 9: positions 1,2,3,5,9 empty
];

// Verify no duplicates in complete rows
function checkRow(grid, rowNum) {
  const row = grid[rowNum];
  const nonZero = row.filter(x => x !== 0);
  const unique = new Set(nonZero);
  if (nonZero.length !== unique.size) {
    console.log(`❌ Row ${rowNum + 1} has duplicates: ${row.join(' ')}`);
    return false;
  }
  return true;
}

console.log("=== Validating grid ===");
for (let i = 0; i < 9; i++) {
  checkRow(correctGrid, i);
}

// Check column 4 specifically since I noticed an issue
console.log("\nColumn 4:");
for (let row = 0; row < 9; row++) {
  console.log(`  Row ${row + 1}: ${correctGrid[row][3]}`);
}

// Now let's analyze
console.log("\n=== Finding next moves ===\n");

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

console.log("Current grid:");
printGrid(correctGrid);

console.log("\n=== Candidates for each empty cell ===\n");

const emptyCells = [];
for (let row = 0; row < 9; row++) {
  for (let col = 0; col < 9; col++) {
    if (correctGrid[row][col] === 0) {
      const candidates = getPossibleValues(correctGrid, row, col);
      emptyCells.push({ row, col, candidates });
      console.log(`R${row + 1}C${col + 1}: [${candidates.join(', ')}]`);
    }
  }
}

// Find naked singles
console.log("\n=== NAKED SINGLES (cells with only 1 candidate) ===");
const nakedSingles = emptyCells.filter(c => c.candidates.length === 1);
if (nakedSingles.length > 0) {
  nakedSingles.forEach(cell => {
    console.log(`✅ R${cell.row + 1}C${cell.col + 1} = ${cell.candidates[0]}`);
  });
} else {
  console.log("None found");
}

// Find hidden singles in rows
console.log("\n=== HIDDEN SINGLES IN ROWS ===");
let foundHidden = false;
for (let row = 0; row < 9; row++) {
  for (let num = 1; num <= 9; num++) {
    if (correctGrid[row].includes(num)) continue;

    const positions = [];
    for (let col = 0; col < 9; col++) {
      if (correctGrid[row][col] === 0 && isValidPlacement(correctGrid, row, col, num)) {
        positions.push(col + 1);
      }
    }

    if (positions.length === 1) {
      console.log(`✅ R${row + 1}C${positions[0]} = ${num} (only place in row ${row + 1})`);
      foundHidden = true;
    }
  }
}
if (!foundHidden) console.log("None found");

// Find hidden singles in columns
console.log("\n=== HIDDEN SINGLES IN COLUMNS ===");
foundHidden = false;
for (let col = 0; col < 9; col++) {
  for (let num = 1; num <= 9; num++) {
    let inCol = false;
    for (let row = 0; row < 9; row++) {
      if (correctGrid[row][col] === num) {
        inCol = true;
        break;
      }
    }
    if (inCol) continue;

    const positions = [];
    for (let row = 0; row < 9; row++) {
      if (correctGrid[row][col] === 0 && isValidPlacement(correctGrid, row, col, num)) {
        positions.push(row + 1);
      }
    }

    if (positions.length === 1) {
      console.log(`✅ R${positions[0]}C${col + 1} = ${num} (only place in column ${col + 1})`);
      foundHidden = true;
    }
  }
}
if (!foundHidden) console.log("None found");

// Find hidden singles in boxes
console.log("\n=== HIDDEN SINGLES IN BOXES ===");
foundHidden = false;
for (let boxRow = 0; boxRow < 3; boxRow++) {
  for (let boxCol = 0; boxCol < 3; boxCol++) {
    const boxNum = boxRow * 3 + boxCol + 1;

    for (let num = 1; num <= 9; num++) {
      let inBox = false;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (correctGrid[boxRow * 3 + r][boxCol * 3 + c] === num) {
            inBox = true;
            break;
          }
        }
        if (inBox) break;
      }
      if (inBox) continue;

      const positions = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const row = boxRow * 3 + r;
          const col = boxCol * 3 + c;
          if (correctGrid[row][col] === 0 && isValidPlacement(correctGrid, row, col, num)) {
            positions.push([row + 1, col + 1]);
          }
        }
      }

      if (positions.length === 1) {
        console.log(`✅ R${positions[0][0]}C${positions[0][1]} = ${num} (only place in box ${boxNum})`);
        foundHidden = true;
      }
    }
  }
}
if (!foundHidden) console.log("None found");

if (!foundHidden && nakedSingles.length === 0) {
  console.log("\n⚠️  NO BASIC MOVES FOUND!");
  console.log("This puzzle requires advanced techniques like:");
  console.log("  - Naked Pairs/Triples");
  console.log("  - Hidden Pairs/Triples");
  console.log("  - Pointing Pairs/Box-Line Reduction");
  console.log("  - X-Wing / Swordfish");
  console.log("  - Y-Wing / XYZ-Wing");
}
