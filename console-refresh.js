// Copy and paste this into browser console on the main site (index.html)
// to refresh achievements and check for new high score achievements

console.log('🔄 Starting achievement refresh from console...');

async function refreshAndCheck() {
    try {
        // Make sure we're on a page with the achievement manager loaded
        if (!window.achievementsManager) {
            console.error('❌ Achievement manager not found. Make sure you\'re on the main site (index.html) and logged in.');
            return;
        }

        console.log('✅ Achievement manager found, starting refresh...');

        // Run the full refresh
        const result = await window.achievementsManager.refreshAllAchievements();

        if (result.success) {
            console.log('🎉 Achievement refresh completed!');
            console.log(`📊 Processed ${result.processedEntries} game entries`);
            console.log(`🏆 Total achievements: ${result.totalAchievements}`);

            // Check for the new achievements specifically
            await window.achievementsManager.refreshAchievements();
            const unlocked = window.achievementsManager.unlockedAchievements;

            const newHighScoreAchievements = unlocked.filter(a =>
                ['point_titan', 'point_legend', 'point_god'].includes(a.id)
            );

            console.log('\n🎯 NEW HIGH SCORE ACHIEVEMENT CHECK:');
            if (newHighScoreAchievements.length > 0) {
                console.log(`✨ Found ${newHighScoreAchievements.length} new high score achievements!`);
                newHighScoreAchievements.forEach(achievement => {
                    const titles = {
                        'point_titan': 'Point Titan (3000+)',
                        'point_legend': 'Point Legend (4000+)',
                        'point_god': 'Point God (5000+)'
                    };
                    console.log(`  🏆 ${achievement.player}: ${titles[achievement.id]}`);
                });
            } else {
                console.log('📝 No players have unlocked the new high score achievements yet');
                console.log('   (This means no one has scored 3000+, 4000+, or 5000+ points in a single day)');
            }

            // Show overall stats
            const stats = await window.achievementsManager.getAchievementStats();
            console.log(`\n📈 Achievement Stats: ${stats.unlocked}/${stats.total} (${stats.percentage}%)`);

            console.log('\n✅ Refresh complete! Check the achievements page to see all unlocked achievements.');

        } else {
            console.error('❌ Achievement refresh failed:', result.error);
        }

    } catch (error) {
        console.error('❌ Error during refresh:', error);
    }
}

// Run the refresh
refreshAndCheck();