// Re-analyzing with R9C9 already = 8

const grid = [
  [3, 8, 1, 9, 4, 2, 5, 6, 7],
  [0, 2, 0, 0, 6, 0, 0, 8, 3],
  [9, 6, 5, 3, 7, 8, 4, 1, 2],
  [0, 5, 8, 0, 9, 3, 7, 2, 6],
  [6, 0, 0, 2, 8, 0, 9, 5, 3],
  [2, 3, 9, 6, 5, 7, 1, 8, 4],
  [8, 9, 3, 7, 1, 6, 2, 4, 5],
  [0, 0, 2, 8, 3, 0, 6, 9, 1],
  [0, 0, 0, 6, 0, 2, 9, 3, 8],  // R9C9 = 8 (already filled!)
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

console.log("=== Current Grid ===\n");
printGrid(grid);

console.log("\n=== Row 9 Analysis ===");
console.log("Row 9: " + grid[8].map(x => x === 0 ? '_' : x).join(' '));

const row9 = grid[8];
const present = row9.filter(x => x !== 0);
const missing = [];
for (let num = 1; num <= 9; num++) {
  if (!present.includes(num)) {
    missing.push(num);
  }
}
console.log("Missing from row 9: " + missing.join(', '));
console.log("Empty positions: " + row9.filter(x => x === 0).length + " cells\n");

console.log("Where can each missing number go in Row 9?");
for (let num of missing) {
  const positions = [];
  for (let col = 0; col < 9; col++) {
    if (grid[8][col] === 0 && isValidPlacement(grid, 8, col, num)) {
      positions.push(col + 1);
    }
  }
  console.log(`  ${num}: columns ${positions.join(', ')}${positions.length === 1 ? ' ⭐ HIDDEN SINGLE!' : ''}`);
}

console.log("\n=== Checking Column 4 ===");
console.log("Column 4 has:");
for (let row = 0; row < 9; row++) {
  if (grid[row][3] !== 0) {
    console.log(`  Row ${row + 1}: ${grid[row][3]}`);
  } else {
    console.log(`  Row ${row + 1}: _ (empty)`);
  }
}

const col4Present = [];
for (let row = 0; row < 9; row++) {
  if (grid[row][3] !== 0) col4Present.push(grid[row][3]);
}
const col4Missing = [];
for (let num = 1; num <= 9; num++) {
  if (!col4Present.includes(num)) col4Missing.push(num);
}
console.log(`\nMissing from column 4: ${col4Missing.join(', ')}`);

console.log("\nWhere can each missing number go in Column 4?");
for (let num of col4Missing) {
  const positions = [];
  for (let row = 0; row < 9; row++) {
    if (grid[row][3] === 0 && isValidPlacement(grid, row, 3, num)) {
      positions.push(row + 1);
    }
  }
  console.log(`  ${num}: rows ${positions.join(', ')}${positions.length === 1 ? ' ⭐ HIDDEN SINGLE!' : ''}`);
}

console.log("\n=== Checking R9C1 candidates ===");
const r9c1Candidates = [];
for (let num = 1; num <= 9; num++) {
  if (isValidPlacement(grid, 8, 0, num)) {
    r9c1Candidates.push(num);
  }
}
console.log(`R9C1 candidates: ${r9c1Candidates.join(', ')}`);

console.log("\n=== Checking R9C4 candidates ===");
const r9c4Candidates = [];
for (let num = 1; num <= 9; num++) {
  if (isValidPlacement(grid, 8, 3, num)) {
    r9c4Candidates.push(num);
  }
}
console.log(`R9C4 candidates: ${r9c4Candidates.join(', ')}`);

console.log("\n=== ALL EMPTY CELLS WITH CANDIDATES ===\n");
for (let row = 0; row < 9; row++) {
  for (let col = 0; col < 9; col++) {
    if (grid[row][col] === 0) {
      const candidates = [];
      for (let num = 1; num <= 9; num++) {
        if (isValidPlacement(grid, row, col, num)) {
          candidates.push(num);
        }
      }
      console.log(`R${row + 1}C${col + 1}: [${candidates.join(', ')}]${candidates.length === 1 ? ' ⭐ NAKED SINGLE!' : ''}`);
    }
  }
}

console.log("\n=== FINDING ALL HIDDEN SINGLES ===\n");

let foundAny = false;

// Check rows
console.log("In Rows:");
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
      console.log(`  ✅ R${row + 1}C${positions[0]} = ${num} (only place for ${num} in row ${row + 1})`);
      foundAny = true;
    }
  }
}

// Check columns
console.log("\nIn Columns:");
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
        positions.push(row + 1);
      }
    }

    if (positions.length === 1) {
      console.log(`  ✅ R${positions[0]}C${col + 1} = ${num} (only place for ${num} in column ${col + 1})`);
      foundAny = true;
    }
  }
}

// Check boxes
console.log("\nIn Boxes:");
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
            positions.push([row + 1, col + 1]);
          }
        }
      }

      if (positions.length === 1) {
        console.log(`  ✅ R${positions[0][0]}C${positions[0][1]} = ${num} (only place for ${num} in box ${boxNum})`);
        foundAny = true;
      }
    }
  }
}

if (!foundAny) {
  console.log("\n❌ NO HIDDEN SINGLES FOUND!");
  console.log("\nThe puzzle requires more advanced techniques like:");
  console.log("  - Naked Pairs/Triples");
  console.log("  - Hidden Pairs/Triples");
  console.log("  - Pointing Pairs");
  console.log("  - Box/Line Reduction");
}
