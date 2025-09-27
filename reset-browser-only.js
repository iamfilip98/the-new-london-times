/**
 * Browser-Only Reset Script
 *
 * This script resets ONLY browser localStorage data:
 * - Best times for all difficulties
 * - Streak count
 * - Game states and completed games
 *
 * Note: This does NOT reset database achievements.
 * For full reset including database, use reset-data.js
 *
 * Usage: Copy and paste this entire script into your browser console
 */

(function() {
    console.log('🔄 Starting browser-only reset...');
    console.log('⚠️  This will reset ALL game data in localStorage');

    // Confirm before proceeding
    const proceed = confirm('Are you sure you want to reset all times and achievements? This cannot be undone.');
    if (!proceed) {
        console.log('❌ Reset cancelled by user');
        return;
    }

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

    // Reset settings (optional - user can uncomment)
    // localStorage.removeItem('sudoku_settings');
    // console.log('✅ Cleared settings');

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

    console.log(`✅ Cleared ${keysToRemove.length} additional game entries`);
    console.log(`🎉 Total cleared: ${totalCleared} localStorage entries`);
    console.log('');
    console.log('📝 IMPORTANT: This only reset browser data.');
    console.log('💾 Database achievements are NOT reset.');
    console.log('🔄 Refresh the page to see changes.');

    // Offer to refresh automatically
    setTimeout(() => {
        const refresh = confirm('Would you like to refresh the page now to see the changes?');
        if (refresh) {
            window.location.reload();
        }
    }, 1000);
})();