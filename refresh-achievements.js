// Achievement refresh script to unlock new retroactive achievements
// Run this after adding new achievement definitions

const fetch = require('node-fetch');

async function refreshAchievements() {
    console.log('🔄 Starting achievement refresh for new high score achievements...');

    try {
        // Call the refresh endpoint
        const response = await fetch('http://localhost:3000/api/achievements', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('✅ Achievement refresh endpoint called successfully');
            console.log('🎯 This will recalculate all achievements based on historical data');
            console.log('🏆 Players who previously scored 3000+, 4000+, or 5000+ should now have the new achievements');

            // Give some time for the refresh to complete
            setTimeout(() => {
                console.log('📊 Achievement refresh should be complete. Check the achievements page!');
            }, 2000);
        } else {
            console.error('❌ Failed to refresh achievements:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('❌ Error refreshing achievements:', error.message);
        console.log('💡 Alternative: Open the website and run window.refreshAchievements() in browser console');
    }
}

refreshAchievements();