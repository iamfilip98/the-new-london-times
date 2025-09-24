// Force Daily Refresh Script
// This script clears all cached data and forces a complete refresh for today

console.log('🔄 Starting force daily refresh...');

const today = new Date().toISOString().split('T')[0];
console.log(`📅 Today's date: ${today}`);

// 1. Clear the last checked date to force date change detection
localStorage.removeItem('lastCheckedDate');
console.log('✅ Cleared lastCheckedDate');

// 2. Clear all localStorage items related to today's date
const keys = Object.keys(localStorage);
let clearedCount = 0;

keys.forEach(key => {
    if (key.includes(today) ||
        key.startsWith('completed_') ||
        key.includes('progress') ||
        key.includes('puzzle') ||
        key.includes('game_state')) {
        localStorage.removeItem(key);
        clearedCount++;
        console.log(`🗑️ Removed: ${key}`);
    }
});

console.log(`✅ Cleared ${clearedCount} localStorage items`);

// 3. Clear any puzzle cache in the global app instance
if (window.sudokuApp) {
    window.sudokuApp.puzzleCache.puzzles = null;
    window.sudokuApp.puzzleCache.loadTime = null;
    window.sudokuApp.cache.data = null;
    window.sudokuApp.cache.lastUpdate = null;
    console.log('✅ Cleared puzzle and data caches');

    // Force date change detection
    window.sudokuApp.lastCheckedDate = null;
    console.log('✅ Reset date change detection');
}

// 4. Clear any session storage
sessionStorage.clear();
console.log('✅ Cleared session storage');

console.log('🎯 Force refresh complete! Please refresh the page to see fresh data.');
console.log(`💡 Run: location.reload(true) to hard refresh the page`);