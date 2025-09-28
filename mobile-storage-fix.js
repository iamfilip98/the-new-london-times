// Mobile Storage Fix Script
// Run this in your mobile browser's console to clear old puzzle data

console.log('🔧 MOBILE STORAGE FIX - Clearing old puzzle data...');
console.log('=' .repeat(50));

const today = new Date().toISOString().split('T')[0];
console.log(`📅 Today's date: ${today}`);

// Step 1: Clear all localStorage completely (nuclear option)
console.log('🧹 Step 1: Clearing ALL localStorage...');
const beforeCount = localStorage.length;
localStorage.clear();
console.log(`✅ Cleared ${beforeCount} localStorage entries`);

// Step 2: Clear sessionStorage except current player
console.log('🧹 Step 2: Preserving player session...');
const currentPlayer = sessionStorage.getItem('currentPlayer');
sessionStorage.clear();
if (currentPlayer) {
    sessionStorage.setItem('currentPlayer', currentPlayer);
    console.log(`✅ Preserved player: ${currentPlayer}`);
} else {
    console.log('⚠️ No player session found');
}

// Step 3: Clear any cached puzzle data from memory
console.log('🧹 Step 3: Clearing memory cache...');
if (window.sudokuEngine) {
    window.sudokuEngine.dailyPuzzles = null;
    window.sudokuEngine.gameStarted = false;
    window.sudokuEngine.currentDifficulty = null;
    console.log('✅ Sudoku engine cache cleared');
}

if (window.sudokuApp) {
    window.sudokuApp.puzzleCache.puzzles = null;
    window.sudokuApp.puzzleCache.loadTime = null;
    window.sudokuApp.cache.data = null;
    window.sudokuApp.cache.lastUpdate = null;
    console.log('✅ App cache cleared');
}

if (window.preloadedPuzzles) {
    window.preloadedPuzzles = null;
    console.log('✅ Preloaded puzzles cleared');
}

// Step 4: Force refresh the page
console.log('🔄 Step 4: Forcing page refresh...');
console.log('=' .repeat(50));
console.log('✅ MOBILE STORAGE FIX COMPLETE!');
console.log('📱 Your browser will now refresh to load fresh puzzles');
console.log('🎯 After refresh, navigate to the puzzle page and select a difficulty');

// Small delay then refresh
setTimeout(() => {
    window.location.reload(true);
}, 2000);