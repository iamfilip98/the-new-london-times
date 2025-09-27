function resetAll() {
    console.log('🔄 Resetting all times and achievements...');

    // First, let's see what's there
    console.log('📋 Checking current data...');
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        allKeys.push(localStorage.key(i));
    }
    console.log('All keys:', allKeys);

    let totalCleared = 0;

    // Reset ALL localStorage (aggressive approach)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            keysToRemove.push(key);
        }
    }

    console.log(`Found ${keysToRemove.length} keys to remove:`, keysToRemove);

    keysToRemove.forEach(key => {
        console.log(`Removing: ${key}`);
        localStorage.removeItem(key);
        totalCleared++;
    });

    // Also try to reset achievements through the app if available
    if (window.achievementsManager) {
        console.log('🎯 Found achievements manager, clearing achievements...');
        window.achievementsManager.unlockedAchievements = [];
    }

    // Reset sudoku engine data if available
    if (window.sudokuEngine) {
        console.log('🎮 Found sudoku engine, resetting game data...');
        window.sudokuEngine.bestTime = { easy: null, medium: null, hard: null };
        window.sudokuEngine.streakCount = 0;
    }

    console.log(`🎉 Reset complete! Cleared ${totalCleared} entries`);
    console.log('🔄 Refresh the page to see changes');

    return `Reset ${totalCleared} entries`;
}

function checkData() {
    console.log('🔍 Checking current localStorage data...');

    // List all localStorage keys
    console.log('📋 All localStorage keys:');
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        allKeys.push(key);
        console.log(`${i + 1}. ${key} = ${value?.substring(0, 100)}${value?.length > 100 ? '...' : ''}`);
    }

    return {
        totalKeys: allKeys.length,
        keys: allKeys
    };
}