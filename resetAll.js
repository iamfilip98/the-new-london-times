function resetAll() {
    console.log('🔄 Resetting all times and achievements...');

    let totalCleared = 0;

    // Reset best times
    if (localStorage.getItem('sudoku_best_times')) {
        localStorage.removeItem('sudoku_best_times');
        console.log('✅ Cleared best times');
        totalCleared++;
    }

    // Reset streak count
    if (localStorage.getItem('sudoku_streak')) {
        localStorage.removeItem('sudoku_streak');
        console.log('✅ Cleared streak count');
        totalCleared++;
    }

    // Clear all game-related localStorage entries
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
            key.startsWith('sudoku_') ||
            key.startsWith('completed_') ||
            key.includes('partial_entry_') ||
            key.includes('game_state_') ||
            key.includes('notifications_')
        )) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        totalCleared++;
    });

    console.log(`🎉 Reset complete! Cleared ${totalCleared} entries`);
    console.log('🔄 Refresh the page to see changes');

    return `Reset ${totalCleared} entries`;
}