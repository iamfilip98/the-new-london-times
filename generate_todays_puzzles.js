// Manually generate today's puzzles with the fixed algorithm

require('dotenv').config({ path: '.env.local' });

// Import the puzzle generation module
const handler = require('./api/puzzles.js');

const today = new Date().toISOString().split('T')[0];

console.log('═══════════════════════════════════════════════');
console.log('MANUALLY GENERATING TODAY\'S PUZZLES');
console.log('═══════════════════════════════════════════════');
console.log(`Date: ${today}`);
console.log();
console.log('This will take 1-3 minutes as we validate unique solutions...');
console.log();

// Create a mock request/response to trigger generation
const mockReq = {
  method: 'GET',
  query: { date: today }
};

const mockRes = {
  setHeader: () => {},
  status: (code) => {
    return {
      json: (data) => {
        if (code === 200) {
          console.log('✓ SUCCESS! Puzzles generated');
          console.log();
          console.log('Puzzle details:');
          console.log(`  Easy puzzle: ${countClues(data.easy.puzzle)} clues`);
          console.log(`  Medium puzzle: ${countClues(data.medium.puzzle)} clues`);
          console.log(`  Hard puzzle: ${countClues(data.hard.puzzle)} clues`);
          console.log();
          console.log('═══════════════════════════════════════════════');
          console.log('All puzzles have unique solutions and are solvable!');
          console.log('═══════════════════════════════════════════════');
          console.log();
          console.log('Refresh your browser - the game should now load!');
          process.exit(0);
        } else {
          console.error('Error:', data);
          process.exit(1);
        }
      },
      end: () => {}
    };
  }
};

function countClues(puzzle) {
  let count = 0;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (puzzle[row][col] !== 0) count++;
    }
  }
  return count;
}

// Trigger the handler
handler(mockReq, mockRes);
