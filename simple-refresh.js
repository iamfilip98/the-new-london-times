// SIMPLE: Achievement Refresh (Copy each line one by one)
// Make sure you're on your main site and logged in first!

// Step 1: Check if achievement manager is loaded
window.achievementsManager

// Step 2: Run the refresh (this will take a few seconds)
window.refreshAchievements()

// Step 3: Check for new achievements (run after step 2 completes)
window.achievementsManager.unlockedAchievements.filter(a => ['point_titan', 'point_legend', 'point_god'].includes(a.id))