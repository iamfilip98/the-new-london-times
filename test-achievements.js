// Simple test to refresh achievements and check the results
console.log('🧪 Starting achievement test...');

// You can run this in browser console after loading the page
// or use it as a reference for manual testing

async function testAchievementRefresh() {
    if (typeof window.refreshAchievements === 'function') {
        console.log('🔄 Running achievement refresh...');
        const result = await window.refreshAchievements();
        console.log('📊 Refresh result:', result);
        return result;
    } else {
        console.error('❌ refreshAchievements function not found. Make sure achievements.js is loaded.');
        return null;
    }
}

// Manual check function
function checkAchievementData() {
    if (window.achievementsManager) {
        console.log('📈 Current unlocked achievements:', window.achievementsManager.unlockedAchievements.length);

        // Check for Speed Demon Easy specifically
        const speedDemonEasy = window.achievementsManager.unlockedAchievements.filter(a =>
            a.id === 'speed_demon_easy'
        );
        console.log('⚡ Speed Demon Easy unlocks:', speedDemonEasy);

        // Check for excessive duplicates
        const achievementCounts = {};
        window.achievementsManager.unlockedAchievements.forEach(a => {
            const key = `${a.id}-${a.player}`;
            achievementCounts[key] = (achievementCounts[key] || 0) + 1;
        });

        const duplicates = Object.entries(achievementCounts).filter(([key, count]) => count > 4);
        if (duplicates.length > 0) {
            console.warn('⚠️ Found achievements with more unlocks than entries:', duplicates);
        } else {
            console.log('✅ No excessive duplicates found');
        }

        return achievementCounts;
    } else {
        console.error('❌ achievementsManager not found');
        return null;
    }
}

console.log('🎯 To test achievements, run these functions in browser console:');
console.log('testAchievementRefresh() - Refresh all achievements');
console.log('checkAchievementData() - Check current achievement state');

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testAchievementRefresh, checkAchievementData };
}