// Script to clear localStorage entries for today's puzzles
// This should be run in the browser console after resetting puzzles

const today = new Date().toISOString().split('T')[0];
console.log(`Clearing localStorage entries for ${today}...`);

let cleared = 0;
const keysToRemove = [];

// Find all localStorage keys related to today's puzzles
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
        key.includes(today) ||
        key.startsWith('sudoku_') ||
        key.startsWith('completed_') ||
        key.includes('partial_entry_')
    )) {
        keysToRemove.push(key);
    }
}

// Remove the keys
keysToRemove.forEach(key => {
    console.log(`Removing: ${key}`);
    localStorage.removeItem(key);
    cleared++;
});

console.log(`✅ Cleared ${cleared} localStorage entries for today's puzzles`);
console.log('🔄 Please refresh the page to load fresh puzzles');