// Transcribing from the clean labeled screenshot

const grid = [
  // Row A (1): 3 8 1 9 4 2 5 6 7
  [3, 8, 1, 9, 4, 2, 5, 6, 7],

  // Row B (2): _ 2 _ _ 6 _ 8 3 9
  [0, 2, 0, 0, 6, 0, 8, 3, 9],

  // Row C (3): 9 6 5 3 7 8 4 1 2
  [9, 6, 5, 3, 7, 8, 4, 1, 2],

  // Row D (4): _ 5 8 _ 9 3 7 2 6
  [0, 5, 8, 0, 9, 3, 7, 2, 6],

  // Row E (5): 6 _ _ 2 8 _ 9 5 3
  [6, 0, 0, 2, 8, 0, 9, 5, 3],

  // Row F (6): 2 3 9 6 5 7 1 8 4
  [2, 3, 9, 6, 5, 7, 1, 8, 4],

  // Row G (7): 8 9 3 7 1 6 2 4 5
  [8, 9, 3, 7, 1, 6, 2, 4, 5],

  // Row H (8): _ _ 2 8 3 _ 6 9 1
  [0, 0, 2, 8, 3, 0, 6, 9, 1],

  // Row I (9): _ _ 6 _ 2 9 3 7 8
  [0, 0, 6, 0, 2, 9, 3, 7, 8],
];

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
  console.log("  1 2 3   4 5 6   7 8 9");
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  for (let row = 0; row < 9; row++) {
    if (row % 3 === 0 && row !== 0) {
      console.log('  ------+-------+------');
    }
    let rowStr = labels[row] + ' ';
    for (let col = 0; col < 9; col++) {
      if (col % 3 === 0 && col !== 0) {
        rowStr += '| ';
      }
      rowStr += (grid[row][col] === 0 ? '.' : grid[row][col]) + ' ';
    }
    console.log(rowStr);
  }
}

console.log("=== CURRENT STATE ===\n");
printGrid(grid);

console.log("\n=== ALL EMPTY CELLS WITH CANDIDATES ===\n");

const emptyCells = [];
for (let row = 0; row < 9; row++) {
  for (let col = 0; col < 9; col++) {
    if (grid[row][col] === 0) {
      const candidates = [];
      for (let num = 1; num <= 9; num++) {
        if (isValidPlacement(grid, row, col, num)) {
          candidates.push(num);
        }
      }
      const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
      emptyCells.push({ label: `${labels[row]}${col + 1}`, row, col, candidates });
      console.log(`${labels[row]}${col + 1}: [${candidates.join(', ')}]${candidates.length === 1 ? ' ⭐ NAKED SINGLE!' : ''}`);
    }
  }
}

// Find naked singles
console.log("\n=== NAKED SINGLES ===");
const nakedSingles = emptyCells.filter(c => c.candidates.length === 1);
if (nakedSingles.length > 0) {
  nakedSingles.forEach(cell => {
    console.log(`✅ ${cell.label} = ${cell.candidates[0]}`);
  });
} else {
  console.log("None found");
}

// Find hidden singles in rows
console.log("\n=== HIDDEN SINGLES IN ROWS ===");
const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
let foundHidden = false;
for (let row = 0; row < 9; row++) {
  for (let num = 1; num <= 9; num++) {
    if (grid[row].includes(num)) continue;

    const positions = [];
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0 && isValidPlacement(grid, row, col, num)) {
        positions.push(col + 1);
      }
    }

    if (positions.length === 1) {
      console.log(`✅ ${labels[row]}${positions[0]} = ${num} (only place in row ${labels[row]})`);
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
      if (grid[row][col] === num) {
        inCol = true;
        break;
      }
    }
    if (inCol) continue;

    const positions = [];
    for (let row = 0; row < 9; row++) {
      if (grid[row][col] === 0 && isValidPlacement(grid, row, col, num)) {
        positions.push(labels[row]);
      }
    }

    if (positions.length === 1) {
      console.log(`✅ ${positions[0]}${col + 1} = ${num} (only place in column ${col + 1})`);
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
            positions.push(`${labels[row]}${col + 1}`);
          }
        }
      }

      if (positions.length === 1) {
        console.log(`✅ ${positions[0]} = ${num} (only place in box ${boxNum})`);
        foundHidden = true;
      }
    }
  }
}
if (!foundHidden) console.log("None found");

if (!foundHidden && nakedSingles.length === 0) {
  console.log("\n⚠️  NO BASIC MOVES FOUND!");
  console.log("\nLet me check for NAKED PAIRS...\n");

  // Check for naked pairs in rows
  console.log("=== NAKED PAIRS IN ROWS ===");
  let foundPairs = false;
  for (let row = 0; row < 9; row++) {
    const cellsInRow = emptyCells.filter(c => c.row === row && c.candidates.length === 2);

    for (let i = 0; i < cellsInRow.length - 1; i++) {
      for (let j = i + 1; j < cellsInRow.length; j++) {
        const cell1 = cellsInRow[i];
        const cell2 = cellsInRow[j];

        if (cell1.candidates.length === 2 && cell2.candidates.length === 2 &&
            cell1.candidates[0] === cell2.candidates[0] &&
            cell1.candidates[1] === cell2.candidates[1]) {

          console.log(`Found naked pair in row ${labels[row]}: ${cell1.label} and ${cell2.label} = [${cell1.candidates.join(', ')}]`);

          // Check if we can eliminate these candidates from other cells in the row
          const otherCells = emptyCells.filter(c =>
            c.row === row && c.label !== cell1.label && c.label !== cell2.label &&
            (c.candidates.includes(cell1.candidates[0]) || c.candidates.includes(cell1.candidates[1]))
          );

          if (otherCells.length > 0) {
            console.log(`  Can eliminate [${cell1.candidates.join(', ')}] from: ${otherCells.map(c => c.label).join(', ')}`);
            foundPairs = true;
          }
        }
      }
    }
  }
  if (!foundPairs) console.log("None found");

  // Check for naked pairs in columns
  console.log("\n=== NAKED PAIRS IN COLUMNS ===");
  foundPairs = false;
  for (let col = 0; col < 9; col++) {
    const cellsInCol = emptyCells.filter(c => c.col === col && c.candidates.length === 2);

    for (let i = 0; i < cellsInCol.length - 1; i++) {
      for (let j = i + 1; j < cellsInCol.length; j++) {
        const cell1 = cellsInCol[i];
        const cell2 = cellsInCol[j];

        if (cell1.candidates.length === 2 && cell2.candidates.length === 2 &&
            cell1.candidates[0] === cell2.candidates[0] &&
            cell1.candidates[1] === cell2.candidates[1]) {

          console.log(`Found naked pair in column ${col + 1}: ${cell1.label} and ${cell2.label} = [${cell1.candidates.join(', ')}]`);

          const otherCells = emptyCells.filter(c =>
            c.col === col && c.label !== cell1.label && c.label !== cell2.label &&
            (c.candidates.includes(cell1.candidates[0]) || c.candidates.includes(cell1.candidates[1]))
          );

          if (otherCells.length > 0) {
            console.log(`  Can eliminate [${cell1.candidates.join(', ')}] from: ${otherCells.map(c => c.label).join(', ')}`);
            foundPairs = true;
          }
        }
      }
    }
  }
  if (!foundPairs) console.log("None found");

  // Check for naked pairs in boxes
  console.log("\n=== NAKED PAIRS IN BOXES ===");
  foundPairs = false;
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const boxNum = boxRow * 3 + boxCol + 1;
      const cellsInBox = emptyCells.filter(c => {
        const cBoxRow = Math.floor(c.row / 3);
        const cBoxCol = Math.floor(c.col / 3);
        return cBoxRow === boxRow && cBoxCol === boxCol && c.candidates.length === 2;
      });

      for (let i = 0; i < cellsInBox.length - 1; i++) {
        for (let j = i + 1; j < cellsInBox.length; j++) {
          const cell1 = cellsInBox[i];
          const cell2 = cellsInBox[j];

          if (cell1.candidates.length === 2 && cell2.candidates.length === 2 &&
              cell1.candidates[0] === cell2.candidates[0] &&
              cell1.candidates[1] === cell2.candidates[1]) {

            console.log(`Found naked pair in box ${boxNum}: ${cell1.label} and ${cell2.label} = [${cell1.candidates.join(', ')}]`);

            const otherCells = emptyCells.filter(c => {
              const cBoxRow = Math.floor(c.row / 3);
              const cBoxCol = Math.floor(c.col / 3);
              return cBoxRow === boxRow && cBoxCol === boxCol &&
                     c.label !== cell1.label && c.label !== cell2.label &&
                     (c.candidates.includes(cell1.candidates[0]) || c.candidates.includes(cell1.candidates[1]));
            });

            if (otherCells.length > 0) {
              console.log(`  Can eliminate [${cell1.candidates.join(', ')}] from: ${otherCells.map(c => c.label).join(', ')}`);
              foundPairs = true;
            }
          }
        }
      }
    }
  }
  if (!foundPairs) console.log("None found");
}
