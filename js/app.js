class SudokuChampionship {
    constructor() {
        this.entries = this.loadFromStorage() || [];
        this.achievements = this.loadAchievements() || [];
        this.challenges = this.loadChallenges() || [];
        this.streaks = this.loadStreaks() || { faidao: { current: 0, best: 0 }, filip: { current: 0, best: 0 } };
        this.records = this.loadRecords() || { faidao: {}, filip: {} };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.setCurrentDate();
        this.updateDashboard();
        this.updateAllPages();
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
                this.formatTimeInput(e.target);
                this.updateScores();
            });
        });

        errorInputs.forEach(input => {
            input.addEventListener('input', () => {
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
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = e.target.closest('.nav-link').dataset.page;

                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                e.target.closest('.nav-link').classList.add('active');

                // Update active page
                pages.forEach(page => page.classList.remove('active'));
                document.getElementById(targetPage).classList.add('active');

                // Update page content
                this.updatePageContent(targetPage);
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

    formatTimeInput(input) {
        let value = input.value.replace(/[^0-9]/g, '');

        if (value.length === 0) {
            input.value = '';
            return;
        }

        // Convert raw numbers to MM:SS format
        if (value.length <= 2) {
            const seconds = parseInt(value);
            input.value = `0:${seconds.toString().padStart(2, '0')}`;
        } else if (value.length === 3) {
            const minutes = parseInt(value[0]);
            const seconds = parseInt(value.substring(1));
            if (seconds >= 60) {
                const totalSeconds = minutes * 60 + seconds;
                const finalMinutes = Math.floor(totalSeconds / 60);
                const finalSecs = totalSeconds % 60;
                input.value = `${finalMinutes}:${finalSecs.toString().padStart(2, '0')}`;
            } else {
                input.value = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        } else if (value.length >= 4) {
            const minutes = parseInt(value.substring(0, value.length - 2));
            const seconds = parseInt(value.substring(value.length - 2));
            if (seconds >= 60) {
                const totalSeconds = minutes * 60 + seconds;
                const finalMinutes = Math.floor(totalSeconds / 60);
                const finalSecs = totalSeconds % 60;
                input.value = `${finalMinutes}:${finalSecs.toString().padStart(2, '0')}`;
            } else {
                input.value = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }
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
        if (!timeString || timeString.trim() === '') return null;

        const parts = timeString.split(':');
        if (parts.length !== 2) return null;

        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;

        return minutes * 60 + seconds;
    }

    formatSecondsToTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
                    // Add error penalty (10 seconds per error)
                    const adjustedTime = time + (errors * 10);

                    // Calculate score: (10000 ÷ seconds) × multiplier
                    score = (10000 / adjustedTime) * multipliers[difficulty];
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

    saveEntry() {
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

        // Remove existing entry for this date
        this.entries = this.entries.filter(e => e.date !== date);

        // Add new entry
        this.entries.push(entry);

        // Sort by date (newest first)
        this.entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Update streaks
        this.updateStreaks();

        // Update records
        this.updateRecords(entry);

        // Check for achievements
        this.checkAchievements(entry);

        // Save to storage
        this.saveToStorage();

        // Update all displays
        this.updateDashboard();

        alert('Battle results saved successfully!');
    }

    updateStreaks() {
        if (this.entries.length === 0) return;

        // Sort entries by date (oldest first) for streak calculation
        const sortedEntries = [...this.entries].sort((a, b) => new Date(a.date) - new Date(b.date));

        let faidaoStreak = 0;
        let filipStreak = 0;
        let faidaoBest = 0;
        let filipBest = 0;
        let currentFaidaoStreak = 0;
        let currentFilipStreak = 0;

        sortedEntries.forEach((entry, index) => {
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
                currentFaidaoStreak = 0;
                currentFilipStreak = 0;
            }

            // If this is the most recent entry, save current streaks
            if (index === sortedEntries.length - 1) {
                faidaoStreak = currentFaidaoStreak;
                filipStreak = currentFilipStreak;
            }
        });

        this.streaks = {
            faidao: { current: faidaoStreak, best: Math.max(faidaoBest, this.streaks.faidao?.best || 0) },
            filip: { current: filipStreak, best: Math.max(filipBest, this.streaks.filip?.best || 0) }
        };

        this.saveStreaks();
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

        this.entries.forEach(entry => {
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
            const winner = entry.faidao.scores.total > entry.filip.scores.total ? 'Faidao' :
                          entry.filip.scores.total > entry.faidao.scores.total ? 'Filip' : 'Tie';

            return `
                <div class="history-card">
                    <div class="history-date">${new Date(entry.date).toLocaleDateString()}</div>
                    <div class="history-scores">
                        <div class="history-score">
                            <div class="player-name">Faidao</div>
                            <div class="score-value">${entry.faidao.scores.total.toFixed(0)}</div>
                        </div>
                        <div class="history-score">
                            <div class="player-name">Filip</div>
                            <div class="score-value">${entry.filip.scores.total.toFixed(0)}</div>
                        </div>
                    </div>
                    <div class="history-winner">${winner}</div>
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

    deleteEntry(date) {
        if (confirm('Are you sure you want to delete this entry?')) {
            this.entries = this.entries.filter(entry => entry.date !== date);
            this.updateStreaks();
            this.saveToStorage();
            this.updateDashboard();
        }
    }

    updatePageContent(page) {
        switch (page) {
            case 'analytics':
                if (window.analyticsManager) {
                    window.analyticsManager.updateCharts(this.entries);
                }
                break;
            case 'achievements':
                if (window.achievementsManager) {
                    window.achievementsManager.updateAchievements(this.entries, this.streaks, this.records);
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
        // This will be implemented when leaderboards are created
        console.log('Updating leaderboards...');
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

    checkAchievements(entry) {
        // This will be implemented in achievements.js
        if (window.achievementsManager) {
            window.achievementsManager.checkNewAchievements(entry, this.entries, this.streaks);
        }
    }

    updateAllPages() {
        this.updateDashboard();
        // Other page updates will be handled when those managers are loaded
    }

    // Storage methods
    saveToStorage() {
        localStorage.setItem('sudokuChampionshipEntries', JSON.stringify(this.entries));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('sudokuChampionshipEntries');
        return stored ? JSON.parse(stored) : [];
    }

    saveStreaks() {
        localStorage.setItem('sudokuChampionshipStreaks', JSON.stringify(this.streaks));
    }

    loadStreaks() {
        const stored = localStorage.getItem('sudokuChampionshipStreaks');
        return stored ? JSON.parse(stored) : null;
    }

    saveRecords() {
        localStorage.setItem('sudokuChampionshipRecords', JSON.stringify(this.records));
    }

    loadRecords() {
        const stored = localStorage.setItem('sudokuChampionshipRecords');
        return stored ? JSON.parse(stored) : null;
    }

    saveAchievements() {
        localStorage.setItem('sudokuChampionshipAchievements', JSON.stringify(this.achievements));
    }

    loadAchievements() {
        const stored = localStorage.getItem('sudokuChampionshipAchievements');
        return stored ? JSON.parse(stored) : [];
    }

    saveChallenges() {
        localStorage.setItem('sudokuChampionshipChallenges', JSON.stringify(this.challenges));
    }

    loadChallenges() {
        const stored = localStorage.getItem('sudokuChampionshipChallenges');
        return stored ? JSON.parse(stored) : [];
    }
}

// Initialize the application
const sudokuApp = new SudokuChampionship();