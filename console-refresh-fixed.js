// FIXED: Console Achievement Refresh Script
// Copy and paste this into browser console on your main site (index.html)
// Make sure you're logged in first!

console.log('🔄 Starting achievement refresh...');

async function refreshAndCheck() {
    try {
        if (!window.achievementsManager) {
            console.error('❌ Achievement manager not found. Make sure you are logged into the main site.');
            return;
        }

        console.log('✅ Achievement manager found, starting refresh...');
        const result = await window.achievementsManager.refreshAllAchievements();

        if (result.success) {
            console.log('🎉 Achievement refresh completed!');
            console.log('📊 Processed ' + result.processedEntries + ' game entries');
            console.log('🏆 Total achievements: ' + result.totalAchievements);

            await window.achievementsManager.refreshAchievements();
            const unlocked = window.achievementsManager.unlockedAchievements;

            const newAchievements = unlocked.filter(function(a) {
                return ['point_titan', 'point_legend', 'point_god'].includes(a.id);
            });

            console.log('\n🎯 NEW HIGH SCORE ACHIEVEMENT CHECK:');
            if (newAchievements.length > 0) {
                console.log('✨ Found ' + newAchievements.length + ' new high score achievements!');
                newAchievements.forEach(function(achievement) {
                    var titles = {
                        'point_titan': 'Point Titan (3000+)',
                        'point_legend': 'Point Legend (4000+)',
                        'point_god': 'Point God (5000+)'
                    };
                    console.log('  🏆 ' + achievement.player + ': ' + titles[achievement.id]);
                });
            } else {
                console.log('📝 No players have unlocked the new high score achievements yet');
            }

            console.log('\n✅ Refresh complete! Check the achievements page to see all unlocked achievements.');
        } else {
            console.error('❌ Achievement refresh failed: ' + result.error);
        }
    } catch (error) {
        console.error('❌ Error during refresh: ' + error.message);
    }
}

refreshAndCheck();