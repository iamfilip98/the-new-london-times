// ULTIMATE COMPLETE RESET - Targets ALL data sources for Today's Progress

(async function() {
    console.log('🚨 ULTIMATE COMPLETE RESET - TARGETING ALL DATA SOURCES!');

    // Step 1: Clear browser storage completely
    console.log('🧹 Step 1: Clearing browser storage...');
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Browser storage cleared');

    // Step 2: Reset all app objects
    console.log('🎮 Step 2: Resetting app objects...');
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
        // Clear the today progress cache
        window.sudokuApp.todayProgressCache = {
            data: null,
            lastUpdate: null,
            date: null,
            duration: 30000
        };
        console.log('✅ Sudoku app reset');
    }

    // Step 3: Clear individual_games table (THIS IS THE KEY!)
    console.log('🗄️ Step 3: Clearing individual_games table...');
    try {
        const response = await fetch('/api/games?all=true', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Individual games table cleared:', result.message);
        } else {
            console.log('❌ Could not clear individual games table:', response.status);
        }
    } catch (e) {
        console.log('❌ Error clearing individual games:', e.message);
    }

    // Step 4: Clear achievements
    console.log('🏆 Step 4: Clearing achievements...');
    try {
        const achResponse = await fetch('/api/achievements', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (achResponse.ok) {
            console.log('✅ Achievements cleared');
        } else {
            console.log('❌ Could not clear achievements');
        }
    } catch (e) {
        console.log('❌ Error clearing achievements:', e.message);
    }

    // Step 5: Clear entries
    console.log('📊 Step 5: Clearing entries...');
    try {
        const today = new Date().toISOString().split('T')[0];
        const entryResponse = await fetch(\`/api/entries?date=\${today}\`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (entryResponse.ok) {
            console.log('✅ Entries cleared');
        } else {
            console.log('❌ Could not clear entries');
        }
    } catch (e) {
        console.log('❌ Error clearing entries:', e.message);
    }

    // Step 6: Clear any cached data and force app refresh
    console.log('🔄 Step 6: Forcing complete refresh...');
    if (window.caches) {
        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log('✅ Browser caches cleared');
        } catch (e) {
            console.log('⚠️ Could not clear caches');
        }
    }

    console.log('🎉 ULTIMATE RESET COMPLETE!');
    console.log('💥 ALL DATA SOURCES HAVE BEEN CLEARED!');
    console.log('📊 Today\\'s Progress should now be empty');
    console.log('🔄 Reloading page...');

    setTimeout(() => {
        window.location.reload(true);
    }, 2000);

})();