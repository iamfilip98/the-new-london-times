// ULTIMATE RESET - Copy this into your browser console to completely clear everything

(async function() {
    console.log('💣 ULTIMATE RESET STARTING...');
    console.log('This will clear EVERYTHING including database!');

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

    // Step 3: Clear database using API endpoints
    console.log('🗄️ Clearing database...');

    try {
        // Clear achievements
        const achievementsResponse = await fetch('/api/achievements', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        if (achievementsResponse.ok) {
            console.log('✅ Database achievements cleared');
        } else {
            console.log('⚠️ Could not clear achievements via API');
        }
    } catch (e) {
        console.log('⚠️ Achievements API not available');
    }

    try {
        // Clear entries (today's progress)
        const entriesResponse = await fetch('/api/entries', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        if (entriesResponse.ok) {
            console.log('✅ Database entries cleared');
        } else {
            console.log('⚠️ Could not clear entries via API');
        }
    } catch (e) {
        console.log('⚠️ Entries API not available');
    }

    try {
        // Clear stats
        const statsResponse = await fetch('/api/stats', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        if (statsResponse.ok) {
            console.log('✅ Database stats cleared');
        } else {
            console.log('⚠️ Could not clear stats via API');
        }
    } catch (e) {
        console.log('⚠️ Stats API not available');
    }

    // Step 4: Clear any additional cached data
    if (window.caches) {
        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log('✅ Browser caches cleared');
        } catch (e) {
            console.log('⚠️ Could not clear browser caches');
        }
    }

    console.log('🎉 ULTIMATE RESET COMPLETE!');
    console.log('🔄 Reloading page to see fresh state...');

    // Force a hard reload
    setTimeout(() => {
        window.location.href = window.location.href + '?reset=' + Date.now();
    }, 2000);

})();