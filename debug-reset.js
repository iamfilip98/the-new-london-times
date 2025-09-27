// DEBUG RESET - No auto-refresh, shows all errors

(async function() {
    console.log('🔍 DEBUG RESET - Starting with full error logging...');

    try {
        // Step 1: Clear browser storage
        console.log('Step 1: Clearing browser storage...');
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ Browser storage cleared');

        // Step 2: Reset app objects with error handling
        console.log('Step 2: Resetting app objects...');

        try {
            if (window.achievementsManager) {
                window.achievementsManager.unlockedAchievements = [];
                window.achievementsManager.needsInitialCleanup = true;
                console.log('✅ Achievements manager reset');
            } else {
                console.log('ℹ️ No achievements manager found');
            }
        } catch (e) {
            console.error('❌ Error resetting achievements manager:', e);
        }

        try {
            if (window.sudokuEngine) {
                window.sudokuEngine.bestTime = { easy: null, medium: null, hard: null };
                window.sudokuEngine.streakCount = 0;
                window.sudokuEngine.timer = 0;
                window.sudokuEngine.gameStarted = false;
                window.sudokuEngine.gameCompleted = false;
                console.log('✅ Sudoku engine reset');
            } else {
                console.log('ℹ️ No sudoku engine found');
            }
        } catch (e) {
            console.error('❌ Error resetting sudoku engine:', e);
        }

        try {
            if (window.sudokuApp) {
                window.sudokuApp.dailyPuzzles = null;
                window.sudokuApp.entries = [];
                console.log('✅ Sudoku app reset');
            } else {
                console.log('ℹ️ No sudoku app found');
            }
        } catch (e) {
            console.error('❌ Error resetting sudoku app:', e);
        }

        // Step 3: Database clearing with detailed error logging
        console.log('Step 3: Clearing database...');

        // Try the new API endpoint first
        try {
            console.log('Trying /api/clear-all...');
            const response = await fetch('/api/clear-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Database cleared via clear-all API:', result);
            } else {
                const errorText = await response.text();
                console.error('❌ Clear-all API failed:', response.status, errorText);

                // Try individual endpoints
                console.log('Trying individual endpoints...');
                await tryIndividualEndpoints();
            }
        } catch (e) {
            console.error('❌ Clear-all API error:', e);
            console.log('Trying individual endpoints...');
            await tryIndividualEndpoints();
        }

        console.log('🎉 Debug reset completed - check the logs above for any errors');
        console.log('🔄 Manually refresh the page when ready');

    } catch (globalError) {
        console.error('❌ Global error in reset:', globalError);
    }

    async function tryIndividualEndpoints() {
        // Clear achievements
        try {
            console.log('Trying DELETE /api/achievements...');
            const achResponse = await fetch('/api/achievements', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('Achievements response:', achResponse.status, achResponse.ok);
            if (achResponse.ok) {
                console.log('✅ Achievements cleared');
            } else {
                const errorText = await achResponse.text();
                console.error('❌ Achievements clear failed:', errorText);
            }
        } catch (e) {
            console.error('❌ Error clearing achievements:', e);
        }

        // Clear today's entries
        try {
            const today = new Date().toISOString().split('T')[0];
            console.log('Trying DELETE /api/entries for date:', today);
            const entryResponse = await fetch(`/api/entries?date=${today}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('Entries response:', entryResponse.status, entryResponse.ok);
            if (entryResponse.ok) {
                console.log('✅ Today\'s entries cleared');
            } else {
                const errorText = await entryResponse.text();
                console.error('❌ Entries clear failed:', errorText);
            }
        } catch (e) {
            console.error('❌ Error clearing entries:', e);
        }
    }

})();