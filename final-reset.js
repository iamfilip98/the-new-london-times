// FINAL RESET - This will absolutely clear everything!

(async function() {
    console.log('🚨 FINAL RESET - CLEARING EVERYTHING!');

    // Step 1: Clear ALL browser storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Browser storage cleared');

    // Step 2: Reset ALL app objects
    if (window.achievementsManager) {
        window.achievementsManager.unlockedAchievements = [];
        window.achievementsManager.needsInitialCleanup = true;
    }

    if (window.sudokuEngine) {
        window.sudokuEngine.bestTime = { easy: null, medium: null, hard: null };
        window.sudokuEngine.streakCount = 0;
        window.sudokuEngine.timer = 0;
        window.sudokuEngine.gameStarted = false;
        window.sudokuEngine.gameCompleted = false;
    }

    if (window.sudokuApp) {
        window.sudokuApp.dailyPuzzles = null;
        window.sudokuApp.entries = [];
    }

    console.log('✅ App objects reset');

    // Step 3: Use the new clear-all API endpoint
    try {
        const response = await fetch('/api/clear-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Database completely cleared via API:', result);
        } else {
            console.log('⚠️ Clear-all API failed, trying individual endpoints...');

            // Fallback: try individual endpoints
            await fetch('/api/achievements', { method: 'DELETE' });
            console.log('✅ Achievements cleared');

            // Clear today's entries
            const today = new Date().toISOString().split('T')[0];
            await fetch(\`/api/entries?date=\${today}\`, { method: 'DELETE' });
            console.log('✅ Today\\'s entries cleared');
        }
    } catch (e) {
        console.log('⚠️ API calls failed, but localStorage is cleared');
    }

    // Step 4: Clear caches
    if (window.caches) {
        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log('✅ Browser caches cleared');
        } catch (e) {
            console.log('⚠️ Could not clear caches');
        }
    }

    console.log('🎉 FINAL RESET COMPLETE!');
    console.log('💥 EVERYTHING HAS BEEN CLEARED!');
    console.log('🔄 Reloading page...');

    // Hard reload with cache bypass
    setTimeout(() => {
        window.location.href = window.location.protocol + '//' + window.location.host + window.location.pathname + '?clearCache=' + Date.now();
    }, 2000);

})();