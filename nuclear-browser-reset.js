// NUCLEAR RESET - Run this in your browser console
console.log('💣 NUCLEAR RESET - Clearing ALL data...');

// 1. Clear ALL localStorage
console.log('🧹 Clearing localStorage...');
localStorage.clear();
console.log('✅ localStorage cleared');

// 2. Clear ALL sessionStorage
console.log('🧹 Clearing sessionStorage...');
sessionStorage.clear();
console.log('✅ sessionStorage cleared');

// 3. Reset app state if available
if (window.achievementsManager) {
    console.log('🎯 Resetting achievements manager...');
    window.achievementsManager.unlockedAchievements = [];
    window.achievementsManager.needsInitialCleanup = true;
}

if (window.sudokuEngine) {
    console.log('🎮 Resetting sudoku engine...');
    window.sudokuEngine.bestTime = { easy: null, medium: null, hard: null };
    window.sudokuEngine.streakCount = 0;
    window.sudokuEngine.timer = 0;
    window.sudokuEngine.hints = 0;
    window.sudokuEngine.errors = 0;
    window.sudokuEngine.gameStarted = false;
    window.sudokuEngine.gameCompleted = false;
}

if (window.sudokuApp) {
    console.log('📱 Resetting sudoku app...');
    // Reset any cached data
    window.sudokuApp.dailyPuzzles = null;
    window.sudokuApp.entries = [];
}

// 4. Clear any cached API data
console.log('🌐 Clearing any cached data...');

// 5. Force reload to ensure clean state
console.log('🎉 NUCLEAR RESET COMPLETE!');
console.log('🔄 Reloading page in 2 seconds...');

setTimeout(() => {
    window.location.reload(true); // Force reload
}, 2000);