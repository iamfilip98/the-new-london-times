// Force Daily Refresh Script
// This script clears all cached data and forces a complete refresh for today


const today = new Date().toISOString().split('T')[0];

// 1. Clear the last checked date to force date change detection
localStorage.removeItem('lastCheckedDate');

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
    }
});


// 3. Clear any puzzle cache in the global app instance
if (window.sudokuApp) {
    window.sudokuApp.puzzleCache.puzzles = null;
    window.sudokuApp.puzzleCache.loadTime = null;
    window.sudokuApp.cache.data = null;
    window.sudokuApp.cache.lastUpdate = null;

    // Force date change detection
    window.sudokuApp.lastCheckedDate = null;
}

// 4. Clear any session storage
sessionStorage.clear();

