// Check why R9C1 (bottom-left) would be 5

const grid = [
  [3, 8, 1, 9, 4, 2, 5, 6, 7],
  [0, 2, 0, 0, 6, 0, 0, 8, 3],
  [9, 6, 5, 3, 7, 8, 4, 1, 2],
  [0, 5, 8, 0, 9, 3, 7, 2, 6],
  [6, 0, 0, 2, 8, 0, 9, 5, 3],
  [2, 3, 9, 6, 5, 7, 1, 8, 4],
  [8, 9, 3, 7, 1, 6, 2, 4, 5],
  [0, 0, 2, 8, 3, 0, 6, 9, 1],
  [0, 0, 0, 6, 0, 2, 9, 3, 0],
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

console.log("=== Checking R9C1 (bottom-left corner) ===\n");
console.log("Row 9: " + grid[8].map(x => x === 0 ? '_' : x).join(' '));
console.log("         (positions 1, 2, 3, 5, 9 are empty)\n");

console.log("What numbers are missing from Row 9?");
const row9 = grid[8];
const present = row9.filter(x => x !== 0);
const missing = [];
for (let num = 1; num <= 9; num++) {
  if (!present.includes(num)) {
    missing.push(num);
  }
}
console.log("Missing from row 9: " + missing.join(', '));
console.log("Empty positions: 5 cells need these 5 numbers\n");

console.log("Now let's check which of these missing numbers can go in R9C1:");
console.log("\nColumn 1 currently has:");
for (let row = 0; row < 9; row++) {
  if (grid[row][0] !== 0) {
    console.log(`  Row ${row + 1}: ${grid[row][0]}`);
  }
}

console.log("\nBox 7 (bottom-left 3x3) currently has:");
for (let r = 6; r < 9; r++) {
  for (let c = 0; c < 3; c++) {
    if (grid[r][c] !== 0) {
      console.log(`  R${r+1}C${c+1}: ${grid[r][c]}`);
    }
  }
}

console.log("\n=== Testing each missing number in R9C1 ===\n");

for (let num of missing) {
  const valid = isValidPlacement(grid, 8, 0, num);

  // Detailed check
  let reason = "";

  // Check row
  if (row9.includes(num)) {
    reason = "already in row 9";
  }

  // Check column 1
  let inCol = false;
  for (let r = 0; r < 9; r++) {
    if (grid[r][0] === num) {
      inCol = true;
      break;
    }
  }
  if (inCol) {
    reason = "already in column 1";
  }

  // Check box 7
  let inBox = false;
  for (let r = 6; r < 9; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[r][c] === num) {
        inBox = true;
        break;
      }
    }
  }
  if (inBox) {
    reason = "already in box 7";
  }

  if (valid) {
    console.log(`✅ ${num} is VALID`);
  } else {
    console.log(`❌ ${num} is invalid (${reason})`);
  }
}

console.log("\n=== Checking if 5 is the ONLY option (hidden single) ===\n");

// Check where each missing number can go in row 9
for (let num of missing) {
  console.log(`\nNumber ${num} in row 9 can go in positions:`);
  const positions = [];
  for (let col = 0; col < 9; col++) {
    if (grid[8][col] === 0 && isValidPlacement(grid, 8, col, num)) {
      positions.push(col + 1);
    }
  }
  console.log(`  Columns: ${positions.join(', ')}`);

  if (positions.length === 1) {
    console.log(`  ⭐ This is a HIDDEN SINGLE! R9C${positions[0]} = ${num}`);
  }
}
