// WORKING RESET - Uses only the endpoints that work!

(async function() {
    console.log('🔥 WORKING RESET - Using only successful endpoints...');

    // Step 1: Clear browser storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Browser storage cleared');

    // Step 2: Reset app objects
    if (window.achievementsManager) {
        window.achievementsManager.unlockedAchievements = [];
        window.achievementsManager.needsInitialCleanup = true;
        console.log('✅ Achievements manager reset');
    }

    if (window.sudokuEngine) {
        window.sudokuEngine.bestTime = { easy: null, medium: null, hard: null };
        window.sudokuEngine.streakCount = 0;
        window.sudokuEngine.timer = 0;
        window.sudokuEngine.gameStarted = false;
        window.sudokuEngine.gameCompleted = false;
        console.log('✅ Sudoku engine reset');
    }

    if (window.sudokuApp) {
        window.sudokuApp.dailyPuzzles = null;
        window.sudokuApp.entries = [];
        console.log('✅ Sudoku app reset');
    }

    // Step 3: Clear database using working endpoints
    console.log('🗄️ Clearing database...');

    // Clear achievements (this worked!)
    try {
        const achResponse = await fetch('/api/achievements', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (achResponse.ok) {
            console.log('✅ Database achievements cleared');
        } else {
            console.log('⚠️ Could not clear achievements');
        }
    } catch (e) {
        console.log('⚠️ Error clearing achievements:', e.message);
    }

    // Clear today's entries (this worked!)
    try {
        const today = new Date().toISOString().split('T')[0];
        const entryResponse = await fetch(\`/api/entries?date=\${today}\`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (entryResponse.ok) {
            console.log('✅ Today\\'s database entries cleared');
        } else {
            console.log('⚠️ Could not clear today\\'s entries');
        }
    } catch (e) {
        console.log('⚠️ Error clearing entries:', e.message);
    }

    console.log('🎉 WORKING RESET COMPLETE!');
    console.log('📊 All achievements and today\\'s progress cleared');
    console.log('🔄 Refreshing page...');

    setTimeout(() => {
        window.location.reload(true);
    }, 2000);

})();