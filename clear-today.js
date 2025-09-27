// CLEAR TODAY'S DATA - Copy this into browser console to clear today's progress specifically

(async function() {
    console.log('🧹 CLEARING TODAY\'S DATA...');

    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today\'s date:', today);

    // Step 1: Clear browser storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Browser storage cleared');

    // Step 2: Reset app objects
    if (window.achievementsManager) {
        window.achievementsManager.unlockedAchievements = [];
        console.log('✅ Achievements reset');
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

    // Step 3: Delete today's entry specifically
    try {
        const response = await fetch(`/api/entries?date=${today}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Today\'s database entry deleted:', result);
        } else {
            console.log('⚠️ Could not delete today\'s entry:', response.status);
        }
    } catch (e) {
        console.log('⚠️ Error deleting today\'s entry:', e.message);
    }

    // Step 4: Clear ALL achievements
    try {
        const response = await fetch('/api/achievements', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            console.log('✅ All achievements cleared from database');
        } else {
            console.log('⚠️ Could not clear achievements');
        }
    } catch (e) {
        console.log('⚠️ Error clearing achievements:', e.message);
    }

    console.log('🎉 TODAY\'S DATA CLEARED!');
    console.log('🔄 Reloading page...');

    setTimeout(() => {
        window.location.reload(true);
    }, 2000);

})();