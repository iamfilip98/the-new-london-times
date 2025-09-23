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
        this.setupEventListeners();
        this.setupNavigation();
        this.setupLeaderboardTabs();
        this.setCurrentDate();
        this.initializeScoreDisplay();
        this.updateScores(); // Initialize scores immediately

        // Load data from database or migrate from localStorage
        await this.loadData();

        this.updateDashboard();
        this.updateAllPages();
    }

    initializeScoreDisplay() {
        // Set all scores to 0 initially
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        players.forEach(player => {
            difficulties.forEach(difficulty => {
                const scoreElement = document.getElementById(`${player}-${difficulty}-score`);
                if (scoreElement) scoreElement.textContent = '0';
            });
            const totalElement = document.getElementById(`${player}-total`);
            if (totalElement) totalElement.textContent = '0';
        });

        // Initialize battle results
        const winnerElement = document.getElementById('winnerAnnouncement');
        if (winnerElement) {
            winnerElement.querySelector('.winner-text').textContent = 'Enter scores to see winner!';
        }
    }

    setupEventListeners() {
        // Date input
        document.getElementById('entryDate').addEventListener('change', () => {
            this.checkExistingEntry();
        });

        // Time and error inputs
        const timeInputs = document.querySelectorAll('.time-input');
        const errorInputs = document.querySelectorAll('.error-input');
        const dnfCheckboxes = document.querySelectorAll('.dnf-checkbox');

        timeInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.handleTimeInput(e.target);
                this.updateScores();
            });

            // Clear selection when focused for easy retyping
            input.addEventListener('focus', (e) => {
                // Select all text for easy replacement
                setTimeout(() => {
                    e.target.select();
                }, 0);
            });

            // Also format on blur to catch any missed formatting
            input.addEventListener('blur', (e) => {
                this.formatTimeInput(e.target);
                this.updateScores();
            });

            // Handle key events for better UX
            input.addEventListener('keydown', (e) => {
                // Allow easy clearing with Delete/Backspace when all text is selected
                if ((e.key === 'Delete' || e.key === 'Backspace') &&
                    e.target.selectionStart === 0 &&
                    e.target.selectionEnd === e.target.value.length) {
                    e.target.value = '';
                    e.target.dataset.rawValue = '';
                    this.updateScores();
                    e.preventDefault();
                }
            });
        });

        errorInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateScores();
            });

            // Also update on blur
            input.addEventListener('blur', () => {
                this.updateScores();
            });
        });

        dnfCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.toggleInputs(checkbox);
                this.updateScores();
            });
        });

        // Action buttons
        document.getElementById('saveEntry').addEventListener('click', () => {
            this.saveEntry();
        });

        document.getElementById('clearEntry').addEventListener('click', () => {
            this.clearEntry();
        });

        // Achievement notification close
        document.querySelector('.achievement-close').addEventListener('click', () => {
            this.hideAchievementNotification();
        });
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
                document.getElementById(targetPage).classList.add('active');

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
                }
            });
        });
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('entryDate').value = today;
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    handleTimeInput(input) {
        let value = input.value;

        // Strip everything except numbers to get raw input
        const rawNumbers = value.replace(/[^0-9]/g, '');

        // Store raw numbers for calculation purposes
        input.dataset.rawValue = rawNumbers;

        // Format and display
        this.formatTimeInput(input);
    }

    formatTimeInput(input) {
        // Use stored raw value if available, otherwise extract from current value
        let value = input.dataset.rawValue || input.value.replace(/[^0-9]/g, '');

        if (value.length === 0) {
            input.value = '';
            input.dataset.rawValue = '';
            return;
        }

        // Convert raw numbers to MM:SS format and set cursor position
        let newCursorPos = input.value.length;

        if (value.length === 1) {
            // Single digit: 5 → 0:05
            input.value = `0:0${value}`;
            newCursorPos = 4;
        } else if (value.length === 2) {
            // Two digits: 45 → 0:45
            input.value = `0:${value}`;
            newCursorPos = 4;
        } else if (value.length === 3) {
            // Three digits: 222 → 2:22, 345 → 3:45
            const minutes = parseInt(value[0]);
            const seconds = value.substring(1);

            // Validate seconds don't exceed 59
            const sec = parseInt(seconds);
            if (sec >= 60) {
                // Convert overflow: 555 (5:55) → 9:35 (5*60 + 55 = 355 seconds)
                const totalSeconds = minutes * 60 + sec;
                const finalMinutes = Math.floor(totalSeconds / 60);
                const finalSecs = totalSeconds % 60;
                input.value = `${finalMinutes}:${finalSecs.toString().padStart(2, '0')}`;
            } else {
                input.value = `${minutes}:${seconds}`;
            }
            newCursorPos = input.value.length;
        } else if (value.length >= 4) {
            // Four or more digits: 1234 → 12:34
            const minutes = parseInt(value.substring(0, value.length - 2));
            const seconds = value.substring(value.length - 2);

            // Handle seconds overflow
            const sec = parseInt(seconds);

            if (sec >= 60) {
                const totalSeconds = minutes * 60 + sec;
                const finalMinutes = Math.floor(totalSeconds / 60);
                const finalSecs = totalSeconds % 60;
                input.value = `${finalMinutes}:${finalSecs.toString().padStart(2, '0')}`;
            } else {
                input.value = `${minutes}:${seconds}`;
            }
            newCursorPos = input.value.length;
        }

        // Set cursor to end to prevent insertion at beginning
        setTimeout(() => {
            input.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    }

    toggleInputs(checkbox) {
        const card = checkbox.closest('.difficulty-card');
        const timeInput = card.querySelector('.time-input');
        const errorInput = card.querySelector('.error-input');

        if (checkbox.checked) {
            timeInput.disabled = true;
            timeInput.value = '';
            timeInput.style.opacity = '0.5';
            errorInput.disabled = true;
            errorInput.value = '';
            errorInput.style.opacity = '0.5';
        } else {
            timeInput.disabled = false;
            timeInput.style.opacity = '1';
            errorInput.disabled = false;
            errorInput.style.opacity = '1';
        }
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

    calculateScores() {
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];
        const multipliers = { easy: 1, medium: 1.5, hard: 2 };
        const scores = { faidao: {}, filip: {} };
        const playerData = {};

        // Get input data
        players.forEach(player => {
            playerData[player] = {};
            let totalScore = 0;

            difficulties.forEach(difficulty => {
                const timeInput = document.getElementById(`${player}-${difficulty}-time`);
                const errorInput = document.getElementById(`${player}-${difficulty}-errors`);
                const dnfCheckbox = document.getElementById(`${player}-${difficulty}-dnf`);

                const time = this.parseTimeToSeconds(timeInput.value);
                const errors = parseInt(errorInput.value) || 0;
                const dnf = dnfCheckbox.checked;

                let score = 0;

                if (!dnf && time !== null) {
                    // Add error penalty (30 seconds per error)
                    const adjustedTime = time + (errors * 30);
                    const adjustedMinutes = adjustedTime / 60;

                    // Calculate score: (1000 ÷ minutes) × multiplier
                    score = (1000 / adjustedMinutes) * multipliers[difficulty];
                    score = Math.round(score * 100) / 100;
                }

                playerData[player][difficulty] = { time, errors, dnf, score };
                scores[player][difficulty] = score;
                totalScore += score;

                // Update difficulty score display
                document.getElementById(`${player}-${difficulty}-score`).textContent = score.toFixed(0);
            });

            scores[player].total = Math.round(totalScore * 100) / 100;

            // Update total score display
            document.getElementById(`${player}-total`).textContent = scores[player].total.toFixed(0);
        });

        // Update battle results
        this.updateBattleResults(scores);

        return { scores, playerData };
    }

    updateScores() {
        const { scores } = this.calculateScores();

        // Trigger score update animation
        document.querySelectorAll('.difficulty-score, .total-value').forEach(el => {
            el.style.animation = 'none';
            el.offsetHeight; // Trigger reflow
            el.style.animation = 'scoreUpdate 0.5s ease-in-out';
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
        const date = document.getElementById('entryDate').value;
        if (!date) {
            alert('Please select a date');
            return;
        }

        const { scores, playerData } = this.calculateScores();

        // Check if any data was entered
        const hasData = Object.values(playerData).some(player =>
            Object.values(player).some(difficulty =>
                difficulty.dnf || difficulty.time !== null
            )
        );

        if (!hasData) {
            alert('Please enter at least one time or mark as DNF');
            return;
        }

        // Check if all 6 times are submitted (3 per player)
        const allTimesSubmitted = ['faidao', 'filip'].every(player =>
            ['easy', 'medium', 'hard'].every(difficulty =>
                playerData[player][difficulty].dnf || playerData[player][difficulty].time !== null
            )
        );

        // Create entry
        const entry = {
            date,
            faidao: {
                times: {
                    easy: playerData.faidao.easy.time,
                    medium: playerData.faidao.medium.time,
                    hard: playerData.faidao.hard.time
                },
                errors: {
                    easy: playerData.faidao.easy.errors,
                    medium: playerData.faidao.medium.errors,
                    hard: playerData.faidao.hard.errors
                },
                dnf: {
                    easy: playerData.faidao.easy.dnf,
                    medium: playerData.faidao.medium.dnf,
                    hard: playerData.faidao.hard.dnf
                },
                scores: {
                    easy: scores.faidao.easy,
                    medium: scores.faidao.medium,
                    hard: scores.faidao.hard,
                    total: scores.faidao.total
                }
            },
            filip: {
                times: {
                    easy: playerData.filip.easy.time,
                    medium: playerData.filip.medium.time,
                    hard: playerData.filip.hard.time
                },
                errors: {
                    easy: playerData.filip.easy.errors,
                    medium: playerData.filip.medium.errors,
                    hard: playerData.filip.hard.errors
                },
                dnf: {
                    easy: playerData.filip.easy.dnf,
                    medium: playerData.filip.medium.dnf,
                    hard: playerData.filip.hard.dnf
                },
                scores: {
                    easy: scores.filip.easy,
                    medium: scores.filip.medium,
                    hard: scores.filip.hard,
                    total: scores.filip.total
                }
            }
        };

        try {
            // Save to database
            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date,
                    faidao: entry.faidao,
                    filip: entry.filip
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save entry');
            }

            // Update local data
            this.entries = this.entries.filter(e => e.date !== date);
            this.entries.push(entry);
            this.entries.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Only calculate head-to-head scores and achievements when all 6 times are submitted
            if (allTimesSubmitted) {
                // Update streaks
                await this.updateStreaks();

                // Check for achievements
                await this.checkAchievements(entry);
            }

            // Always update records regardless of completion status
            this.records = this.calculateRecords();

            // Update all displays
            this.updateDashboard();

            const message = allTimesSubmitted
                ? 'Battle results saved successfully! Head-to-head scores and achievements updated.'
                : 'Partial results saved successfully. Complete all 6 times to calculate head-to-head scores and achievements.';
            alert(message);
        } catch (error) {
            console.error('Failed to save entry:', error);
            alert('Failed to save entry. Please try again.');
        }
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
        if (confirm('Are you sure you want to clear all current entries?')) {
            document.querySelectorAll('.time-input, .error-input').forEach(input => {
                input.value = '';
                input.disabled = false;
                input.style.opacity = '1';
            });

            document.querySelectorAll('.dnf-checkbox').forEach(checkbox => {
                checkbox.checked = false;
            });

            this.setCurrentDate();
            this.updateScores();
        }
    }

    checkExistingEntry() {
        const selectedDate = document.getElementById('entryDate').value;
        const existingEntry = this.entries.find(entry => entry.date === selectedDate);

        if (existingEntry) {
            if (confirm('An entry exists for this date. Do you want to load it for editing?')) {
                this.loadEntry(existingEntry);
            }
        }
    }

    loadEntry(entry) {
        ['faidao', 'filip'].forEach(player => {
            ['easy', 'medium', 'hard'].forEach(difficulty => {
                const timeInput = document.getElementById(`${player}-${difficulty}-time`);
                const errorInput = document.getElementById(`${player}-${difficulty}-errors`);
                const dnfCheckbox = document.getElementById(`${player}-${difficulty}-dnf`);

                if (entry[player].dnf[difficulty]) {
                    dnfCheckbox.checked = true;
                    timeInput.disabled = true;
                    timeInput.value = '';
                    timeInput.style.opacity = '0.5';
                    errorInput.disabled = true;
                    errorInput.value = '';
                    errorInput.style.opacity = '0.5';
                } else {
                    dnfCheckbox.checked = false;
                    timeInput.disabled = false;
                    timeInput.style.opacity = '1';
                    errorInput.disabled = false;
                    errorInput.style.opacity = '1';

                    if (entry[player].times[difficulty] !== null) {
                        timeInput.value = this.formatSecondsToTime(entry[player].times[difficulty]);
                    }

                    errorInput.value = entry[player].errors[difficulty] || 0;
                }
            });
        });

        this.updateScores();
    }

    updateDashboard() {
        this.updateStreakDisplay();
        this.updateOverallRecord();
        this.updateRecentHistory();
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
        document.getElementById('entryDate').value = date;
        this.checkExistingEntry();
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
                this.updateDashboard();
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
                            <span class="stat-label">Wins</span>
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
                <div class="record-item">
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

    updateAllPages() {
        this.updateDashboard();
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
}

// Initialize the application
const sudokuApp = new SudokuChampionship();