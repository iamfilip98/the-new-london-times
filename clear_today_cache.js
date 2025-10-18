// Run this in your browser console to clear today's cached data
console.log('🧹 Clearing all cached data for today...');

const today = '2025-10-18';

// Clear completed game times for both players
['filip', 'faidao'].forEach(player => {
  ['easy', 'medium', 'hard'].forEach(difficulty => {
    const key = `completed_${player}_${today}_${difficulty}`;
    const oldValue = localStorage.getItem(key);
    if (oldValue) {
      localStorage.removeItem(key);
      console.log(`✓ Cleared: ${key}`);
    }
  });

  // Clear game states
  ['easy', 'medium', 'hard'].forEach(difficulty => {
    const key = `sudoku_${player}_${today}_${difficulty}`;
    const oldValue = localStorage.getItem(key);
    if (oldValue) {
      localStorage.removeItem(key);
      console.log(`✓ Cleared: ${key}`);
    }
  });
});

// Clear partial entries
['filip', 'faidao'].forEach(player => {
  const key = `partial_entry_${today}_${player}`;
  const oldValue = localStorage.getItem(key);
  if (oldValue) {
    localStorage.removeItem(key);
    console.log(`✓ Cleared: ${key}`);
  }
});

// Clear opponent progress notifications
['filip', 'faidao'].forEach(player => {
  const key = `opponent_progress_${player}_${today}`;
  const oldValue = localStorage.getItem(key);
  if (oldValue) {
    localStorage.removeItem(key);
    console.log(`✓ Cleared: ${key}`);
  }
});

console.log('✅ Cache cleared! Refreshing page...');
setTimeout(() => {
  location.reload();
}, 1000);
