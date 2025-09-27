// Run this in your browser console to reset localStorage data
console.log('🔄 Resetting localStorage data...');

// Reset best times
localStorage.removeItem('sudoku_best_times');
console.log('✅ Cleared best times');

// Reset streak count
localStorage.removeItem('sudoku_streak');
console.log('✅ Cleared streak count');

// Reset settings (optional - uncomment if you want to reset settings too)
// localStorage.removeItem('sudoku_settings');
// console.log('✅ Cleared settings');

// Clear all game state and completed games
let cleared = 0;
const keysToRemove = [];

for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
        key.startsWith('sudoku_') ||
        key.startsWith('completed_') ||
        key.includes('partial_entry_') ||
        key.includes('game_state_') ||
        key.includes('notifications_')
    )) {
        keysToRemove.push(key);
    }
}

keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    cleared++;
});

console.log(`✅ Cleared ${cleared} additional localStorage entries`);
console.log('🎉 localStorage reset completed!');
console.log('🔄 Please refresh the page to see changes');