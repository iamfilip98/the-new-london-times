// INSTANT RESET - Copy and paste this ENTIRE block into your browser console

(function() {
    console.log('💣 INSTANT NUCLEAR RESET STARTING...');

    // Clear ALL storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ All browser storage cleared');

    // Reset all app objects
    if (window.achievementsManager) {
        window.achievementsManager.unlockedAchievements = [];
        window.achievementsManager.needsInitialCleanup = true;
        console.log('✅ Achievements reset');
    }

    if (window.sudokuEngine) {
        window.sudokuEngine.bestTime = { easy: null, medium: null, hard: null };
        window.sudokuEngine.streakCount = 0;
        window.sudokuEngine.timer = 0;
        window.sudokuEngine.hints = 0;
        window.sudokuEngine.errors = 0;
        window.sudokuEngine.gameStarted = false;
        window.sudokuEngine.gameCompleted = false;
        console.log('✅ Sudoku engine reset');
    }

    if (window.sudokuApp) {
        window.sudokuApp.dailyPuzzles = null;
        window.sudokuApp.entries = [];
        console.log('✅ Sudoku app reset');
    }

    // Try to clear database via API calls
    const clearDatabase = async () => {
        try {
            // Clear achievements
            await fetch('/api/achievements', { method: 'DELETE' }).catch(() => {});
            // Clear entries
            await fetch('/api/entries', { method: 'DELETE' }).catch(() => {});
            // Clear stats
            await fetch('/api/stats', { method: 'DELETE' }).catch(() => {});
            console.log('✅ Database cleared via API');
        } catch (e) {
            console.log('⚠️ Could not clear database - manual reset may be needed');
        }
    };

    clearDatabase();

    console.log('🎉 COMPLETE RESET FINISHED!');
    console.log('🔄 Reloading page in 2 seconds...');

    setTimeout(() => {
        window.location.reload(true);
    }, 2000);
})();