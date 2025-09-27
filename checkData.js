function checkData() {
    console.log('🔍 Checking current localStorage data...');

    // Check for specific game data
    const bestTimes = localStorage.getItem('sudoku_best_times');
    const streak = localStorage.getItem('sudoku_streak');

    console.log('Best Times:', bestTimes);
    console.log('Streak:', streak);

    // List all localStorage keys
    console.log('\n📋 All localStorage keys:');
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        allKeys.push(key);
        console.log(`${i + 1}. ${key} = ${localStorage.getItem(key)?.substring(0, 50)}...`);
    }

    // Filter game-related keys
    const gameKeys = allKeys.filter(key =>
        key.startsWith('sudoku_') ||
        key.startsWith('completed_') ||
        key.includes('partial_entry_') ||
        key.includes('game_state_') ||
        key.includes('notifications_')
    );

    console.log(`\n🎮 Found ${gameKeys.length} game-related keys:`, gameKeys);

    return {
        totalKeys: allKeys.length,
        gameKeys: gameKeys.length,
        bestTimes: bestTimes,
        streak: streak
    };
}