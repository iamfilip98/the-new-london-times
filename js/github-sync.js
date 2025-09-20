class GitHubDataSync {
    constructor() {
        this.owner = 'YOUR_GITHUB_USERNAME'; // Replace with your GitHub username
        this.repo = 'sudoku-champion-data'; // Replace with your data repository name
        this.branch = 'main';
        this.token = null; // Will be set from environment or user input
        this.dataFile = 'sudoku-data.json';

        // Check if running locally or on Vercel
        this.isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    }

    async initialize() {
        try {
            if (this.isProduction) {
                // In production, try to load data from GitHub
                await this.loadFromGitHub();
            } else {
                // In development, use localStorage
                console.log('Development mode: Using localStorage only');
            }
        } catch (error) {
            console.log('GitHub sync not available, using localStorage only:', error.message);
        }
    }

    async loadFromGitHub() {
        if (!this.token) {
            throw new Error('GitHub token not configured');
        }

        try {
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.dataFile}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.status === 404) {
                console.log('Data file not found on GitHub, will create on first save');
                return null;
            }

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            const content = JSON.parse(atob(data.content));

            // Merge with local data
            this.mergeWithLocalData(content);

            return content;
        } catch (error) {
            console.error('Failed to load from GitHub:', error);
            throw error;
        }
    }

    async saveToGitHub(data) {
        if (!this.token || !this.isProduction) {
            return false; // Skip GitHub save in development
        }

        try {
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.dataFile}`;

            // First, try to get the current file to get its SHA
            let sha = null;
            try {
                const currentResponse = await fetch(url, {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (currentResponse.ok) {
                    const currentData = await currentResponse.json();
                    sha = currentData.sha;
                }
            } catch (e) {
                // File might not exist yet
            }

            const content = btoa(JSON.stringify(data, null, 2));
            const commitData = {
                message: `Update sudoku championship data - ${new Date().toISOString()}`,
                content: content,
                branch: this.branch
            };

            if (sha) {
                commitData.sha = sha;
            }

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commitData)
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            console.log('Data successfully saved to GitHub');
            return true;
        } catch (error) {
            console.error('Failed to save to GitHub:', error);
            return false;
        }
    }

    mergeWithLocalData(githubData) {
        // Get local data
        const localEntries = JSON.parse(localStorage.getItem('sudokuChampionshipEntries') || '[]');
        const localAchievements = JSON.parse(localStorage.getItem('sudokuChampionshipAchievements') || '[]');

        // Simple merge strategy: GitHub takes precedence, but preserve any newer local data
        const githubEntries = githubData.entries || [];
        const githubAchievements = githubData.achievements || [];

        // Find the latest date in GitHub data
        const latestGithubDate = githubEntries.length > 0
            ? Math.max(...githubEntries.map(e => new Date(e.date).getTime()))
            : 0;

        // Add any local entries that are newer than the latest GitHub entry
        const newerLocalEntries = localEntries.filter(entry =>
            new Date(entry.date).getTime() > latestGithubDate
        );

        // Merge entries
        const mergedEntries = [...githubEntries, ...newerLocalEntries]
            .filter((entry, index, self) =>
                index === self.findIndex(e => e.date === entry.date)
            ) // Remove duplicates by date
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date desc

        // For achievements, merge by ID and player
        const mergedAchievements = [...githubAchievements];
        localAchievements.forEach(localAch => {
            const exists = mergedAchievements.some(githubAch =>
                githubAch.id === localAch.id &&
                githubAch.player === localAch.player &&
                githubAch.unlockedAt === localAch.unlockedAt
            );
            if (!exists) {
                mergedAchievements.push(localAch);
            }
        });

        // Save merged data back to localStorage
        localStorage.setItem('sudokuChampionshipEntries', JSON.stringify(mergedEntries));
        localStorage.setItem('sudokuChampionshipAchievements', JSON.stringify(mergedAchievements));

        console.log(`Merged data: ${mergedEntries.length} entries, ${mergedAchievements.length} achievements`);
    }

    async syncData() {
        if (!this.isProduction) {
            return; // Don't sync in development
        }

        try {
            const entries = JSON.parse(localStorage.getItem('sudokuChampionshipEntries') || '[]');
            const achievements = JSON.parse(localStorage.getItem('sudokuChampionshipAchievements') || '[]');

            const data = {
                entries: entries,
                achievements: achievements,
                lastUpdated: new Date().toISOString(),
                version: '1.0'
            };

            await this.saveToGitHub(data);
        } catch (error) {
            console.error('Failed to sync data:', error);
        }
    }

    // Call this method whenever data changes
    scheduleSync() {
        // Debounce syncing to avoid too many API calls
        clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(() => {
            this.syncData();
        }, 5000); // Sync 5 seconds after last change
    }
}

// Initialize GitHub sync
window.githubSync = new GitHubDataSync();

// Override the save methods to trigger sync
if (window.sudokuApp) {
    const originalSaveToStorage = window.sudokuApp.saveToStorage;
    const originalSaveAchievements = window.sudokuApp.saveAchievements;

    window.sudokuApp.saveToStorage = function() {
        originalSaveToStorage.call(this);
        if (window.githubSync) {
            window.githubSync.scheduleSync();
        }
    };

    window.sudokuApp.saveAchievements = function() {
        originalSaveAchievements.call(this);
        if (window.githubSync) {
            window.githubSync.scheduleSync();
        }
    };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    if (window.githubSync) {
        window.githubSync.initialize();
    }
});