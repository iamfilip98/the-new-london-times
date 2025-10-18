// Script to reset database and generate fresh puzzles with unique solutions

const today = new Date().toISOString().split('T')[0];

console.log('═══════════════════════════════════════════════');
console.log('RESETTING DATABASE AND GENERATING NEW PUZZLES');
console.log('═══════════════════════════════════════════════');
console.log(`Date: ${today}`);
console.log();

async function resetAndRefresh() {
  try {
    // Step 1: Reset database for today
    console.log('Step 1: Resetting database for today...');
    const resetResponse = await fetch('http://localhost:3000/api/puzzles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reset',
        date: today
      })
    });

    if (!resetResponse.ok) {
      const error = await resetResponse.text();
      console.error('Reset failed:', error);
      throw new Error('Reset failed');
    }

    const resetResult = await resetResponse.json();
    console.log('✓ Database reset:', resetResult.message);
    console.log();

    // Step 2: Generate new puzzles
    console.log('Step 2: Generating new puzzles with unique solutions...');
    console.log('This may take a while as we ensure all puzzles are solvable...');
    console.log();

    const generateResponse = await fetch('http://localhost:3000/api/puzzles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        date: today,
        forceSeed: Date.now() // Use current time as seed for fresh puzzles
      })
    });

    if (!generateResponse.ok) {
      const error = await generateResponse.text();
      console.error('Generation failed:', error);
      throw new Error('Generation failed');
    }

    const puzzles = await generateResponse.json();
    console.log('✓ New puzzles generated successfully!');
    console.log();

    // Step 3: Verify the puzzles
    console.log('Step 3: Verifying puzzle structure...');
    console.log('Easy puzzle clues:', countClues(puzzles.easy.puzzle));
    console.log('Medium puzzle clues:', countClues(puzzles.medium.puzzle));
    console.log('Hard puzzle clues:', countClues(puzzles.hard.puzzle));
    console.log();

    console.log('═══════════════════════════════════════════════');
    console.log('SUCCESS! Database reset and new puzzles loaded');
    console.log('═══════════════════════════════════════════════');
    console.log();
    console.log('Next steps:');
    console.log('1. Refresh your browser');
    console.log('2. Test the puzzles');
    console.log('3. Try the hint system - it should work now!');
    console.log();

  } catch (error) {
    console.error('═══════════════════════════════════════════════');
    console.error('ERROR:', error.message);
    console.error('═══════════════════════════════════════════════');
    process.exit(1);
  }
}

function countClues(puzzle) {
  let count = 0;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (puzzle[row][col] !== 0) count++;
    }
  }
  return count;
}

// Run the reset
resetAndRefresh();
