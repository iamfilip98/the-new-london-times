class SudokuChampionship {
    constructor() {
        this.entries = [];
        this.achievements = [];
        this.challenges = [];
        this.streaks = { faidao: { current: 0, best: 0 }, filip: { current: 0, best: 0 } };
        this.records = { faidao: {}, filip: {} };
        this.migrationDone = false;

        // Add caching for better performance
        this.cache = {
            lastUpdate: null,
            duration: 30000, // 30 seconds cache
            data: null
        };

        // Puzzle preloading cache
        this.puzzleCache = {
            puzzles: null,
            loadTime: null,
            loading: false
        };

        // Date change detection - use local date
        this.currentDate = this.getTodayDate();
        this.lastCheckedDate = localStorage.getItem('lastCheckedDate');
        this.initializationComplete = false;

        this.init();
    }

    init() {
        // Ensure DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initialize();
            });
        } else {
            this.initialize();
        }
    }

    async initialize() {
        // Scroll to top on page load/refresh
        window.scrollTo(0, 0);

        // Check if date has changed and handle new day logic
        await this.checkDateChange();

        this.setupEventListeners();
        this.setupNavigation();
        this.setupLeaderboardTabs();
        this.setCurrentDate();
        this.initializeScoreDisplay();

        // Preload puzzles immediately on website entry
        this.preloadPuzzles();

        // Load data from database or migrate from localStorage
        await this.loadData();

        await this.updateDashboard();
        await this.updateAllPages();

        // Set up automatic date checking every minute
        this.startDateChangeMonitoring();

        // Mark initialization as complete
        this.initializationComplete = true;
        console.log('✅ Application initialization complete');
    }

    initializeScoreDisplay() {
        // Initialize battle results
        const winnerElement = document.getElementById('winnerAnnouncement');
        if (winnerElement) {
            winnerElement.querySelector('.winner-text').textContent = 'Play Sudoku to compete!';
        }
    }

    setupEventListeners() {
        // Achievement notification close
        const achievementClose = document.querySelector('.achievement-close');
        if (achievementClose) {
            achievementClose.addEventListener('click', () => {
                this.hideAchievementNotification();
            });
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.page');

        navLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const targetPage = e.target.closest('.nav-link').dataset.page;

                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                e.target.closest('.nav-link').classList.add('active');

                // Update active page
                pages.forEach(page => page.classList.remove('active'));
                const targetPageElement = document.getElementById(targetPage);
                targetPageElement.classList.add('active');

                // Scroll to top of page when switching
                targetPageElement.scrollTop = 0;
                window.scrollTo(0, 0);

                // Update page content
                await this.updatePageContent(targetPage);
            });
        });
    }

    setupLeaderboardTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');

                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                const targetContent = document.getElementById(`${targetTab}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                    // Scroll to top of tab content when switching tabs
                    targetContent.scrollTop = 0;
                }
            });
        });
    }

    getTodayDate() {
        // Get today's date in local timezone as YYYY-MM-DD string
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    setCurrentDate() {
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    async checkDateChange() {
        const today = this.getTodayDate();

        // If this is the first visit or date has changed
        if (!this.lastCheckedDate || this.lastCheckedDate !== today) {
            console.log(`🗓️ Date change detected: ${this.lastCheckedDate} → ${today}`);

            // Clear today's progress from localStorage for fresh start
            this.clearTodayProgressFromLocalStorage(today);

            // Clear puzzle cache to force new puzzle generation
            this.puzzleCache.puzzles = null;
            this.puzzleCache.loadTime = null;

            // Clear general cache to force data refresh
            this.cache.data = null;
            this.cache.lastUpdate = null;

            // Update the stored date
            localStorage.setItem('lastCheckedDate', today);
            this.lastCheckedDate = today;
            this.currentDate = today;

            // Refresh the date display
            this.setCurrentDate();

            // If initialization is complete, refresh data
            if (this.initializationComplete) {
                console.log(`🔄 Refreshing data for new day: ${today}`);

                // Preload fresh puzzles
                await this.preloadPuzzles();

                // Refresh dashboard data
                await this.updateDashboard();

                // Update all page content
                await this.updateAllPages();
            }

            console.log(`✨ Fresh start for ${today} - progress reset`);
        }
    }

    clearTodayProgressFromLocalStorage(date) {
        const keys = Object.keys(localStorage);
        let cleared = 0;

        // Clear all keys related to today's date
        keys.forEach(key => {
            if (key.includes(date) || key.startsWith('completed_')) {
                // Only clear today's completed games, not other data
                if (key.includes(date)) {
                    localStorage.removeItem(key);
                    cleared++;
                }
            }
        });

        if (cleared > 0) {
            console.log(`🧹 Cleared ${cleared} localStorage items for ${date}`);
        }
    }

    startDateChangeMonitoring() {
        // Check for date changes every minute
        setInterval(() => {
            this.checkDateChange();
        }, 60000); // 1 minute

        // Also check when page becomes visible (user returns to tab)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkDateChange();
            }
        });
    }


    parseTimeToSeconds(timeString) {
        if (!timeString || timeString.trim() === '' || timeString === '0:00') return null;

        // Handle raw seconds input (e.g., "330")
        if (!timeString.includes(':')) {
            const totalSeconds = parseInt(timeString);
            if (isNaN(totalSeconds) || totalSeconds <= 0) return null;
            return totalSeconds;
        }

        // Handle MM:SS format
        const parts = timeString.split(':');
        if (parts.length !== 2) return null;

        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;

        // Return null for invalid times like 0:00
        if (minutes === 0 && seconds === 0) return null;

        return minutes * 60 + seconds;
    }

    formatSecondsToTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    isEntryComplete(entry) {
        return ['faidao', 'filip'].every(player =>
            ['easy', 'medium', 'hard'].every(difficulty =>
                entry[player].dnf[difficulty] || entry[player].times[difficulty] !== null
            )
        );
    }


    updateBattleResults(scores) {
        const faidaoTotal = scores.faidao.total;
        const filipTotal = scores.filip.total;
        const winnerElement = document.getElementById('winnerAnnouncement');
        const faidaoBar = document.getElementById('faidaoScoreBar');
        const filipBar = document.getElementById('filipScoreBar');
        const faidaoText = document.getElementById('faidaoScoreText');
        const filipText = document.getElementById('filipScoreText');

        // Determine winner
        let winner = 'tie';
        let winnerText = "It's a tie!";

        if (faidaoTotal > filipTotal && faidaoTotal > 0) {
            winner = 'faidao';
            winnerText = '🏆 Faidao Wins!';
            winnerElement.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
        } else if (filipTotal > faidaoTotal && filipTotal > 0) {
            winner = 'filip';
            winnerText = '🏆 Filip Wins!';
            winnerElement.style.background = 'linear-gradient(45deg, #4ecdc4, #44a08d)';
        } else {
            winnerElement.style.background = 'rgba(255, 255, 255, 0.1)';
        }

        winnerElement.querySelector('.winner-text').textContent = winnerText;

        // Update score bars
        const maxScore = Math.max(faidaoTotal, filipTotal, 1);
        const faidaoWidth = (faidaoTotal / maxScore) * 100;
        const filipWidth = (filipTotal / maxScore) * 100;

        faidaoBar.style.width = `${faidaoWidth}%`;
        filipBar.style.width = `${filipWidth}%`;
        faidaoText.textContent = faidaoTotal.toFixed(0);
        filipText.textContent = filipTotal.toFixed(0);
    }

    async loadData() {
        try {
            // Check if we have localStorage data to migrate
            const localEntries = localStorage.getItem('sudokuChampionshipEntries');
            const localAchievements = localStorage.getItem('sudokuChampionshipAchievements');
            const localStreaks = localStorage.getItem('sudokuChampionshipStreaks');
            const localChallenges = localStorage.getItem('sudokuChampionshipChallenges');

            if (localEntries || localAchievements || localStreaks || localChallenges) {
                // Migrate localStorage data to database
                const migrationData = {
                    entries: localEntries ? JSON.parse(localEntries) : [],
                    achievements: localAchievements ? JSON.parse(localAchievements) : [],
                    streaks: localStreaks ? JSON.parse(localStreaks) : null,
                    challenges: localChallenges ? JSON.parse(localChallenges) : []
                };

                await fetch('/api/entries', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        migrate: true,
                        migrationData
                    })
                });

                // Clear localStorage after successful migration
                localStorage.removeItem('sudokuChampionshipEntries');
                localStorage.removeItem('sudokuChampionshipAchievements');
                localStorage.removeItem('sudokuChampionshipStreaks');
                localStorage.removeItem('sudokuChampionshipChallenges');
                localStorage.removeItem('sudokuChampionshipRecords');

                console.log('Successfully migrated localStorage data to database');
            }

            // Load data from database - optimized with parallel loading
            const [entries, bulkData] = await Promise.all([
                this.loadFromStorage(),
                this.loadBulkData()
            ]);

            this.entries = entries;
            this.achievements = bulkData.achievements || [];
            this.streaks = bulkData.streaks || { faidao: { current: 0, best: 0 }, filip: { current: 0, best: 0 } };
            this.challenges = bulkData.challenges || [];

            // Calculate records from entries
            this.records = this.calculateRecords();

            // Recalculate streaks to ensure they match the current data
            await this.updateStreaks();

        } catch (error) {
            console.error('Failed to load data:', error);
        }
    }

    calculateRecords() {
        const records = { faidao: {}, filip: {} };

        this.entries.forEach(entry => {
            ['faidao', 'filip'].forEach(player => {
                if (!records[player]) records[player] = {};

                ['easy', 'medium', 'hard'].forEach(difficulty => {
                    const time = entry[player].times[difficulty];
                    const errors = entry[player].errors[difficulty];
                    const dnf = entry[player].dnf[difficulty];

                    if (!dnf && time !== null) {
                        // Update fastest time record
                        if (!records[player][`${difficulty}_fastest`] ||
                            time < records[player][`${difficulty}_fastest`]) {
                            records[player][`${difficulty}_fastest`] = time;
                        }

                        // Update perfect game record (0 errors)
                        if (errors === 0) {
                            if (!records[player][`${difficulty}_perfect`] ||
                                time < records[player][`${difficulty}_perfect`]) {
                                records[player][`${difficulty}_perfect`] = time;
                            }
                        }
                    }
                });
            });
        });

        return records;
    }

    async saveEntry() {
        // This method is no longer used since manual input is disabled
        // Sudoku games now automatically save through the Sudoku engine
        console.log('Manual entry saving is disabled - games are saved automatically through Sudoku play');
        return;
    }

    async updateStreaks() {
        if (this.entries.length === 0) {
            // If no entries exist, streaks should be 0
            this.streaks = {
                faidao: { current: 0, best: this.streaks.faidao?.best || 0 },
                filip: { current: 0, best: this.streaks.filip?.best || 0 }
            };
            await this.saveStreaks();
            return;
        }

        // Sort entries by date (oldest first) for streak calculation
        // Only consider entries where all 6 times are submitted
        const completeEntries = this.entries.filter(entry => this.isEntryComplete(entry));

        const sortedEntries = [...completeEntries].sort((a, b) => new Date(a.date) - new Date(b.date));

        let currentFaidaoStreak = 0;
        let currentFilipStreak = 0;
        let faidaoBest = this.streaks.faidao?.best || 0;
        let filipBest = this.streaks.filip?.best || 0;

        sortedEntries.forEach((entry) => {
            const faidaoWon = entry.faidao.scores.total > entry.filip.scores.total;
            const filipWon = entry.filip.scores.total > entry.faidao.scores.total;

            if (faidaoWon) {
                currentFaidaoStreak++;
                currentFilipStreak = 0;
                faidaoBest = Math.max(faidaoBest, currentFaidaoStreak);
            } else if (filipWon) {
                currentFilipStreak++;
                currentFaidaoStreak = 0;
                filipBest = Math.max(filipBest, currentFilipStreak);
            } else {
                // Ties break both streaks
                currentFaidaoStreak = 0;
                currentFilipStreak = 0;
            }
        });

        // Update streaks with calculated values
        const newStreaks = {
            faidao: {
                current: currentFaidaoStreak,
                best: faidaoBest
            },
            filip: {
                current: currentFilipStreak,
                best: filipBest
            }
        };

        this.streaks = newStreaks;
        await this.saveStreaks();
    }

    updateRecords(entry) {
        ['faidao', 'filip'].forEach(player => {
            if (!this.records[player]) this.records[player] = {};

            ['easy', 'medium', 'hard'].forEach(difficulty => {
                const time = entry[player].times[difficulty];
                const errors = entry[player].errors[difficulty];
                const dnf = entry[player].dnf[difficulty];

                if (!dnf && time !== null) {
                    // Update fastest time record
                    if (!this.records[player][`${difficulty}_fastest`] ||
                        time < this.records[player][`${difficulty}_fastest`]) {
                        this.records[player][`${difficulty}_fastest`] = time;
                    }

                    // Update perfect game record (0 errors)
                    if (errors === 0) {
                        if (!this.records[player][`${difficulty}_perfect`] ||
                            time < this.records[player][`${difficulty}_perfect`]) {
                            this.records[player][`${difficulty}_perfect`] = time;
                        }
                    }
                }
            });
        });

        this.saveRecords();
    }

    clearEntry() {
        // This method is no longer used since manual input is disabled
        console.log('Manual entry clearing is disabled - use Sudoku game controls instead');
        return;
    }

    checkExistingEntry() {
        // This method is no longer used since manual input is disabled
        console.log('Manual entry loading is disabled - entries are managed through Sudoku play');
        return;
    }

    loadEntry(entry) {
        // This method is no longer used since manual input is disabled
        console.log('Manual entry loading is disabled - entries are managed through Sudoku play');
        return;
    }

    async updateDashboard() {
        this.updateStreakDisplay();
        this.updateOverallRecord();
        this.updateRecentHistory();
        await this.updateTodayProgress();
        this.updateProgressNotifications();
    }

    updateStreakDisplay() {
        document.getElementById('faidaoCurrentStreak').textContent = this.streaks.faidao?.current || 0;
        document.getElementById('faidaoBestStreak').textContent = this.streaks.faidao?.best || 0;
        document.getElementById('filipCurrentStreak').textContent = this.streaks.filip?.current || 0;
        document.getElementById('filipBestStreak').textContent = this.streaks.filip?.best || 0;
    }

    updateOverallRecord() {
        let faidaoWins = 0;
        let filipWins = 0;

        // Only count complete entries for overall record
        const completeEntries = this.entries.filter(entry => this.isEntryComplete(entry));

        completeEntries.forEach(entry => {
            if (entry.faidao.scores.total > entry.filip.scores.total) {
                faidaoWins++;
            } else if (entry.filip.scores.total > entry.faidao.scores.total) {
                filipWins++;
            }
        });

        document.getElementById('overallRecord').textContent = `${faidaoWins} - ${filipWins}`;
    }

    updateRecentHistory() {
        const historyContainer = document.getElementById('historyCards');
        const recentEntries = this.entries.slice(0, 5); // Show last 5 entries

        if (recentEntries.length === 0) {
            historyContainer.innerHTML = '<div class="no-history">No battles recorded yet. Start competing!</div>';
            return;
        }

        historyContainer.innerHTML = recentEntries.map(entry => {
            // Check if entry is complete
            const isComplete = this.isEntryComplete(entry);

            const winner = isComplete
                ? (entry.faidao.scores.total > entry.filip.scores.total ? 'Faidao' :
                   entry.filip.scores.total > entry.faidao.scores.total ? 'Filip' : 'Tie')
                : 'Incomplete';

            return `
                <div class="history-card">
                    <div class="history-date">${new Date(entry.date).toLocaleDateString()}</div>
                    <div class="history-scores">
                        <div class="history-score">
                            <div class="player-name">Faidao</div>
                            <div class="score-value">${entry.faidao.scores.total.toFixed(0)}</div>
                        </div>
                        <div class="score-vs">VS</div>
                        <div class="history-score">
                            <div class="player-name">Filip</div>
                            <div class="score-value">${entry.filip.scores.total.toFixed(0)}</div>
                        </div>
                    </div>
                    <div class="history-winner${winner === 'Filip' ? ' filip-winner' : ''}">${winner}</div>
                    <div class="history-actions">
                        <button class="history-btn" onclick="sudokuApp.editEntry('${entry.date}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="history-btn" onclick="sudokuApp.deleteEntry('${entry.date}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    editEntry(date) {
        // Entry editing is disabled since manual input is removed
        console.log('Entry editing is disabled - use Sudoku game to create new entries');
        return;
    }

    async deleteEntry(date) {
        if (confirm('Are you sure you want to delete this entry?')) {
            try {
                const response = await fetch(`/api/entries?date=${date}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Failed to delete entry');
                }

                this.entries = this.entries.filter(entry => entry.date !== date);
                await this.updateStreaks();
                await this.updateDashboard();
            } catch (error) {
                console.error('Failed to delete entry:', error);
                alert('Failed to delete entry. Please try again.');
            }
        }
    }

    async updatePageContent(page) {
        switch (page) {
            case 'analytics':
                if (window.analyticsManager) {
                    window.analyticsManager.updateCharts(this.entries);
                }
                break;
            case 'achievements':
                if (window.achievementsManager) {
                    await window.achievementsManager.updateAchievements(this.entries, this.streaks, this.records);
                }
                break;
            case 'leaderboards':
                this.updateLeaderboards();
                break;
            case 'challenges':
                if (window.challengesManager) {
                    window.challengesManager.updateChallenges(this.entries);
                }
                break;
        }
    }

    updateLeaderboards() {
        this.updateMonthlyLeaderboard();
        this.updateWeeklyLeaderboard();
        this.updateRecords();
    }

    updateMonthlyLeaderboard() {
        const monthlyContainer = document.getElementById('monthlyLeaderboard');
        if (!monthlyContainer) return;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyEntries = this.entries.filter(entry => {
            // Parse date and set to start of day in local timezone
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            const isCurrentMonth = entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
            // Only include complete entries in leaderboard
            const isComplete = this.isEntryComplete(entry);
            return isCurrentMonth && isComplete;
        });

        if (monthlyEntries.length === 0) {
            monthlyContainer.innerHTML = '<p class="no-data">No complete battles this month yet!</p>';
            return;
        }

        const monthlyStats = this.calculatePlayerStats(monthlyEntries);
        monthlyContainer.innerHTML = this.generateLeaderboardHTML(monthlyStats, 'This Month');
    }

    updateWeeklyLeaderboard() {
        const weeklyContainer = document.getElementById('weeklyLeaderboard');
        if (!weeklyContainer) return;

        const now = new Date();
        const startOfWeek = new Date(now);
        const dayOfWeek = now.getDay();

        // Calculate Monday of the current calendar week
        // If today is Sunday (0), go back 6 days to get Monday
        // If today is Monday (1), use today (go back 0 days)
        // If today is Tuesday (2), go back 1 day to get Monday, etc.
        const daysFromMonday = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
        startOfWeek.setDate(now.getDate() - daysFromMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        // Calculate end of current week (Sunday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const weeklyEntries = this.entries.filter(entry => {
            // Parse date and set to start of day in local timezone
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);

            // Check if entry is within the Monday-Sunday week
            const isThisWeek = entryDate >= startOfWeek && entryDate <= endOfWeek;
            // Only include complete entries in leaderboard
            const isComplete = this.isEntryComplete(entry);
            return isThisWeek && isComplete;
        });

        if (weeklyEntries.length === 0) {
            weeklyContainer.innerHTML = '<p class="no-data">No complete battles this week yet!</p>';
            return;
        }

        const weeklyStats = this.calculatePlayerStats(weeklyEntries);
        weeklyContainer.innerHTML = this.generateLeaderboardHTML(weeklyStats, 'This Week');
    }

    updateRecords() {
        const fastestTimesContainer = document.getElementById('fastestTimes');
        const perfectGamesContainer = document.getElementById('perfectGames');

        if (!fastestTimesContainer || !perfectGamesContainer) return;

        // Fastest times by difficulty
        const difficulties = ['easy', 'medium', 'hard'];
        const fastestTimes = {};

        difficulties.forEach(difficulty => {
            const records = [];
            ['faidao', 'filip'].forEach(player => {
                const playerTimes = this.entries
                    .filter(entry => !entry[player].dnf[difficulty] && entry[player].times[difficulty])
                    .map(entry => ({
                        time: entry[player].times[difficulty],
                        date: entry.date,
                        player: player
                    }))
                    .sort((a, b) => a.time - b.time);

                if (playerTimes.length > 0) {
                    records.push(playerTimes[0]);
                }
            });

            fastestTimes[difficulty] = records.sort((a, b) => a.time - b.time);
        });

        fastestTimesContainer.innerHTML = this.generateRecordsHTML(fastestTimes);

        // Perfect games (0 errors)
        const perfectGames = this.entries.filter(entry => {
            return ['faidao', 'filip'].some(player => {
                const totalErrors = (entry[player].errors.easy || 0) +
                                  (entry[player].errors.medium || 0) +
                                  (entry[player].errors.hard || 0);
                return totalErrors === 0;
            });
        }).slice(0, 10);

        perfectGamesContainer.innerHTML = this.generatePerfectGamesHTML(perfectGames);
    }

    calculatePlayerStats(entries) {
        const stats = {
            faidao: { wins: 0, totalScore: 0, games: entries.length },
            filip: { wins: 0, totalScore: 0, games: entries.length }
        };

        entries.forEach(entry => {
            stats.faidao.totalScore += entry.faidao.scores.total;
            stats.filip.totalScore += entry.filip.scores.total;

            if (entry.faidao.scores.total > entry.filip.scores.total) {
                stats.faidao.wins++;
            } else if (entry.filip.scores.total > entry.faidao.scores.total) {
                stats.filip.wins++;
            }
        });

        stats.faidao.avgScore = stats.faidao.totalScore / entries.length || 0;
        stats.filip.avgScore = stats.filip.totalScore / entries.length || 0;
        stats.faidao.winRate = (stats.faidao.wins / entries.length) * 100 || 0;
        stats.filip.winRate = (stats.filip.wins / entries.length) * 100 || 0;

        return stats;
    }

    generateLeaderboardHTML(stats, period) {
        const players = [
            { name: 'Faidao', key: 'faidao', avatar: 'F', color: 'faidao-color' },
            { name: 'Filip', key: 'filip', avatar: 'F', color: 'filip-color' }
        ].sort((a, b) => stats[b.key].wins - stats[a.key].wins);

        return players.map((player, index) => {
            const playerStats = stats[player.key];
            return `
                <div class="leaderboard-card ${index === 0 ? 'winner' : ''}">
                    <div class="rank">#${index + 1}</div>
                    <div class="player-info">
                        <div class="player-avatar ${player.color}">${player.avatar}</div>
                        <div class="player-details">
                            <h4>${player.name}</h4>
                            <p>${playerStats.wins} Win${playerStats.wins === 1 ? '' : 's'}</p>
                        </div>
                    </div>
                    <div class="stats">
                        <div class="stat">
                            <span class="stat-value">${playerStats.wins}</span>
                            <span class="stat-label">${playerStats.wins === 1 ? 'Win' : 'Wins'}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${Math.round(playerStats.avgScore)}</span>
                            <span class="stat-label">Avg Score</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    generateRecordsHTML(fastestTimes) {
        const difficulties = ['easy', 'medium', 'hard'];
        return difficulties.map(difficulty => {
            const records = fastestTimes[difficulty] || [];
            const recordsHTML = records.map(record => `
                <div class="record-item ${difficulty}">
                    <span class="player-name ${record.player}-color">${record.player}</span>
                    <span class="record-time">${this.formatSecondsToTime(record.time)}</span>
                    <span class="record-date">${new Date(record.date).toLocaleDateString()}</span>
                </div>
            `).join('') || '<div class="record-item">No records set yet!</div>';

            return `
                <div class="difficulty-records">
                    <h4>${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</h4>
                    ${recordsHTML}
                </div>
            `;
        }).join('');
    }

    generatePerfectGamesHTML(perfectGames) {
        if (perfectGames.length === 0) {
            return '<div class="record-item">No perfect games recorded yet!</div>';
        }

        return perfectGames.map(entry => {
            const perfectPlayers = ['faidao', 'filip'].filter(player => {
                const totalErrors = (entry[player].errors.easy || 0) +
                                  (entry[player].errors.medium || 0) +
                                  (entry[player].errors.hard || 0);
                return totalErrors === 0;
            });

            return perfectPlayers.map(player => `
                <div class="record-item">
                    <span class="player-name ${player}-color">${player}</span>
                    <span class="record-score">${Math.round(entry[player].scores.total)} pts</span>
                    <span class="record-date">${new Date(entry.date).toLocaleDateString()}</span>
                </div>
            `).join('');
        }).join('');
    }

    showAchievementNotification(achievement) {
        const notification = document.getElementById('achievementNotification');
        const message = document.getElementById('achievementMessage');

        message.textContent = achievement.description;
        notification.classList.add('show');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideAchievementNotification();
        }, 5000);
    }

    hideAchievementNotification() {
        document.getElementById('achievementNotification').classList.remove('show');
    }

    async checkAchievements(entry) {
        // This will be implemented in achievements.js
        if (window.achievementsManager) {
            await window.achievementsManager.checkNewAchievements(entry, this.entries, this.streaks);
        }
    }

    async updateAllPages() {
        await this.updateDashboard();
        this.updateLeaderboards();
        // Other page updates will be handled when those managers are loaded
    }

    // API methods
    async saveToStorage() {
        try {
            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    migrate: true,
                    migrationData: {
                        entries: this.entries,
                        achievements: this.achievements,
                        streaks: this.streaks,
                        challenges: this.challenges
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save data');
            }

            // Clear cache after successful save
            this.cache.data = null;
            this.cache.lastUpdate = null;
        } catch (error) {
            console.error('Failed to save to database:', error);
        }
    }

    async loadFromStorage() {
        try {
            const response = await fetch('/api/entries');
            if (!response.ok) {
                throw new Error('Failed to load entries');
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to load from database:', error);
            return [];
        }
    }

    async saveStreaks() {
        try {
            await fetch('/api/stats', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'streaks',
                    data: this.streaks
                })
            });
        } catch (error) {
            console.error('Failed to save streaks:', error);
        }
    }

    async loadStreaks() {
        try {
            const response = await fetch('/api/stats?type=streaks');
            if (!response.ok) {
                throw new Error('Failed to load streaks');
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to load streaks:', error);
            return null;
        }
    }

    saveRecords() {
        // Records are calculated from entries, no separate storage needed
    }

    loadRecords() {
        // Records are calculated from entries, no separate storage needed
        return null;
    }

    async saveAchievements() {
        try {
            for (const achievement of this.achievements) {
                await fetch('/api/achievements', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(achievement)
                });
            }
        } catch (error) {
            console.error('Failed to save achievements:', error);
        }
    }

    async loadAchievements() {
        try {
            const response = await fetch('/api/achievements');
            if (!response.ok) {
                throw new Error('Failed to load achievements');
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to load achievements:', error);
            // Return empty array as fallback - achievements will still show as locked
            return [];
        }
    }

    async saveChallenges() {
        try {
            for (const challenge of this.challenges) {
                await fetch('/api/stats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: 'challenge',
                        data: challenge
                    })
                });
            }
        } catch (error) {
            console.error('Failed to save challenges:', error);
        }
    }

    async loadChallenges() {
        try {
            const response = await fetch('/api/stats?type=challenges');
            if (!response.ok) {
                throw new Error('Failed to load challenges');
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to load challenges:', error);
            return [];
        }
    }

    async loadBulkData() {
        try {
            // Check cache first
            const now = Date.now();
            if (this.cache.data && this.cache.lastUpdate &&
                (now - this.cache.lastUpdate) < this.cache.duration) {
                console.log('Using cached bulk data');
                return this.cache.data;
            }

            const response = await fetch('/api/stats?type=all');
            if (!response.ok) {
                throw new Error('Failed to load bulk data');
            }

            const data = await response.json();

            // Update cache
            this.cache.data = data;
            this.cache.lastUpdate = now;

            return data;
        } catch (error) {
            console.error('Failed to load bulk data:', error);
            return {
                streaks: { faidao: { current: 0, best: 0 }, filip: { current: 0, best: 0 } },
                challenges: [],
                achievements: []
            };
        }
    }

    async updateTodayProgress() {
        const today = this.getTodayDate();
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        // Try to load progress from database first
        let dbProgress = null;
        try {
            const response = await fetch(`/api/games?date=${today}`);
            if (response.ok) {
                dbProgress = await response.json();
            }
        } catch (error) {
            console.warn('Failed to load progress from database, falling back to localStorage:', error);
        }

        players.forEach(player => {
            difficulties.forEach(difficulty => {
                const progressElement = document.getElementById(`${player}-${difficulty}-progress`);
                if (!progressElement) return;

                const statusElement = progressElement.querySelector('.progress-status');
                let gameData = null;

                // Check database first
                if (dbProgress && dbProgress[player] && dbProgress[player][difficulty]) {
                    gameData = dbProgress[player][difficulty];
                } else {
                    // Fallback to localStorage
                    const key = `completed_${player}_${today}_${difficulty}`;
                    const localData = localStorage.getItem(key);
                    if (localData) {
                        gameData = JSON.parse(localData);
                    }
                }

                if (gameData && gameData.time) {
                    const time = this.formatSecondsToTime(gameData.time);
                    statusElement.innerHTML = `
                        <span class="completed">✓ ${time}</span>
                        <span class="score">${Math.round(gameData.score || 0)}pts</span>
                    `;
                    progressElement.classList.add('completed');
                } else {
                    statusElement.textContent = 'Not started';
                    progressElement.classList.remove('completed');
                }
            });
        });
    }

    updateProgressNotifications() {
        const currentPlayer = sessionStorage.getItem('currentPlayer');
        if (!currentPlayer) return;

        const today = this.getTodayDate();
        const key = `opponent_progress_${currentPlayer}_${today}`;
        const notifications = localStorage.getItem(key);

        const container = document.getElementById('notificationsContainer');
        if (!container) return;

        if (notifications) {
            const notificationList = JSON.parse(notifications);
            const recentNotifications = notificationList
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 5);

            if (recentNotifications.length > 0) {
                container.innerHTML = recentNotifications.map(notification => {
                    const opponent = currentPlayer === 'faidao' ? 'Filip' : 'Faidao';
                    const time = this.formatSecondsToTime(notification.time);
                    const timeAgo = this.getTimeAgo(notification.timestamp);

                    return `
                        <div class="notification-item ${notification.from}">
                            <div class="notification-header">
                                <strong>${opponent}</strong> completed <span class="difficulty">${notification.difficulty}</span>
                                <span class="time-ago">${timeAgo}</span>
                            </div>
                            <div class="notification-details">
                                Time: ${time} | Score: ${notification.score} | Errors: ${notification.errors} | Hints: ${notification.hints}
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                container.innerHTML = '<div class="no-notifications">No recent updates from your opponent.</div>';
            }
        } else {
            container.innerHTML = '<div class="no-notifications">Complete puzzles to see live updates from your opponent!</div>';
        }
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Just now';
        if (minutes === 1) return '1 minute ago';
        if (minutes < 60) return `${minutes} minutes ago`;

        const hours = Math.floor(minutes / 60);
        if (hours === 1) return '1 hour ago';
        if (hours < 24) return `${hours} hours ago`;

        return 'Earlier today';
    }

    // Development helper functions for browser console
    async resetDailyPuzzles(date) {
        const targetDate = date || new Date().toISOString().split('T')[0];

        try {
            console.log(`🔄 Resetting daily puzzles for ${targetDate}...`);

            // Call the puzzle API to reset puzzles for the date
            const response = await fetch('/api/puzzles', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ date: targetDate })
            });

            if (!response.ok) {
                // If DELETE method isn't supported, try using a POST with reset action
                const resetResponse = await fetch('/api/puzzles', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'reset',
                        date: targetDate
                    })
                });

                if (!resetResponse.ok) {
                    throw new Error('Reset API not available - use node reset-daily-puzzles.js instead');
                }
            }

            console.log(`✅ Database reset completed for ${targetDate}`);

            // Clear localStorage for the date
            this.clearLocalStorageForDate(targetDate);

            console.log(`🎯 Successfully reset all puzzles for ${targetDate}`);
            console.log(`💡 Refresh the page to load new puzzles`);

            return true;
        } catch (error) {
            console.error('❌ Failed to reset daily puzzles:', error);
            console.log('💡 Try using: node reset-daily-puzzles.js reset ' + targetDate);
            return false;
        }
    }

    clearLocalStorageForDate(date) {
        const keys = Object.keys(localStorage);
        let cleared = 0;

        keys.forEach(key => {
            if (key.includes(date)) {
                localStorage.removeItem(key);
                cleared++;
                console.log(`🗑️ Cleared: ${key}`);
            }
        });

        console.log(`✅ Cleared ${cleared} localStorage items for ${date}`);
        return cleared;
    }

    async fullReset(date) {
        const targetDate = date || new Date().toISOString().split('T')[0];

        console.log(`🔄 Full reset for ${targetDate}...`);

        // Reset database
        const dbReset = await this.resetDailyPuzzles(targetDate);

        if (dbReset) {
            console.log(`🏁 Full reset completed! Refresh the page to see new puzzles.`);
            return true;
        } else {
            console.log(`❌ Reset failed. Use command line tool instead.`);
            return false;
        }
    }

    // Quick access functions for console
    resetToday() {
        return this.fullReset();
    }

    clearAllLocalStorage() {
        const count = localStorage.length;
        localStorage.clear();
        console.log(`🗑️ Cleared all ${count} localStorage items`);
        console.log(`💡 Refresh the page to reload data`);
        return count;
    }

    // Force complete daily refresh
    forceDailyRefresh() {
        const today = this.getTodayDate();
        console.log(`🔄 Forcing complete refresh for ${today}...`);

        // Clear all cached data
        localStorage.removeItem('lastCheckedDate');
        this.clearTodayProgressFromLocalStorage(today);

        // Clear app caches
        this.puzzleCache.puzzles = null;
        this.puzzleCache.loadTime = null;
        this.cache.data = null;
        this.cache.lastUpdate = null;

        // Reset date detection
        this.lastCheckedDate = null;
        this.currentDate = today;

        // Clear session storage
        sessionStorage.clear();

        console.log(`✅ Complete refresh initiated for ${today}`);
        console.log(`🔄 Reloading page...`);

        // Force page reload
        location.reload(true);
    }

    // Test API connectivity
    async testApiConnectivity() {
        const today = this.getTodayDate();
        console.log(`🔍 Testing API connectivity for ${today}...`);

        const endpoints = [
            `/api/puzzles?date=${today}&t=${Date.now()}`,
            `/api/games?date=${today}`,
            `/api/entries`,
            `/api/stats?type=all`
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`🌐 Testing: ${endpoint}`);
                const response = await fetch(endpoint);
                console.log(`✅ ${endpoint} - Status: ${response.status}`);

                if (endpoint.includes('puzzles')) {
                    const data = await response.json();
                    console.log(`🧩 Puzzle data structure:`, Object.keys(data));
                    if (data.easy && data.easy.puzzle) {
                        console.log(`🎯 Easy puzzle first row:`, data.easy.puzzle[0]);
                    }
                }
            } catch (error) {
                console.error(`❌ ${endpoint} - Error:`, error.message);
            }
        }
    }

    // Puzzle preloading functionality
    async preloadPuzzles() {
        // Don't preload if already loading or recently loaded
        if (this.puzzleCache.loading) {
            console.log('Puzzle preloading already in progress');
            return;
        }

        const now = Date.now();
        if (this.puzzleCache.puzzles && this.puzzleCache.loadTime &&
            (now - this.puzzleCache.loadTime) < 300000) { // 5 minutes cache
            console.log('Using cached puzzles, skipping preload');
            return;
        }

        this.puzzleCache.loading = true;

        try {
            console.log('🧩 Preloading daily puzzles...');
            const today = this.getTodayDate();
            const response = await fetch(`/api/puzzles?date=${today}&t=${Date.now()}`);

            if (response.ok) {
                this.puzzleCache.puzzles = await response.json();
                this.puzzleCache.loadTime = now;
                console.log('✅ Daily puzzles preloaded successfully');

                // Make puzzles globally available
                window.preloadedPuzzles = this.puzzleCache.puzzles;
            } else {
                console.warn('Failed to preload puzzles, will load when needed');
            }
        } catch (error) {
            console.warn('Puzzle preloading failed:', error.message);
        } finally {
            this.puzzleCache.loading = false;
        }
    }

    // Get preloaded puzzles
    getPreloadedPuzzles() {
        return this.puzzleCache.puzzles;
    }

    // Check if puzzles are available
    arePuzzlesPreloaded() {
        return this.puzzleCache.puzzles !== null &&
               this.puzzleCache.loadTime !== null &&
               (Date.now() - this.puzzleCache.loadTime) < 300000; // 5 minutes fresh
    }
}

// Initialize the application
const sudokuApp = new SudokuChampionship();

// Global console helper functions
window.resetPuzzles = (date) => sudokuApp.resetDailyPuzzles(date);
window.resetToday = () => sudokuApp.resetToday();
window.fullReset = (date) => sudokuApp.fullReset(date);
window.clearLocalStorage = () => sudokuApp.clearAllLocalStorage();
window.forceDailyRefresh = () => sudokuApp.forceDailyRefresh();
window.testApi = () => sudokuApp.testApiConnectivity();
window.testPuzzles = () => {
    if (window.sudokuEngine && window.sudokuEngine.dailyPuzzles) {
        console.log('🧩 Current daily puzzles:', window.sudokuEngine.dailyPuzzles);
        Object.keys(window.sudokuEngine.dailyPuzzles).forEach(difficulty => {
            const puzzle = window.sudokuEngine.dailyPuzzles[difficulty];
            if (puzzle && puzzle.puzzle) {
                console.log(`${difficulty}: First row =`, puzzle.puzzle[0]);
            }
        });
    } else {
        console.log('❌ No Sudoku engine or daily puzzles found');
    }
};
window.testDates = () => {
    const now = new Date();
    const utcDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const localISODate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    console.log('📅 Date debugging:');
    console.log('🌍 System timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log('🕐 Current time:', now.toString());
    console.log('🌐 UTC time:', utcDate.toString());
    console.log('📊 ISO local date:', localISODate);
    console.log('📊 ISO UTC date:', now.toISOString().split('T')[0]);
    console.log('⏰ Timezone offset (minutes):', now.getTimezoneOffset());
};