class AchievementsManager {
    constructor() {
        this.achievementDefinitions = [
            // Win Streak Achievements
            {
                id: 'streak_5',
                title: '5-Day Champion',
                description: 'Win 5 consecutive days',
                icon: 'fas fa-fire',
                type: 'streak',
                requirement: { type: 'win_streak', value: 5 },
                rarity: 'common'
            },
            {
                id: 'streak_10',
                title: 'Dominator',
                description: 'Win 10 consecutive days',
                icon: 'fas fa-crown',
                type: 'streak',
                requirement: { type: 'win_streak', value: 10 },
                rarity: 'rare'
            },
            {
                id: 'perfect_week',
                title: 'Perfect Week',
                description: 'Win all 7 days in a week',
                icon: 'fas fa-calendar-check',
                type: 'weekly',
                requirement: { type: 'weekly_sweep', value: 7 },
                rarity: 'epic'
            },

            // Speed Achievements
            {
                id: 'speed_demon_easy',
                title: 'Speed Demon (Easy)',
                description: 'Complete Easy under 2 minutes',
                icon: 'fas fa-bolt',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'easy', value: 120 },
                rarity: 'common'
            },
            {
                id: 'speed_demon_medium',
                title: 'Speed Demon (Medium)',
                description: 'Complete Medium under 5 minutes',
                icon: 'fas fa-bolt',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'medium', value: 300 },
                rarity: 'rare'
            },
            {
                id: 'speed_demon_hard',
                title: 'Speed Demon (Hard)',
                description: 'Complete Hard under 10 minutes',
                icon: 'fas fa-bolt',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'hard', value: 600 },
                rarity: 'epic'
            },

            // Perfect Game Achievements
            {
                id: 'perfectionist',
                title: 'Perfectionist',
                description: 'Complete a day with zero total errors',
                icon: 'fas fa-gem',
                type: 'perfect',
                requirement: { type: 'zero_errors_day', value: 1 },
                rarity: 'rare'
            },
            {
                id: 'flawless_easy',
                title: 'Flawless (Easy)',
                description: 'Complete Easy with 0 errors',
                icon: 'fas fa-star',
                type: 'perfect',
                requirement: { type: 'zero_errors', difficulty: 'easy', value: 1 },
                rarity: 'common'
            },
            {
                id: 'flawless_medium',
                title: 'Flawless (Medium)',
                description: 'Complete Medium with 0 errors',
                icon: 'fas fa-star',
                type: 'perfect',
                requirement: { type: 'zero_errors', difficulty: 'medium', value: 1 },
                rarity: 'rare'
            },
            {
                id: 'flawless_hard',
                title: 'Flawless (Hard)',
                description: 'Complete Hard with 0 errors',
                icon: 'fas fa-star',
                type: 'perfect',
                requirement: { type: 'zero_errors', difficulty: 'hard', value: 1 },
                rarity: 'epic'
            },

            // Consistency Achievements
            {
                id: 'consistent_performer',
                title: 'Consistent Performer',
                description: 'Complete 30 days of competition',
                icon: 'fas fa-calendar',
                type: 'consistency',
                requirement: { type: 'total_days', value: 30 },
                rarity: 'rare'
            },
            {
                id: 'dedicated_competitor',
                title: 'Dedicated Competitor',
                description: 'Complete 100 days of competition',
                icon: 'fas fa-medal',
                type: 'consistency',
                requirement: { type: 'total_days', value: 100 },
                rarity: 'legendary'
            },

            // Score Achievements
            {
                id: 'high_scorer',
                title: 'High Scorer',
                description: 'Score over 1000 points in a single day',
                icon: 'fas fa-chart-line',
                type: 'score',
                requirement: { type: 'daily_score', value: 1000 },
                rarity: 'rare'
            },
            {
                id: 'score_master',
                title: 'Score Master',
                description: 'Score over 1500 points in a single day',
                icon: 'fas fa-trophy',
                type: 'score',
                requirement: { type: 'daily_score', value: 1500 },
                rarity: 'epic'
            },

            // Comeback Achievements
            {
                id: 'comeback_kid',
                title: 'Comeback Kid',
                description: 'Win after losing 3 days in a row',
                icon: 'fas fa-undo',
                type: 'comeback',
                requirement: { type: 'comeback_win', value: 3 },
                rarity: 'rare'
            }
        ];

        this.unlockedAchievements = sudokuApp.loadAchievements() || [];
    }

    checkNewAchievements(newEntry, allEntries, streaks) {
        const newlyUnlocked = [];

        this.achievementDefinitions.forEach(achievement => {
            if (this.isAchievementUnlocked(achievement.id)) return;

            if (this.checkAchievementRequirement(achievement, newEntry, allEntries, streaks)) {
                this.unlockAchievement(achievement);
                newlyUnlocked.push(achievement);
            }
        });

        // Show notifications for newly unlocked achievements
        newlyUnlocked.forEach((achievement, index) => {
            setTimeout(() => {
                sudokuApp.showAchievementNotification(achievement);
            }, index * 2000); // Stagger notifications
        });

        return newlyUnlocked;
    }

    checkAchievementRequirement(achievement, newEntry, allEntries, streaks) {
        const req = achievement.requirement;

        switch (req.type) {
            case 'win_streak':
                return this.checkWinStreak(req.value, streaks);

            case 'weekly_sweep':
                return this.checkWeeklySweep(allEntries);

            case 'time_under':
                return this.checkTimeUnder(req, newEntry);

            case 'zero_errors_day':
                return this.checkZeroErrorsDay(newEntry);

            case 'zero_errors':
                return this.checkZeroErrors(req, newEntry);

            case 'total_days':
                return allEntries.length >= req.value;

            case 'daily_score':
                return this.checkDailyScore(req.value, newEntry);

            case 'comeback_win':
                return this.checkComebackWin(req.value, allEntries);

            default:
                return false;
        }
    }

    checkWinStreak(requiredStreak, streaks) {
        return Math.max(streaks.faidao?.current || 0, streaks.filip?.current || 0) >= requiredStreak;
    }

    checkWeeklySweep(allEntries) {
        if (allEntries.length < 7) return false;

        // Check if there's a 7-day period where one player won every day
        const sortedEntries = [...allEntries].sort((a, b) => new Date(a.date) - new Date(b.date));

        for (let i = 0; i <= sortedEntries.length - 7; i++) {
            const weekEntries = sortedEntries.slice(i, i + 7);

            // Check if dates are consecutive
            let isConsecutive = true;
            for (let j = 1; j < weekEntries.length; j++) {
                const prevDate = new Date(weekEntries[j - 1].date);
                const currDate = new Date(weekEntries[j].date);
                const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
                if (dayDiff !== 1) {
                    isConsecutive = false;
                    break;
                }
            }

            if (isConsecutive) {
                const faidaoWins = weekEntries.filter(e => e.faidao.scores.total > e.filip.scores.total).length;
                const filipWins = weekEntries.filter(e => e.filip.scores.total > e.faidao.scores.total).length;

                if (faidaoWins === 7 || filipWins === 7) {
                    return true;
                }
            }
        }

        return false;
    }

    checkTimeUnder(req, entry) {
        const players = ['faidao', 'filip'];

        return players.some(player => {
            const time = entry[player].times[req.difficulty];
            const dnf = entry[player].dnf[req.difficulty];
            return !dnf && time !== null && time < req.value;
        });
    }

    checkZeroErrorsDay(entry) {
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        return players.some(player => {
            const totalErrors = difficulties.reduce((sum, diff) => {
                return sum + (entry[player].errors[diff] || 0);
            }, 0);
            return totalErrors === 0;
        });
    }

    checkZeroErrors(req, entry) {
        const players = ['faidao', 'filip'];

        return players.some(player => {
            const errors = entry[player].errors[req.difficulty];
            const dnf = entry[player].dnf[req.difficulty];
            return !dnf && errors === 0;
        });
    }

    checkDailyScore(requiredScore, entry) {
        return entry.faidao.scores.total >= requiredScore || entry.filip.scores.total >= requiredScore;
    }

    checkComebackWin(lossStreak, allEntries) {
        if (allEntries.length < lossStreak + 1) return false;

        const sortedEntries = [...allEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
        const recentEntries = sortedEntries.slice(-lossStreak - 1);

        // Check if the latest entry is a win
        const latestEntry = recentEntries[recentEntries.length - 1];
        const latestFaidaoWon = latestEntry.faidao.scores.total > latestEntry.filip.scores.total;
        const latestFilipWon = latestEntry.filip.scores.total > latestEntry.faidao.scores.total;

        if (!latestFaidaoWon && !latestFilipWon) return false; // Tie doesn't count

        // Check if the previous entries were losses for the winner
        const previousEntries = recentEntries.slice(0, -1);

        if (latestFaidaoWon) {
            return previousEntries.every(entry => entry.filip.scores.total > entry.faidao.scores.total);
        } else {
            return previousEntries.every(entry => entry.faidao.scores.total > entry.filip.scores.total);
        }
    }

    unlockAchievement(achievement) {
        const unlock = {
            id: achievement.id,
            unlockedAt: new Date().toISOString(),
            title: achievement.title,
            description: achievement.description
        };

        this.unlockedAchievements.push(unlock);
        sudokuApp.saveAchievements();
    }

    isAchievementUnlocked(achievementId) {
        return this.unlockedAchievements.some(a => a.id === achievementId);
    }

    updateAchievements(entries, streaks, records) {
        const achievementsGrid = document.getElementById('achievementsGrid');

        if (!achievementsGrid) return;

        achievementsGrid.innerHTML = this.achievementDefinitions.map(achievement => {
            const achievementInstances = this.unlockedAchievements.filter(a => a.id === achievement.id);
            const isUnlocked = achievementInstances.length > 0;

            // Group by player and count
            const playerStats = {};
            achievementInstances.forEach(instance => {
                if (!playerStats[instance.player]) {
                    playerStats[instance.player] = {
                        count: 0,
                        firstUnlocked: instance.unlockedAt,
                        lastUnlocked: instance.unlockedAt
                    };
                }
                playerStats[instance.player].count++;
                if (new Date(instance.unlockedAt) < new Date(playerStats[instance.player].firstUnlocked)) {
                    playerStats[instance.player].firstUnlocked = instance.unlockedAt;
                }
                if (new Date(instance.unlockedAt) > new Date(playerStats[instance.player].lastUnlocked)) {
                    playerStats[instance.player].lastUnlocked = instance.unlockedAt;
                }
            });

            const playerStatsHTML = Object.keys(playerStats).length > 0 ? `
                <div class="achievement-players">
                    ${Object.entries(playerStats).map(([player, stats]) => `
                        <div class="player-achievement-stat">
                            <span class="player-name ${player}-color">${player}</span>
                            <span class="achievement-count">${stats.count}x</span>
                            <span class="achievement-date">${new Date(stats.firstUnlocked).toLocaleDateString()}</span>
                        </div>
                    `).join('')}
                </div>
            ` : '';

            return `
                <div class="achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="badge-icon">
                        <i class="${achievement.icon}"></i>
                    </div>
                    <h3 class="badge-title">${achievement.title}</h3>
                    <p class="badge-description">${achievement.description}</p>
                    <div class="badge-rarity ${achievement.rarity}">${achievement.rarity.toUpperCase()}</div>
                    ${isUnlocked ? `
                        <div class="badge-unlocked-info">
                            <div class="total-unlocks">Unlocked ${achievementInstances.length} time${achievementInstances.length !== 1 ? 's' : ''}</div>
                            ${playerStatsHTML}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    getAchievementStats() {
        const total = this.achievementDefinitions.length;
        const unlocked = this.unlockedAchievements.length;
        const percentage = Math.round((unlocked / total) * 100);

        return {
            total,
            unlocked,
            percentage,
            byRarity: {
                common: this.getUnlockedByRarity('common'),
                rare: this.getUnlockedByRarity('rare'),
                epic: this.getUnlockedByRarity('epic'),
                legendary: this.getUnlockedByRarity('legendary')
            }
        };
    }

    getUnlockedByRarity(rarity) {
        const totalByRarity = this.achievementDefinitions.filter(a => a.rarity === rarity).length;
        const unlockedByRarity = this.achievementDefinitions.filter(a =>
            a.rarity === rarity && this.isAchievementUnlocked(a.id)
        ).length;

        return {
            total: totalByRarity,
            unlocked: unlockedByRarity,
            percentage: totalByRarity > 0 ? Math.round((unlockedByRarity / totalByRarity) * 100) : 0
        };
    }
}

// Initialize achievements manager
window.achievementsManager = new AchievementsManager();