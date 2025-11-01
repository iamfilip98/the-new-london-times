class SudokuChampionship {
    constructor() {
        this.entries = [];
        this.achievements = [];
        this.challenges = [];
        this.streaks = { faidao: { current: 0, best: 0 }, filip: { current: 0, best: 0 } };
        this.records = { faidao: {}, filip: {} };
        this.migrationDone = false;

        // 🚀 PERFORMANCE OPTIMIZATION: Enhanced in-memory data management system
        // Reduces localStorage dependency and provides instant data access
        this.cache = {
            lastUpdate: null,
            duration: 60000, // Extended to 60 seconds cache for better performance
            data: null
        };

        // Today's progress cache with faster refresh
        this.todayProgressCache = {
            lastUpdate: null,
            duration: 5000, // Reduced to 5 seconds for more responsive updates
            data: null,
            date: null
        };

        // Enhanced puzzle preloading cache
        this.puzzleCache = {
            puzzles: null,
            loadTime: null,
            loading: false
        };

        // In-memory data store to minimize localStorage dependency
        this.inMemoryStore = {
            todayProgress: new Map(),
            gameStates: new Map(),
            settings: new Map(),
            notifications: new Map(),
            initialized: false
        };

        // Date change detection - use local date
        this.currentDate = this.getTodayDate();
        this.lastCheckedDate = localStorage.getItem('lastCheckedDate');
        this.initializationComplete = false;

        // Track when we've determined today's battle winner to prevent polling from clearing it
        this.lastCompleteBattleDate = null;

        this.init();
    }

    // In-memory data management methods to reduce localStorage dependency
    initializeInMemoryStore() {
        if (this.inMemoryStore.initialized) return;


        // Initialize in-memory storage
        this.inMemoryStore.todayProgress.clear();
        this.inMemoryStore.gameStates.clear();
        this.inMemoryStore.settings.clear();
        this.inMemoryStore.notifications.clear();

        this.inMemoryStore.initialized = true;
    }

    // Get data from in-memory store first, fallback to localStorage
    getStoredData(category, key, fallbackToLocalStorage = true) {
        const memoryStore = this.inMemoryStore[category];
        if (memoryStore && memoryStore.has(key)) {
            return memoryStore.get(key);
        }

        if (fallbackToLocalStorage) {
            const localData = localStorage.getItem(key);
            if (localData) {
                try {
                    const parsed = JSON.parse(localData);
                    // Cache in memory for next time
                    if (memoryStore) {
                        memoryStore.set(key, parsed);
                    }
                    return parsed;
                } catch (error) {
                    return null;
                }
            }
        }

        return null;
    }

    // Store data in memory and optionally in localStorage
    setStoredData(category, key, data, persistToLocalStorage = false) {
        const memoryStore = this.inMemoryStore[category];
        if (memoryStore) {
            memoryStore.set(key, data);
        }

        if (persistToLocalStorage) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
            } catch (error) {
            }
        }
    }

    // Clear data from both memory and localStorage
    clearStoredData(category, key = null) {
        const memoryStore = this.inMemoryStore[category];
        if (key) {
            if (memoryStore) {
                memoryStore.delete(key);
            }
            localStorage.removeItem(key);
        } else {
            if (memoryStore) {
                memoryStore.clear();
            }
            // Clear all localStorage keys for this category
            const keys = Object.keys(localStorage);
            keys.forEach(lsKey => {
                if (lsKey.includes(category)) {
                    localStorage.removeItem(lsKey);
                }
            });
        }
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
        const initStart = performance.now();

        // Scroll to top on page load/refresh
        window.scrollTo(0, 0);

        // Initialize in-memory data store for optimal performance
        this.initializeInMemoryStore();

        // Check if date has changed and handle new day logic
        await this.checkDateChange();

        this.setupEventListeners();
        this.setupNavigation();
        this.setupLeaderboardTabs();
        this.setCurrentDate();
        this.initializeScoreDisplay();

        // Preload puzzles in background for instant loading
        setTimeout(() => this.preloadPuzzles(), 10);

        // Load data from database or migrate from localStorage
        await this.loadData();

        await this.updateDashboard();
        await this.updateAllPages();

        // Set up automatic date checking every minute
        this.startDateChangeMonitoring();

        // Set up live progress polling for real-time battle updates
        this.startLiveProgressPolling();

        // Mark initialization as complete
        this.initializationComplete = true;

        const initEnd = performance.now();
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

                // Scroll to appropriate position when switching
                targetPageElement.scrollTop = 0;

                if (targetPage === 'sudoku') {
                    // For Sudoku page, scroll to center the puzzle
                    setTimeout(() => {
                        const sudokuGrid = document.querySelector('.sudoku-grid');
                        if (sudokuGrid) {
                            sudokuGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        } else {
                            // Fallback if grid not found yet
                            window.scrollTo(0, 0);
                        }
                    }, 100); // Small delay to ensure content is rendered
                } else {
                    // For all other pages, scroll to top
                    window.scrollTo(0, 0);
                }

                // Update page content
                await this.updatePageContent(targetPage);

                // If navigating to dashboard, refresh today's progress
                if (targetPage === 'dashboard') {
                    await this.updateTodayProgress();
                }
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

            // Clear today's progress from localStorage for fresh start
            this.clearTodayProgressFromLocalStorage(today);

            // Clear puzzle cache to force new puzzle generation
            this.puzzleCache.puzzles = null;
            this.puzzleCache.loadTime = null;

            // Clear general cache to force data refresh
            this.cache.data = null;
            this.cache.lastUpdate = null;

            // Clear today's progress cache
            this.todayProgressCache.data = null;
            this.todayProgressCache.lastUpdate = null;
            this.todayProgressCache.date = null;

            // Update the stored date
            localStorage.setItem('lastCheckedDate', today);
            this.lastCheckedDate = today;
            this.currentDate = today;

            // Refresh the date display
            this.setCurrentDate();

            // If initialization is complete, refresh data
            if (this.initializationComplete) {

                // Preload fresh puzzles
                await this.preloadPuzzles();

                // Refresh dashboard data
                await this.updateDashboard();

                // Update all page content
                await this.updateAllPages();
            }

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

    startLiveProgressPolling() {
        // Poll for live progress updates every 15 seconds for real-time battle updates
        setInterval(async () => {
            if (this.initializationComplete) {
                // Only poll if we're on the dashboard page or if initialization is complete
                const dashboardPage = document.getElementById('dashboard');
                if (dashboardPage && dashboardPage.classList.contains('active')) {
                    // Invalidate cache and update progress for live updates
                    this.todayProgressCache.data = null;
                    this.todayProgressCache.lastUpdate = null;
                    this.todayProgressCache.date = null;

                    await this.updateTodayProgress();
                }
            }
        }, 15000); // 15 seconds for live battle updates

        // Also check immediately when page becomes visible (user returns to tab)
        document.addEventListener('visibilitychange', async () => {
            if (!document.hidden && this.initializationComplete) {
                const dashboardPage = document.getElementById('dashboard');
                if (dashboardPage && dashboardPage.classList.contains('active')) {
                    // Force refresh when user returns to tab
                    this.todayProgressCache.data = null;
                    this.todayProgressCache.lastUpdate = null;
                    this.todayProgressCache.date = null;

                    await this.updateTodayProgress();
                }
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
        return ['faidao', 'filip'].every(player => {
            if (!entry[player] || !entry[player].times) return false;

            return ['easy', 'medium', 'hard'].every(difficulty => {
                const time = entry[player].times[difficulty];
                const dnf = entry[player].dnf?.[difficulty] || false;

                // Complete if either DNF'd or has a time
                return dnf || time !== null;
            });
        });
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
        } else if (filipTotal > faidaoTotal && filipTotal > 0) {
            winner = 'filip';
            winnerText = '🏆 Filip Wins!';
        } else {
            winnerText = "It's a tie!";
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

            }

            // Check for comprehensive preloaded data first for optimal performance
            const comprehensivePreload = sessionStorage.getItem('comprehensivePreload');
            let entries, bulkData, achievements, challenges, todayGames;

            if (comprehensivePreload) {
                const preloadedData = JSON.parse(comprehensivePreload);

                // Extract all preloaded data
                entries = preloadedData.entries || [];
                bulkData = preloadedData.bulkData || {};
                achievements = preloadedData.achievements || [];
                challenges = preloadedData.challenges || [];
                todayGames = preloadedData.todayGames || {};

                // Update today's progress cache with preloaded data
                if (todayGames && Object.keys(todayGames).length > 0) {
                    this.todayProgressCache.data = todayGames;
                    this.todayProgressCache.lastUpdate = preloadedData.loadTime;
                    this.todayProgressCache.date = preloadedData.date;
                }

                // Clear comprehensive preload to free memory
                sessionStorage.removeItem('comprehensivePreload');

                // Also use bulkData for achievements and challenges if available
                if (!bulkData.achievements && achievements.length > 0) {
                    bulkData.achievements = achievements;
                }
                if (!bulkData.challenges && challenges.length > 0) {
                    bulkData.challenges = challenges;
                }

            } else {
                // Fallback: check for individual preloaded data
                const preloadedEntries = sessionStorage.getItem('preloadedEntries');
                const preloadedBulkData = sessionStorage.getItem('preloadedBulkData');

                if (preloadedEntries && preloadedBulkData) {
                    entries = JSON.parse(preloadedEntries);
                    bulkData = JSON.parse(preloadedBulkData);

                    // Clear the preloaded data to free memory
                    sessionStorage.removeItem('preloadedEntries');
                    sessionStorage.removeItem('preloadedBulkData');
                } else {
                    // Load data from database - optimized with parallel loading
                    [entries, bulkData] = await Promise.all([
                        this.loadFromStorage(),
                        this.loadBulkData()
                    ]);
                }
            }

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
                    // Add null/undefined checks to prevent errors
                    if (!entry[player] || !entry[player].times || !entry[player].errors || !entry[player].dnf) {
                        return; // Skip this entry if data is incomplete
                    }

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
            // Safety check for scores
            if (!entry.faidao?.scores || !entry.filip?.scores) {
                return;
            }

            const faidaoTotal = entry.faidao.scores.total || 0;
            const filipTotal = entry.filip.scores.total || 0;

            const faidaoWon = faidaoTotal > filipTotal;
            const filipWon = filipTotal > faidaoTotal;

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
            // Safety check for scores property
            if (!entry.faidao?.scores || !entry.filip?.scores) {
                return;
            }

            const faidaoTotal = entry.faidao.scores.total || 0;
            const filipTotal = entry.filip.scores.total || 0;

            if (faidaoTotal > filipTotal) {
                faidaoWins++;
            } else if (filipTotal > faidaoTotal) {
                filipWins++;
            }
        });

        document.getElementById('overallRecord').textContent = `${faidaoWins} - ${filipWins}`;

        // Update mobile head-to-head section on dashboard
        const mobileScoreFaidao = document.getElementById('mobileScoreFaidao');
        const mobileScoreFilip = document.getElementById('mobileScoreFilip');
        const mobileOverallRecord = document.getElementById('mobileOverallRecord');

        if (mobileScoreFaidao) mobileScoreFaidao.textContent = faidaoWins;
        if (mobileScoreFilip) mobileScoreFilip.textContent = filipWins;

        // Determine current streak leader and format display text
        const faidaoStreak = this.streaks.faidao?.current || 0;
        const filipStreak = this.streaks.filip?.current || 0;
        let mobileText = '';

        if (faidaoStreak > 0) {
            mobileText = `Faidao on a ${faidaoStreak} streak`;
        } else if (filipStreak > 0) {
            mobileText = `Filip on a ${filipStreak} streak`;
        } else {
            mobileText = `${faidaoWins} - ${filipWins}`;
        }

        // Update mobile overall record with animation to prevent jarring changes
        if (mobileOverallRecord) {
            if (mobileOverallRecord.textContent !== mobileText) {
                mobileOverallRecord.style.opacity = '0.6';
                setTimeout(() => {
                    mobileOverallRecord.textContent = mobileText;
                    mobileOverallRecord.style.opacity = '1';
                }, 50);
            }
        }

        // Update mobile head-to-head section on achievements page
        const achievementsMobileScoreFaidao = document.getElementById('achievementsMobileScoreFaidao');
        const achievementsMobileScoreFilip = document.getElementById('achievementsMobileScoreFilip');
        const achievementsMobileOverallRecord = document.getElementById('achievementsMobileOverallRecord');

        if (achievementsMobileScoreFaidao) achievementsMobileScoreFaidao.textContent = faidaoWins;
        if (achievementsMobileScoreFilip) achievementsMobileScoreFilip.textContent = filipWins;

        // Update achievements mobile overall record with same animation
        if (achievementsMobileOverallRecord) {
            if (achievementsMobileOverallRecord.textContent !== mobileText) {
                achievementsMobileOverallRecord.style.opacity = '0.6';
                setTimeout(() => {
                    achievementsMobileOverallRecord.textContent = mobileText;
                    achievementsMobileOverallRecord.style.opacity = '1';
                }, 50);
            }
        }
    }

    updateRecentHistory() {
        const historyContainer = document.getElementById('historyCards');
        if (!historyContainer) return;

        const recentEntries = this.entries.slice(0, 5); // Show last 5 entries

        if (recentEntries.length === 0) {
            historyContainer.innerHTML = '<div class="no-history">No battles recorded yet. Start competing!</div>';
            return;
        }

        historyContainer.innerHTML = recentEntries.map(entry => {
            // Check if entry has valid structure
            if (!entry.faidao || !entry.filip || !entry.faidao.scores || !entry.filip.scores) {
                return '';
            }

            // Check if entry is complete
            const isComplete = this.isEntryComplete(entry);

            const faidaoTotal = entry.faidao.scores.total || 0;
            const filipTotal = entry.filip.scores.total || 0;

            const winner = isComplete
                ? (faidaoTotal > filipTotal ? 'Faidao' :
                   filipTotal > faidaoTotal ? 'Filip' : 'Tie')
                : 'Incomplete';

            return `
                <div class="history-card">
                    <div class="history-date">${new Date(entry.date).toLocaleDateString()}</div>
                    <div class="history-scores">
                        <div class="history-score">
                            <div class="player-name">Faidao</div>
                            <div class="score-value">${faidaoTotal.toFixed(0)}</div>
                        </div>
                        <div class="score-vs">VS</div>
                        <div class="history-score">
                            <div class="player-name">Filip</div>
                            <div class="score-value">${filipTotal.toFixed(0)}</div>
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
                    .filter(entry => {
                        // Safety check for valid entry structure
                        return entry[player] &&
                               entry[player].dnf &&
                               entry[player].times &&
                               !entry[player].dnf[difficulty] &&
                               entry[player].times[difficulty];
                    })
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
                // Safety check for valid entry structure
                if (!entry[player] || !entry[player].errors) {
                    return false;
                }
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
            // Safety check for valid entry structure
            if (!entry.faidao?.scores || !entry.filip?.scores) {
                return;
            }

            const faidaoTotal = entry.faidao.scores.total || 0;
            const filipTotal = entry.filip.scores.total || 0;

            stats.faidao.totalScore += faidaoTotal;
            stats.filip.totalScore += filipTotal;

            if (faidaoTotal > filipTotal) {
                stats.faidao.wins++;
            } else if (filipTotal > faidaoTotal) {
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
                // Safety check for valid entry structure
                if (!entry[player] || !entry[player].errors) {
                    return false;
                }
                const totalErrors = (entry[player].errors.easy || 0) +
                                  (entry[player].errors.medium || 0) +
                                  (entry[player].errors.hard || 0);
                return totalErrors === 0;
            });

            return perfectPlayers.map(player => {
                // Safety check for scores
                const score = entry[player]?.scores?.total || 0;
                return `
                    <div class="record-item">
                        <span class="player-name ${player}-color">${player}</span>
                        <span class="record-score">${Math.round(score)} pts</span>
                        <span class="record-date">${new Date(entry.date).toLocaleDateString()}</span>
                    </div>
                `;
            }).join('');
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


        // Check cache first
        const now = Date.now();
        if (this.todayProgressCache.data &&
            this.todayProgressCache.lastUpdate &&
            this.todayProgressCache.date === today &&
            (now - this.todayProgressCache.lastUpdate) < this.todayProgressCache.duration) {
            // Use cached data
            const dbProgress = this.todayProgressCache.data;
            this.renderTodayProgress(dbProgress, players, difficulties, today);
            return;
        }

        // Try to load progress from database first
        let dbProgress = null;
        try {
            // Force no-cache to ensure real-time battle updates across players
            const response = await fetch(`/api/games?date=${today}`, {
                cache: 'no-store'
            });
            if (response.ok) {
                dbProgress = await response.json();

                // Update cache
                this.todayProgressCache.data = dbProgress;
                this.todayProgressCache.lastUpdate = now;
                this.todayProgressCache.date = today;
            } else {
            }
        } catch (error) {
        }

        // Always render, even if dbProgress is null (will check localStorage fallback)
        this.renderTodayProgress(dbProgress, players, difficulties, today);
    }


    renderTodayProgress(dbProgress, players, difficulties, today) {
        players.forEach(player => {
            difficulties.forEach(difficulty => {
                const progressElement = document.getElementById(`${player}-${difficulty}-progress`);
                if (!progressElement) {
                    return;
                }

                const statusElement = progressElement.querySelector('.progress-status');
                if (!statusElement) {
                    return;
                }

                let gameData = null;

                // Check database first
                if (dbProgress && dbProgress[player] && dbProgress[player][difficulty]) {
                    gameData = dbProgress[player][difficulty];
                    // Cache in memory for fast access
                    const progressKey = `${player}_${today}_${difficulty}`;
                    this.setStoredData('todayProgress', progressKey, gameData, false);
                } else {
                    // Check in-memory store first, then localStorage
                    const progressKey = `${player}_${today}_${difficulty}`;
                    gameData = this.getStoredData('todayProgress', `completed_${progressKey}`, true);
                }

                if (gameData && gameData.time) {
                    const time = this.formatSecondsToTime(gameData.time);
                    statusElement.innerHTML = `
                        <span class="completion-time">✓ ${time}</span>
                        <span class="completion-score">${Math.round(gameData.score || 0)}pts</span>
                    `;
                    progressElement.classList.add('completed');
                } else {
                    statusElement.textContent = 'Not started';
                    progressElement.classList.remove('completed');
                }
            });
        });

        // Update battle results based on today's completed games
        this.updateTodaysBattleResults();
    }

    updateTodaysBattleResults() {
        const today = this.getTodayDate();
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        // Calculate total scores for today and count completed games
        const todayScores = {
            faidao: { total: 0 },
            filip: { total: 0 }
        };

        let completedGames = 0;
        const totalGamesRequired = players.length * difficulties.length; // 6 games total

        players.forEach(player => {
            difficulties.forEach(difficulty => {
                let gameData = null;

                // Check database cache first (prioritize database data)
                if (this.todayProgressCache.data &&
                    this.todayProgressCache.data[player] &&
                    this.todayProgressCache.data[player][difficulty]) {
                    gameData = this.todayProgressCache.data[player][difficulty];
                } else {
                    // Fallback to sessionStorage (session-only cache, no stale data)
                    const key = `completed_${player}_${today}_${difficulty}`;
                    const sessionData = sessionStorage.getItem(key);
                    if (sessionData) {
                        gameData = JSON.parse(sessionData);
                    }
                }

                if (gameData && gameData.score) {
                    todayScores[player].total += Number(gameData.score) || 0;
                    completedGames++;
                }
            });
        });

        // Only show winner if all 6 games are completed
        if (completedGames === totalGamesRequired) {
            // Update the battle results display
            this.updateBattleResults(todayScores);
            // Mark that we have a complete battle for today
            this.lastCompleteBattleDate = today;
        } else {
            // Only update to incomplete state if we haven't marked today's battle as complete
            if (this.lastCompleteBattleDate !== today) {
                const winnerElement = document.getElementById('winnerAnnouncement');
                if (winnerElement) {
                    winnerElement.querySelector('.winner-text').textContent = 'Play Sudoku to compete!';
                }
            }

            // Still update score bars to show progress
            const faidaoBar = document.getElementById('faidaoScoreBar');
            const filipBar = document.getElementById('filipScoreBar');
            const faidaoText = document.getElementById('faidaoScoreText');
            const filipText = document.getElementById('filipScoreText');

            if (faidaoBar && filipBar && faidaoText && filipText) {
                const faidaoTotal = Number(todayScores.faidao.total) || 0;
                const filipTotal = Number(todayScores.filip.total) || 0;
                const maxScore = Math.max(faidaoTotal, filipTotal, 1);
                const faidaoWidth = (faidaoTotal / maxScore) * 100;
                const filipWidth = (filipTotal / maxScore) * 100;

                faidaoBar.style.width = `${faidaoWidth}%`;
                filipBar.style.width = `${filipWidth}%`;
                faidaoText.textContent = faidaoTotal.toFixed(0);
                filipText.textContent = filipTotal.toFixed(0);
            }
        }
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


            // Clear localStorage for the date
            this.clearLocalStorageForDate(targetDate);


            return true;
        } catch (error) {
            console.error('❌ Failed to reset daily puzzles:', error);
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
            }
        });

        return cleared;
    }

    async fullReset(date) {
        const targetDate = date || new Date().toISOString().split('T')[0];


        // Reset database
        const dbReset = await this.resetDailyPuzzles(targetDate);

        if (dbReset) {
            return true;
        } else {
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
        return count;
    }

    // Force complete daily refresh
    forceDailyRefresh() {
        const today = this.getTodayDate();

        // Clear all cached data
        localStorage.removeItem('lastCheckedDate');
        this.clearTodayProgressFromLocalStorage(today);

        // Clear app caches
        this.puzzleCache.puzzles = null;
        this.puzzleCache.loadTime = null;
        this.cache.data = null;
        this.cache.lastUpdate = null;
        this.todayProgressCache.data = null;
        this.todayProgressCache.lastUpdate = null;
        this.todayProgressCache.date = null;

        // Reset date detection
        this.lastCheckedDate = null;
        this.currentDate = today;

        // Clear session storage
        sessionStorage.clear();


        // Force page reload
        location.reload(true);
    }

    // Test API connectivity
    async testApiConnectivity() {
        const today = this.getTodayDate();

        const endpoints = [
            `/api/puzzles?date=${today}&t=${Date.now()}`,
            `/api/games?date=${today}`,
            `/api/entries`,
            `/api/stats?type=all`
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);

                if (endpoint.includes('puzzles')) {
                    const data = await response.json();
                    if (data.easy && data.easy.puzzle) {
                    }
                }
            } catch (error) {
                console.error(`❌ ${endpoint} - Error:`, error.message);
            }
        }
    }

    // Puzzle preloading functionality
    async preloadPuzzles() {
        // Check for preloaded puzzles from login page first
        const preloadedPuzzles = sessionStorage.getItem('preloadedPuzzles');
        const puzzlesLoadTime = sessionStorage.getItem('puzzlesLoadTime');

        if (preloadedPuzzles && puzzlesLoadTime) {
            const loadTime = parseInt(puzzlesLoadTime);
            const now = Date.now();

            // Use preloaded data if it's recent (within 5 minutes)
            if ((now - loadTime) < 300000) {
                this.puzzleCache.puzzles = JSON.parse(preloadedPuzzles);
                this.puzzleCache.loadTime = loadTime;

                // Make puzzles globally available
                window.preloadedPuzzles = this.puzzleCache.puzzles;

                // Clear from sessionStorage to free memory
                sessionStorage.removeItem('preloadedPuzzles');
                sessionStorage.removeItem('puzzlesLoadTime');
                return;
            } else {
                // Clear stale data
                sessionStorage.removeItem('preloadedPuzzles');
                sessionStorage.removeItem('puzzlesLoadTime');
            }
        }

        // Don't preload if already loading or recently loaded
        if (this.puzzleCache.loading) {
            return;
        }

        const now = Date.now();
        if (this.puzzleCache.puzzles && this.puzzleCache.loadTime &&
            (now - this.puzzleCache.loadTime) < 300000) { // 5 minutes cache
            return;
        }

        this.puzzleCache.loading = true;

        try {
            const today = this.getTodayDate();
            const response = await fetch(`/api/puzzles?date=${today}&t=${Date.now()}`);

            if (response.ok) {
                this.puzzleCache.puzzles = await response.json();
                this.puzzleCache.loadTime = now;

                // Make puzzles globally available
                window.preloadedPuzzles = this.puzzleCache.puzzles;
            } else {
            }
        } catch (error) {
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

    // Switch to a specific page (for navigation from completion notifications)
    async switchPage(targetPage) {
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.page');

        // Update active nav link
        navLinks.forEach(l => l.classList.remove('active'));
        const targetNavLink = document.querySelector(`.nav-link[data-page="${targetPage}"]`);
        if (targetNavLink) {
            targetNavLink.classList.add('active');
        }

        // Update active page
        pages.forEach(page => page.classList.remove('active'));
        const targetPageElement = document.getElementById(targetPage);
        if (targetPageElement) {
            targetPageElement.classList.add('active');

            // Scroll to appropriate position when switching
            targetPageElement.scrollTop = 0;

            if (targetPage === 'sudoku') {
                // For Sudoku page, scroll to center the puzzle
                setTimeout(() => {
                    const sudokuGrid = document.querySelector('.sudoku-grid');
                    if (sudokuGrid) {
                        sudokuGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else {
                        // Fallback if grid not found yet
                        window.scrollTo(0, 0);
                    }
                }, 100); // Small delay to ensure content is rendered
            } else {
                // For all other pages, scroll to top
                window.scrollTo(0, 0);
            }

            // Update page content
            await this.updatePageContent(targetPage);

            // If navigating to dashboard, refresh today's progress
            if (targetPage === 'dashboard') {
                await this.updateTodayProgress();
            }
        }
    }
}

// UI Utility Functions
class UIHelpers {
    static showToast(message, type = 'info', title = null, duration = 5000) {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle'
        };

        const titles = {
            info: title || 'Info',
            success: title || 'Success',
            error: title || 'Error',
            warning: title || 'Warning'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Close notification">&times;</button>
        `;

        document.body.appendChild(toast);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);

        return toast;
    }

    static showLoading(container, message = 'Loading...') {
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }

        if (!container) return null;

        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;

        return container;
    }

    static showError(container, title = 'Something went wrong', message = 'Please try again later', onRetry = null) {
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }

        if (!container) return null;

        const retryButton = onRetry ? `
            <div class="error-actions">
                <button class="retry-btn" id="errorRetryBtn">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        ` : '';

        container.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle error-icon"></i>
                <div class="error-title">${title}</div>
                <div class="error-message">${message}</div>
                ${retryButton}
            </div>
        `;

        if (onRetry) {
            const btn = container.querySelector('#errorRetryBtn');
            if (btn) {
                btn.addEventListener('click', onRetry);
            }
        }

        return container;
    }

    static showSkeletonCards(container, count = 3) {
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }

        if (!container) return null;

        const skeletons = Array.from({ length: count }, () =>
            '<div class="skeleton skeleton-card"></div>'
        ).join('');

        container.innerHTML = skeletons;
        return container;
    }
}

// Make UI helpers globally available
window.UIHelpers = UIHelpers;

// Initialize the application
const sudokuApp = new SudokuChampionship();

// Make sudokuApp globally available
window.sudokuApp = sudokuApp;

// Global console helper functions
window.resetPuzzles = (date) => sudokuApp.resetDailyPuzzles(date);
window.resetToday = () => sudokuApp.resetToday();
window.fullReset = (date) => sudokuApp.fullReset(date);
window.clearLocalStorage = () => sudokuApp.clearAllLocalStorage();
window.forceDailyRefresh = () => sudokuApp.forceDailyRefresh();
window.testApi = () => sudokuApp.testApiConnectivity();
window.testPuzzles = () => {
    if (window.sudokuEngine && window.sudokuEngine.dailyPuzzles) {
        Object.keys(window.sudokuEngine.dailyPuzzles).forEach(difficulty => {
            const puzzle = window.sudokuEngine.dailyPuzzles[difficulty];
            if (puzzle && puzzle.puzzle) {
            }
        });
    } else {
    }
};
window.testDates = () => {
    const now = new Date();
    const utcDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const localISODate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];

};