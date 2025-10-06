// Analyze the current puzzle state from the screenshot
// Blue numbers = user filled, Black numbers = given clues, Orange = selected cell

const currentState = [
  [3, 8, 1, 9, 4, 2, 5, 6, 7],
  [4, 2, 4, 1, 6, 1, 0, 8, 3, 9], // Row 2 has issues - let me reparse
  [9, 6, 5, 3, 7, 8, 4, 1, 2],
  [1, 5, 8, 1, 9, 3, 7, 2, 6],
  [6, 1, 4, 2, 8, 1, 9, 5, 3],
  [2, 3, 9, 6, 5, 7, 1, 8, 4],
  [8, 9, 3, 7, 1, 6, 2, 4, 5],
  [4, 4, 2, 8, 3, 4, 6, 9, 1],
  [1, 1, 0, 6, 4, 2, 9, 3, 7, 8]
];

// Let me re-read more carefully from the image
const grid = [
  [3, 8, 1, 9, 4, 2, 5, 6, 7],
  [0, 2, 0, 0, 6, 0, 0, 8, 3, 9], // Row 2: _, 2, _, _, 6, _, _, 8, 3, 9 (has candidates 4,7 and 1,5 shown)
  [9, 6, 5, 3, 7, 8, 4, 1, 2],
  [0, 5, 8, 0, 9, 3, 7, 2, 6], // Row 4: _, 5, 8, _, 9, 3, 7, 2, 6
  [6, 0, 0, 2, 8, 0, 9, 5, 3], // Row 5: 6, _, _, 2, 8, _, 9, 5, 3
  [2, 3, 9, 6, 5, 7, 1, 8, 4],
  [8, 9, 3, 7, 1, 6, 2, 4, 5],
  [0, 0, 2, 8, 3, 0, 6, 9, 1], // Row 8: _, _, 2, 8, 3, _, 6, 9, 1
  [0, 0, 0, 6, 0, 2, 9, 3, 7, 8] // Row 9: _, _, _, 6, _, 2, 9, 3, 7, 8
];

// Actually let me read this more carefully. Looking at the image:
const actualGrid = [
  // Row 1: all filled
  [3, 8, 1, 9, 4, 2, 5, 6, 7],
  // Row 2: _,2,_,_,6,_,_,8,3,9 - WAIT this is 10 cells!
  // Let me recount: 3,8,1,9,4,2(orange),5,6,7 = row 1 (9 cells) ✓
  // Row 2: (4,7 candidates),2(orange),(4,7 candidates),(1,5 candidates),6,(1,5 candidates),_,8,3,9
  // That's still wrong. Let me count cells in row 2 from left to right:
  // Cell 1: has candidates 4,7
  // Cell 2: 2 (orange)
  // Cell 3: has candidates 4,7
  // Cell 4: has candidates 1,5
  // Cell 5: 6 (blue)
  // Cell 6: has candidates 1,5
  // Cell 7: empty? no, looking again...
  // Let me just manually transcribe more carefully

  [3, 8, 1, 9, 4, 2, 5, 6, 7],          // Row 1 ✓
  [0, 2, 0, 0, 6, 0, 0, 8, 3, 9],       // Row 2 - wait this is 10 numbers
  [9, 6, 5, 3, 7, 8, 4, 1, 2],          // Row 3 ✓
  [0, 5, 8, 0, 9, 3, 7, 2, 6],          // Row 4
  [6, 0, 0, 2, 8, 0, 9, 5, 3],          // Row 5
  [2, 3, 9, 6, 5, 7, 1, 8, 4],          // Row 6 ✓
  [8, 9, 3, 7, 1, 6, 2, 4, 5],          // Row 7 ✓
  [0, 0, 2, 8, 3, 0, 6, 9, 1],          // Row 8
  [0, 0, 0, 6, 0, 2, 9, 3, 7, 8]        // Row 9 - this is 10 numbers!
];

console.log("Let me re-read the image more carefully by going cell by cell:");
console.log("Row 1: 3 8 1 | 9 4 2 | 5 6 7");
console.log("Row 2: _ 2 _ | _ 6 _ | _ 8 3");  // Hmm, that's only 6 cells... let me look again
console.log("Actually reading more carefully from the screenshot:");

// OK I see the issue - some cells have candidate numbers shown (small numbers)
// Let me just identify the EMPTY cells:

const correctGrid = [
  [3, 8, 1, 9, 4, 2, 5, 6, 7],     // Row 1: complete
  [0, 2, 0, 0, 6, 0, 0, 8, 3],     // Row 2: missing positions 0,2,3,5,6 ... wait that's only 8 cells
  // I think I'm miscounting. Let me look at row 2 character by character:
  // "4 7" | "2(orange)" | "4 7" | "1 5" | "6" | "1 5" | "?" | "8" | "3" | "9"
  // Ah! The last cell is 9, so: _, 2, _, _, 6, _, _, 8, 3 gives us only 9 cells if the last is 9
  // Let me re-examine...
];

// Actually, let me just transcribe what I can clearly see:
console.log("\n=== Transcribing from screenshot ===\n");
console.log("Row 1: 3 8 1 9 4 2 5 6 7 (complete)");
console.log("Row 2: ? 2 ? ? 6 ? ? 8 3 (and maybe 9?)");
console.log("Row 3: 9 6 5 3 7 8 4 1 2 (complete)");
console.log("Row 4: ? 5 8 ? 9 3 7 2 6");
console.log("Row 5: 6 ? ? 2 8 ? 9 5 3");
console.log("Row 6: 2 3 9 6 5 7 1 8 4 (complete)");
console.log("Row 7: 8 9 3 7 1 6 2 4 5 (complete)");
console.log("Row 8: ? ? 2 8 3 ? 6 9 1");
console.log("Row 9: ? ? ? 6 ? 2 9 3 7 8"); // This looks like 10 cells!

console.log("\nLet me look at the image one more time, column by column...");

// Looking at column positions more carefully at row 9:
// I see: blank, blank, blank | 6, blank, 2 | 9, 3, 7 - but where's the 8?
// OH! The rightmost cell might be showing 8 outside or it's just 7
// Let me assume it's standard 9x9

const finalGrid = [
  [3, 8, 1, 9, 4, 2, 5, 6, 7],
  [0, 2, 0, 0, 6, 0, 0, 8, 0],  // Row 2 - assuming R2C9 is empty
  [9, 6, 5, 3, 7, 8, 4, 1, 2],
  [0, 5, 8, 0, 9, 3, 7, 2, 6],
  [6, 0, 0, 2, 8, 0, 9, 5, 3],
  [2, 3, 9, 6, 5, 7, 1, 8, 4],
  [8, 9, 3, 7, 1, 6, 2, 4, 5],
  [0, 0, 2, 8, 3, 0, 6, 9, 1],
  [0, 0, 0, 6, 0, 2, 0, 0, 8],  // Row 9
];

console.log("\nFinal grid interpretation:");
printGrid(finalGrid);

console.log("\n=== Finding candidates for empty cells ===\n");

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

// Find all empty cells and their candidates
const emptyCells = [];
for (let row = 0; row < 9; row++) {
  for (let col = 0; col < 9; col++) {
    if (finalGrid[row][col] === 0) {
      const candidates = getPossibleValues(finalGrid, row, col);
      emptyCells.push({ row: row + 1, col: col + 1, candidates });
      console.log(`R${row + 1}C${col + 1}: [${candidates.join(', ')}]`);
    }
  }
}

console.log(`\n=== Analysis ===`);
console.log(`Empty cells: ${emptyCells.length}`);

// Look for naked singles
const nakedSingles = emptyCells.filter(cell => cell.candidates.length === 1);
if (nakedSingles.length > 0) {
  console.log(`\n✅ NAKED SINGLES found (cells with only one candidate):`);
  nakedSingles.forEach(cell => {
    console.log(`  R${cell.row}C${cell.col} must be ${cell.candidates[0]}`);
  });
} else {
  console.log(`\n❌ No naked singles found.`);
  console.log(`This puzzle requires more advanced techniques.`);
}

// Check for hidden singles
console.log(`\n=== Checking for Hidden Singles ===`);

function findHiddenSingles(grid) {
  const found = [];

  // Check rows
  for (let row = 0; row < 9; row++) {
    for (let num = 1; num <= 9; num++) {
      // Skip if number already in row
      if (grid[row].includes(num)) continue;

      const positions = [];
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0 && isValidPlacement(grid, row, col, num)) {
          positions.push(col);
        }
      }

      if (positions.length === 1) {
        found.push({
          row: row + 1,
          col: positions[0] + 1,
          num,
          reason: `Only place for ${num} in row ${row + 1}`
        });
      }
    }
  }

  // Check columns
  for (let col = 0; col < 9; col++) {
    for (let num = 1; num <= 9; num++) {
      // Skip if number already in column
      let inCol = false;
      for (let row = 0; row < 9; row++) {
        if (grid[row][col] === num) {
          inCol = true;
          break;
        }
      }
      if (inCol) continue;

      const positions = [];
      for (let row = 0; row < 9; row++) {
        if (grid[row][col] === 0 && isValidPlacement(grid, row, col, num)) {
          positions.push(row);
        }
      }

      if (positions.length === 1) {
        found.push({
          row: positions[0] + 1,
          col: col + 1,
          num,
          reason: `Only place for ${num} in column ${col + 1}`
        });
      }
    }
  }

  // Check boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      for (let num = 1; num <= 9; num++) {
        // Skip if number already in box
        let inBox = false;
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (grid[boxRow * 3 + r][boxCol * 3 + c] === num) {
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
            if (grid[row][col] === 0 && isValidPlacement(grid, row, col, num)) {
              positions.push([row, col]);
            }
          }
        }

        if (positions.length === 1) {
          found.push({
            row: positions[0][0] + 1,
            col: positions[0][1] + 1,
            num,
            reason: `Only place for ${num} in box ${boxRow * 3 + boxCol + 1}`
          });
        }
      }
    }
  }

  return found;
}

const hiddenSingles = findHiddenSingles(finalGrid);

if (hiddenSingles.length > 0) {
  console.log(`✅ HIDDEN SINGLES found:`);
  // Remove duplicates (same cell might be found via multiple methods)
  const unique = [];
  const seen = new Set();
  for (const hs of hiddenSingles) {
    const key = `${hs.row},${hs.col}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(hs);
    }
  }

  unique.forEach(hs => {
    console.log(`  R${hs.row}C${hs.col} must be ${hs.num} - ${hs.reason}`);
  });
} else {
  console.log(`❌ No hidden singles found either.`);
  console.log(`\nThis puzzle requires advanced techniques like:`);
  console.log(`  - Naked Pairs/Triples`);
  console.log(`  - Hidden Pairs/Triples`);
  console.log(`  - Pointing Pairs`);
  console.log(`  - Box/Line Reduction`);
  console.log(`  - X-Wing, Y-Wing, etc.`);
}
