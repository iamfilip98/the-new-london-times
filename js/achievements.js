class AchievementsManager {
    constructor() {
        this.achievementDefinitions = [
            // STREAK ACHIEVEMENTS (10)
            {
                id: 'streak_3',
                title: 'Hot Start',
                description: 'Win 3 consecutive days',
                icon: 'fas fa-fire',
                type: 'streak',
                requirement: { type: 'win_streak', value: 3 },
                rarity: 'common'
            },
            {
                id: 'streak_5',
                title: 'Five-peat',
                description: 'Win 5 consecutive days',
                icon: 'fas fa-fire',
                type: 'streak',
                requirement: { type: 'win_streak', value: 5 },
                rarity: 'rare'
            },
            {
                id: 'streak_7',
                title: 'Lucky Seven',
                description: 'Win 7 consecutive days',
                icon: 'fas fa-dice-seven',
                type: 'streak',
                requirement: { type: 'win_streak', value: 7 },
                rarity: 'epic'
            },
            {
                id: 'streak_10',
                title: 'Dominator',
                description: 'Win 10 consecutive days',
                icon: 'fas fa-crown',
                type: 'streak',
                requirement: { type: 'win_streak', value: 10 },
                rarity: 'epic'
            },
            {
                id: 'streak_15',
                title: 'Unstoppable Force',
                description: 'Win 15 consecutive days',
                icon: 'fas fa-meteor',
                type: 'streak',
                requirement: { type: 'win_streak', value: 15 },
                rarity: 'legendary'
            },
            {
                id: 'streak_20',
                title: 'Sudoku Overlord',
                description: 'Win 20 consecutive days',
                icon: 'fas fa-crown',
                type: 'streak',
                requirement: { type: 'win_streak', value: 20 },
                rarity: 'legendary'
            },
            {
                id: 'streak_30',
                title: 'Month of Madness',
                description: 'Win 30 consecutive days',
                icon: 'fas fa-dragon',
                type: 'streak',
                requirement: { type: 'win_streak', value: 30 },
                rarity: 'legendary'
            },
            {
                id: 'streak_50',
                title: 'Dimension Breaker',
                description: 'Win 50 consecutive days (breaks the laws of probability)',
                icon: 'fas fa-infinity',
                type: 'streak',
                requirement: { type: 'win_streak', value: 50 },
                rarity: 'legendary'
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
            {
                id: 'weekend_warrior',
                title: 'Weekend Warrior',
                description: 'Win both Saturday and Sunday',
                icon: 'fas fa-calendar-weekend',
                type: 'weekend',
                requirement: { type: 'weekend_sweep', value: 1 },
                rarity: 'common'
            },

            // SPEED ACHIEVEMENTS (12)
            {
                id: 'speed_walker_easy',
                title: 'Speed Walker (Easy)',
                description: 'Complete Easy under 3 minutes',
                icon: 'fas fa-walking',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'easy', value: 180 },
                rarity: 'common'
            },
            {
                id: 'speed_demon_easy',
                title: 'Speed Demon (Easy)',
                description: 'Complete Easy under 2 minutes',
                icon: 'fas fa-bolt',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'easy', value: 120 },
                rarity: 'rare'
            },
            {
                id: 'speed_racer_easy',
                title: 'Speed Racer (Easy)',
                description: 'Complete Easy under 1 minute',
                icon: 'fas fa-rocket',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'easy', value: 60 },
                rarity: 'epic'
            },
            {
                id: 'teleporter_easy',
                title: 'Teleporter (Easy)',
                description: 'Complete Easy under 30 seconds (almost impossible)',
                icon: 'fas fa-magic',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'easy', value: 30 },
                rarity: 'legendary'
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
                id: 'speed_racer_medium',
                title: 'Speed Racer (Medium)',
                description: 'Complete Medium under 3 minutes',
                icon: 'fas fa-rocket',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'medium', value: 180 },
                rarity: 'epic'
            },
            {
                id: 'teleporter_medium',
                title: 'Teleporter (Medium)',
                description: 'Complete Medium under 2 minutes (superhuman)',
                icon: 'fas fa-magic',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'medium', value: 120 },
                rarity: 'legendary'
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
            {
                id: 'speed_racer_hard',
                title: 'Speed Racer (Hard)',
                description: 'Complete Hard under 5 minutes',
                icon: 'fas fa-rocket',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'hard', value: 300 },
                rarity: 'legendary'
            },
            {
                id: 'time_lord',
                title: 'Time Lord',
                description: 'Complete Hard under 3 minutes (defies physics)',
                icon: 'fas fa-clock',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'hard', value: 180 },
                rarity: 'legendary'
            },
            {
                id: 'triple_threat',
                title: 'Triple Threat',
                description: 'Complete all 3 difficulties in under 15 minutes total',
                icon: 'fas fa-fire',
                type: 'speed',
                requirement: { type: 'total_time_under', value: 900 },
                rarity: 'epic'
            },
            {
                id: 'lightning_round',
                title: 'Lightning Round',
                description: 'Complete all 3 difficulties in under 8 minutes total',
                icon: 'fas fa-bolt',
                type: 'speed',
                requirement: { type: 'total_time_under', value: 480 },
                rarity: 'legendary'
            },

            // PERFECTION ACHIEVEMENTS (8)
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
                id: 'perfectionist_week',
                title: 'Perfectionist Week',
                description: 'Complete 7 consecutive days with 0 total errors',
                icon: 'fas fa-diamond',
                type: 'perfect',
                requirement: { type: 'perfect_week', value: 7 },
                rarity: 'legendary'
            },
            {
                id: 'perfectionist_month',
                title: 'Perfectionist God',
                description: 'Complete 30 consecutive days with 0 total errors',
                icon: 'fas fa-crown',
                type: 'perfect',
                requirement: { type: 'perfect_month', value: 30 },
                rarity: 'legendary'
            },
            {
                id: 'triple_perfect',
                title: 'Triple Perfect',
                description: 'Complete all 3 difficulties with 0 errors in one day',
                icon: 'fas fa-trophy',
                type: 'perfect',
                requirement: { type: 'triple_perfect_day', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'machine_precision',
                title: 'Machine Precision',
                description: 'Get 10 perfect days in a row',
                icon: 'fas fa-robot',
                type: 'perfect',
                requirement: { type: 'perfect_streak', value: 10 },
                rarity: 'legendary'
            },

            // SCORE ACHIEVEMENTS (6)
            {
                id: 'point_collector',
                title: 'Point Collector',
                description: 'Score over 750 points in a single day',
                icon: 'fas fa-coins',
                type: 'score',
                requirement: { type: 'daily_score', value: 750 },
                rarity: 'common'
            },
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
            {
                id: 'point_overlord',
                title: 'Point Overlord',
                description: 'Score over 2000 points in a single day',
                icon: 'fas fa-crown',
                type: 'score',
                requirement: { type: 'daily_score', value: 2000 },
                rarity: 'legendary'
            },
            {
                id: 'clutch_performer',
                title: 'Clutch Performer',
                description: 'Win by exactly 1 point',
                icon: 'fas fa-crosshairs',
                type: 'score',
                requirement: { type: 'close_win', value: 1 },
                rarity: 'rare'
            },
            {
                id: 'dominator_daily',
                title: 'Daily Dominator',
                description: 'Win with 2x opponent\'s score',
                icon: 'fas fa-crown',
                type: 'score',
                requirement: { type: 'dominating_win', value: 2 },
                rarity: 'epic'
            },

            // CONSISTENCY & MILESTONE ACHIEVEMENTS (6)
            {
                id: 'getting_started',
                title: 'Getting Started',
                description: 'Complete 7 days of competition',
                icon: 'fas fa-play',
                type: 'consistency',
                requirement: { type: 'total_days', value: 7 },
                rarity: 'common',
                oneTime: true
            },
            {
                id: 'consistent_performer',
                title: 'Consistent Performer',
                description: 'Complete 30 days of competition',
                icon: 'fas fa-calendar',
                type: 'consistency',
                requirement: { type: 'total_days', value: 30 },
                rarity: 'rare',
                oneTime: true
            },
            {
                id: 'dedicated_competitor',
                title: 'Dedicated Competitor',
                description: 'Complete 100 days of competition',
                icon: 'fas fa-medal',
                type: 'consistency',
                requirement: { type: 'total_days', value: 100 },
                rarity: 'epic',
                oneTime: true
            },
            {
                id: 'sudoku_veteran',
                title: 'Sudoku Veteran',
                description: 'Complete 365 days of competition',
                icon: 'fas fa-shield',
                type: 'consistency',
                requirement: { type: 'total_days', value: 365 },
                rarity: 'legendary',
                oneTime: true
            },
            {
                id: 'consistency_king',
                title: 'Consistency King',
                description: 'Have all 3 difficulties within 10% of each other',
                icon: 'fas fa-balance-scale',
                type: 'consistency',
                requirement: { type: 'balanced_times', value: 0.1 },
                rarity: 'rare'
            },
            {
                id: 'precision_machine',
                title: 'Precision Machine',
                description: 'Have all 3 difficulties within 5% of each other',
                icon: 'fas fa-cog',
                type: 'consistency',
                requirement: { type: 'balanced_times', value: 0.05 },
                rarity: 'epic'
            },

            // QUIRKY & FUN ACHIEVEMENTS (8)
            {
                id: 'comeback_kid',
                title: 'Comeback Kid',
                description: 'Win after losing 3 days in a row',
                icon: 'fas fa-undo',
                type: 'comeback',
                requirement: { type: 'comeback_win', value: 3 },
                rarity: 'rare'
            },
            {
                id: 'comeback_legend',
                title: 'Comeback Legend',
                description: 'Win after losing 5 days in a row',
                icon: 'fas fa-phoenix-squadron',
                type: 'comeback',
                requirement: { type: 'comeback_win', value: 5 },
                rarity: 'epic'
            },
            {
                id: 'dnf_survivor',
                title: 'DNF Survivor',
                description: 'Win despite having a DNF',
                icon: 'fas fa-shield-alt',
                type: 'comeback',
                requirement: { type: 'win_with_dnf', value: 1 },
                rarity: 'rare'
            },
            {
                id: 'error_magnet',
                title: 'Error Magnet',
                description: 'Make 20+ errors in a single day',
                icon: 'fas fa-exclamation-triangle',
                type: 'errors',
                requirement: { type: 'total_errors_over', value: 20 },
                rarity: 'common'
            },
            {
                id: 'error_explosion',
                title: 'Error Explosion',
                description: 'Make 50+ errors in a single day (how is this possible?)',
                icon: 'fas fa-bomb',
                type: 'errors',
                requirement: { type: 'total_errors_over', value: 50 },
                rarity: 'legendary'
            },
            {
                id: 'methodical_solver',
                title: 'Methodical Solver',
                description: 'Take over 15 minutes on Hard (thinking it through)',
                icon: 'fas fa-brain',
                type: 'speed',
                requirement: { type: 'time_over', difficulty: 'hard', value: 900 },
                rarity: 'common'
            },
            {
                id: 'perfectionist_patience',
                title: 'Perfectionist Patience',
                description: 'Take over 20 minutes on Hard (maximum dedication)',
                icon: 'fas fa-clock',
                type: 'speed',
                requirement: { type: 'time_over', difficulty: 'hard', value: 1200 },
                rarity: 'rare'
            },
            {
                id: 'error_recovery',
                title: 'Error Recovery Master',
                description: 'Win a day despite making 10+ errors',
                icon: 'fas fa-first-aid',
                type: 'errors',
                requirement: { type: 'win_with_errors', value: 10 },
                rarity: 'epic'
            }
        ];

        this.unlockedAchievements = [];
        this.initializeAsync();
    }

    async initializeAsync() {
        try {
            await this.refreshAchievements();
        } catch (error) {
            console.error('Failed to load achievements:', error);
            this.unlockedAchievements = [];
        }
    }

    async refreshAchievements() {
        try {
            this.unlockedAchievements = await sudokuApp.loadAchievements() || [];
        } catch (error) {
            console.error('Failed to refresh achievements:', error);
            // Keep existing achievements if database fails
            if (!this.unlockedAchievements) {
                this.unlockedAchievements = [];
            }
        }
    }

    // Helper method to ensure unlockedAchievements is always an array
    ensureUnlockedAchievementsArray() {
        if (!Array.isArray(this.unlockedAchievements)) {
            this.unlockedAchievements = [];
        }
    }

    // Safety mechanism: prevent awarding more achievements than days played
    shouldAllowRepeatableAchievement(achievementId, player, allEntries) {
        // Count how many times this player has unlocked this achievement
        const existingUnlocks = this.unlockedAchievements.filter(a =>
            a.id === achievementId && a.player === player
        ).length;

        // Count how many days this player has played
        const daysPlayed = allEntries.length;

        // Don't allow more unlocks than days played
        return existingUnlocks < daysPlayed;
    }

    async checkNewAchievements(newEntry, allEntries, streaks) {
        // Always refresh achievements from database before checking
        await this.refreshAchievements();
        this.ensureUnlockedAchievementsArray();

        const newlyUnlocked = [];

        for (const achievement of this.achievementDefinitions) {
            const playersWhoEarned = this.checkAchievementRequirement(achievement, newEntry, allEntries, streaks);

            if (playersWhoEarned && playersWhoEarned.length > 0) {
                for (const player of playersWhoEarned) {
                    // Check if this player should get this achievement
                    let shouldUnlock = false;

                    if (achievement.oneTime) {
                        // For one-time achievements, check if player has ANY instance of this achievement
                        const alreadyHas = this.unlockedAchievements.some(a =>
                            a.id === achievement.id && a.player === player
                        );
                        shouldUnlock = !alreadyHas;
                    } else {
                        // For repeatable achievements, apply safety check
                        shouldUnlock = this.shouldAllowRepeatableAchievement(achievement.id, player, allEntries);
                    }

                    if (shouldUnlock) {
                        await this.unlockAchievement(achievement, player);
                        newlyUnlocked.push({...achievement, player});
                    }
                }
            }
        }

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

            case 'time_over':
                return this.checkTimeOver(req, newEntry);

            case 'total_time_under':
                return this.checkTotalTimeUnder(req, newEntry);

            case 'total_errors_over':
                return this.checkTotalErrorsOver(req, newEntry);

            case 'late_submission':
            case 'early_submission':
                return this.checkSubmissionTime(req, newEntry);

            case 'weekend_sweep':
                return this.checkWeekendSweep(allEntries);

            case 'close_win':
                return this.checkCloseWin(req, newEntry);

            case 'dominating_win':
                return this.checkDominatingWin(req, newEntry);

            case 'balanced_times':
                return this.checkBalancedTimes(req, newEntry);

            case 'win_with_dnf':
                return this.checkWinWithDnf(req, newEntry);

            case 'perfect_week':
                return this.checkPerfectWeek(allEntries);

            case 'zero_errors_day':
                return this.checkZeroErrorsDay(newEntry);

            case 'zero_errors':
                return this.checkZeroErrors(req, newEntry);

            case 'total_days':
                return allEntries.length >= req.value ? ['faidao', 'filip'] : [];

            case 'daily_score':
                return this.checkDailyScore(req.value, newEntry);

            case 'comeback_win':
                return this.checkComebackWin(req.value, allEntries);

            case 'perfect_month':
                return this.checkPerfectMonth(allEntries);

            case 'triple_perfect_day':
                return this.checkTriplePerfectDay(newEntry);

            case 'perfect_streak':
                return this.checkPerfectStreak(req.value, allEntries);

            case 'win_with_errors':
                return this.checkWinWithErrors(req.value, newEntry);

            default:
                return [];
        }
    }

    checkWinStreak(requiredStreak, streaks) {
        const players = [];
        if ((streaks.faidao?.current || 0) >= requiredStreak) players.push('faidao');
        if ((streaks.filip?.current || 0) >= requiredStreak) players.push('filip');
        return players;
    }

    checkWeeklySweep(allEntries) {
        if (allEntries.length < 7) return [];

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

                if (faidaoWins === 7) return ['faidao'];
                if (filipWins === 7) return ['filip'];
            }
        }

        return [];
    }

    checkTimeUnder(req, entry) {
        const players = ['faidao', 'filip'];

        return players.filter(player => {
            const time = entry[player].times[req.difficulty];
            const dnf = entry[player].dnf[req.difficulty];
            return !dnf && time !== null && time < req.value;
        });
    }

    checkZeroErrorsDay(entry) {
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        return players.filter(player => {
            const totalErrors = difficulties.reduce((sum, diff) => {
                return sum + (entry[player].errors[diff] || 0);
            }, 0);
            return totalErrors === 0;
        });
    }

    checkZeroErrors(req, entry) {
        const players = ['faidao', 'filip'];

        return players.filter(player => {
            const errors = entry[player].errors[req.difficulty];
            const dnf = entry[player].dnf[req.difficulty];
            return !dnf && errors === 0;
        });
    }

    checkDailyScore(requiredScore, entry) {
        const players = [];
        if (entry.faidao.scores.total >= requiredScore) players.push('faidao');
        if (entry.filip.scores.total >= requiredScore) players.push('filip');
        return players;
    }

    checkComebackWin(lossStreak, allEntries) {
        if (allEntries.length < lossStreak + 1) return [];

        const sortedEntries = [...allEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
        const recentEntries = sortedEntries.slice(-lossStreak - 1);

        // Check if the latest entry is a win
        const latestEntry = recentEntries[recentEntries.length - 1];
        const latestFaidaoWon = latestEntry.faidao.scores.total > latestEntry.filip.scores.total;
        const latestFilipWon = latestEntry.filip.scores.total > latestEntry.faidao.scores.total;

        if (!latestFaidaoWon && !latestFilipWon) return []; // Tie doesn't count

        // Check if the previous entries were losses for the winner
        const previousEntries = recentEntries.slice(0, -1);

        if (latestFaidaoWon) {
            const hasLossStreak = previousEntries.every(entry => entry.filip.scores.total > entry.faidao.scores.total);
            return hasLossStreak ? ['faidao'] : [];
        } else {
            const hasLossStreak = previousEntries.every(entry => entry.faidao.scores.total > entry.filip.scores.total);
            return hasLossStreak ? ['filip'] : [];
        }
    }

    checkTimeOver(req, entry) {
        const players = ['faidao', 'filip'];

        return players.filter(player => {
            const time = entry[player].times[req.difficulty];
            const dnf = entry[player].dnf[req.difficulty];
            return !dnf && time !== null && time > req.value;
        });
    }

    checkTotalTimeUnder(req, entry) {
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        return players.filter(player => {
            const totalTime = difficulties.reduce((sum, diff) => {
                const time = entry[player].times[diff];
                const dnf = entry[player].dnf[diff];
                return sum + (!dnf && time !== null ? time : 0);
            }, 0);

            // Only count if all difficulties were completed (no DNFs)
            const allCompleted = difficulties.every(diff => !entry[player].dnf[diff] && entry[player].times[diff] !== null);
            return allCompleted && totalTime < req.value;
        });
    }

    checkTotalErrorsOver(req, entry) {
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        return players.filter(player => {
            const totalErrors = difficulties.reduce((sum, diff) => {
                return sum + (entry[player].errors[diff] || 0);
            }, 0);
            return totalErrors > req.value;
        });
    }

    checkSubmissionTime(req, entry) {
        const players = ['faidao', 'filip'];
        const submissionTime = new Date().getHours();

        // Check if this is a late or early submission
        const isLateSubmission = req.type === 'late_submission' && submissionTime >= req.value;
        const isEarlySubmission = req.type === 'early_submission' && submissionTime < req.value;

        if (isLateSubmission || isEarlySubmission) {
            // Return both players since submission time affects both
            return players;
        }
        return [];
    }

    checkWeekendSweep(allEntries) {
        if (allEntries.length < 2) return [];

        const today = new Date();
        const currentWeekStart = new Date(today.setDate(today.getDate() - today.getDay()));

        // Find Saturday and Sunday entries for current week
        const weekendEntries = allEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            const dayOfWeek = entryDate.getDay();
            return (dayOfWeek === 0 || dayOfWeek === 6) && entryDate >= currentWeekStart;
        });

        if (weekendEntries.length < 2) return [];

        const saturdayEntry = weekendEntries.find(e => new Date(e.date).getDay() === 6);
        const sundayEntry = weekendEntries.find(e => new Date(e.date).getDay() === 0);

        if (!saturdayEntry || !sundayEntry) return [];

        const players = [];
        if (saturdayEntry.faidao.scores.total > saturdayEntry.filip.scores.total &&
            sundayEntry.faidao.scores.total > sundayEntry.filip.scores.total) {
            players.push('faidao');
        }
        if (saturdayEntry.filip.scores.total > saturdayEntry.faidao.scores.total &&
            sundayEntry.filip.scores.total > sundayEntry.faidao.scores.total) {
            players.push('filip');
        }

        return players;
    }

    checkCloseWin(req, entry) {
        const scoreDiff = Math.abs(entry.faidao.scores.total - entry.filip.scores.total);
        if (scoreDiff === req.value) {
            if (entry.faidao.scores.total > entry.filip.scores.total) return ['faidao'];
            if (entry.filip.scores.total > entry.faidao.scores.total) return ['filip'];
        }
        return [];
    }

    checkDominatingWin(req, entry) {
        const players = [];
        if (entry.faidao.scores.total >= entry.filip.scores.total * req.value) {
            players.push('faidao');
        }
        if (entry.filip.scores.total >= entry.faidao.scores.total * req.value) {
            players.push('filip');
        }
        return players;
    }

    checkBalancedTimes(req, entry) {
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        return players.filter(player => {
            const times = difficulties.map(diff => entry[player].times[diff]).filter(t => t !== null);

            if (times.length !== 3) return false; // Need all 3 times

            const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
            const maxDeviation = Math.max(...times.map(time => Math.abs(time - avgTime) / avgTime));

            return maxDeviation <= req.value;
        });
    }

    checkWinWithDnf(req, entry) {
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        return players.filter(player => {
            const hasDnf = difficulties.some(diff => entry[player].dnf[diff]);
            const isWinner = entry[player].scores.total > entry[player === 'faidao' ? 'filip' : 'faidao'].scores.total;
            return hasDnf && isWinner;
        });
    }

    checkPerfectWeek(allEntries) {
        if (allEntries.length < 7) return [];

        const sortedEntries = [...allEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
        const difficulties = ['easy', 'medium', 'hard'];

        // Check last 7 consecutive days
        for (let i = sortedEntries.length - 7; i >= 0; i--) {
            const weekEntries = sortedEntries.slice(i, i + 7);

            // Verify consecutive days
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
                const players = ['faidao', 'filip'];
                const qualifyingPlayers = [];

                players.forEach(player => {
                    const perfectWeek = weekEntries.every(entry => {
                        return difficulties.every(diff => entry[player].errors[diff] === 0);
                    });
                    if (perfectWeek) qualifyingPlayers.push(player);
                });

                if (qualifyingPlayers.length > 0) return qualifyingPlayers;
            }
        }

        return [];
    }

    checkPerfectMonth(allEntries) {
        if (allEntries.length < 30) return [];

        const sortedEntries = [...allEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
        const difficulties = ['easy', 'medium', 'hard'];

        // Check last 30 consecutive days
        for (let i = sortedEntries.length - 30; i >= 0; i--) {
            const monthEntries = sortedEntries.slice(i, i + 30);

            // Verify consecutive days
            let isConsecutive = true;
            for (let j = 1; j < monthEntries.length; j++) {
                const prevDate = new Date(monthEntries[j - 1].date);
                const currDate = new Date(monthEntries[j].date);
                const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
                if (dayDiff !== 1) {
                    isConsecutive = false;
                    break;
                }
            }

            if (isConsecutive) {
                const players = ['faidao', 'filip'];
                const qualifyingPlayers = [];

                players.forEach(player => {
                    const perfectMonth = monthEntries.every(entry => {
                        return difficulties.every(diff => entry[player].errors[diff] === 0);
                    });
                    if (perfectMonth) qualifyingPlayers.push(player);
                });

                if (qualifyingPlayers.length > 0) return qualifyingPlayers;
            }
        }

        return [];
    }

    checkTriplePerfectDay(entry) {
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        return players.filter(player => {
            return difficulties.every(diff => {
                const errors = entry[player].errors[diff];
                const dnf = entry[player].dnf[diff];
                return !dnf && errors === 0;
            });
        });
    }

    checkPerfectStreak(requiredStreak, allEntries) {
        if (allEntries.length < requiredStreak) return [];

        const sortedEntries = [...allEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
        const difficulties = ['easy', 'medium', 'hard'];
        const players = ['faidao', 'filip'];
        const qualifyingPlayers = [];

        players.forEach(player => {
            // Check if the last N entries are all perfect for this player
            const recentEntries = sortedEntries.slice(-requiredStreak);

            // Verify consecutive days
            let isConsecutive = true;
            for (let j = 1; j < recentEntries.length; j++) {
                const prevDate = new Date(recentEntries[j - 1].date);
                const currDate = new Date(recentEntries[j].date);
                const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
                if (dayDiff !== 1) {
                    isConsecutive = false;
                    break;
                }
            }

            if (isConsecutive) {
                const perfectStreak = recentEntries.every(entry => {
                    return difficulties.every(diff => entry[player].errors[diff] === 0);
                });
                if (perfectStreak) qualifyingPlayers.push(player);
            }
        });

        return qualifyingPlayers;
    }

    checkWinWithErrors(minErrors, entry) {
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        return players.filter(player => {
            const totalErrors = difficulties.reduce((sum, diff) => {
                return sum + (entry[player].errors[diff] || 0);
            }, 0);
            const isWinner = entry[player].scores.total > entry[player === 'faidao' ? 'filip' : 'faidao'].scores.total;
            return totalErrors >= minErrors && isWinner;
        });
    }

    async unlockAchievement(achievement, player) {
        this.ensureUnlockedAchievementsArray();

        const unlock = {
            id: achievement.id,
            player: player,
            unlockedAt: new Date().toISOString(),
            title: achievement.title,
            description: achievement.description,
            oneTime: achievement.oneTime || false
        };

        this.unlockedAchievements.push(unlock);

        // Save immediately to database
        try {
            await fetch('/api/achievements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(unlock)
            });
        } catch (error) {
            console.error('Failed to save achievement:', error);
        }
    }

    async isAchievementUnlocked(achievementId) {
        await this.refreshAchievements();
        this.ensureUnlockedAchievementsArray();
        return this.unlockedAchievements.some(a => a.id === achievementId);
    }

    async updateAchievements(entries, streaks, records) {
        // Always refresh achievements from database before updating display
        await this.refreshAchievements();
        this.ensureUnlockedAchievementsArray();

        // Update the achievements summary
        this.updateAchievementsSummary();

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

            // Determine border color based on who has the most unlocks
            let borderClass = '';
            if (isUnlocked) {
                const playerEntries = Object.entries(playerStats);
                if (playerEntries.length === 1) {
                    // Only one player has this achievement
                    borderClass = `${playerEntries[0][0]}-border`;
                } else if (playerEntries.length === 2) {
                    const [player1, stats1] = playerEntries[0];
                    const [player2, stats2] = playerEntries[1];
                    if (stats1.count > stats2.count) {
                        borderClass = `${player1}-border`;
                    } else if (stats2.count > stats1.count) {
                        borderClass = `${player2}-border`;
                    } else {
                        borderClass = 'tie-border'; // Yellow for tie
                    }
                }
            }

            const playerStatsHTML = Object.keys(playerStats).length > 0 ? `
                <div class="achievement-players">
                    ${Object.entries(playerStats).map(([player, stats]) => `
                        <div class="player-achievement-stat">
                            <span class="player-name ${player}-color">${player}</span>
                            <span class="achievement-count">${stats.count}x</span>
                            <span class="achievement-date" title="First unlocked: ${new Date(stats.firstUnlocked).toLocaleDateString()}">
                                ${new Date(stats.firstUnlocked).toLocaleDateString()}
                            </span>
                        </div>
                    `).join('')}
                </div>
            ` : '';

            return `
                <div class="achievement-badge ${isUnlocked ? 'unlocked' : 'locked'} ${borderClass}">
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

    async getAchievementStats() {
        await this.refreshAchievements();
        this.ensureUnlockedAchievementsArray();

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
            a.rarity === rarity && this.unlockedAchievements.some(ua => ua.id === a.id)
        ).length;

        return {
            total: totalByRarity,
            unlocked: unlockedByRarity,
            percentage: totalByRarity > 0 ? Math.round((unlockedByRarity / totalByRarity) * 100) : 0
        };
    }

    updateAchievementsSummary() {
        this.ensureUnlockedAchievementsArray();

        // Count achievements per player
        const playerCounts = {
            faidao: 0,
            filip: 0
        };

        // Count unique achievements per player (not individual unlocks)
        const uniqueAchievements = new Set();
        this.unlockedAchievements.forEach(achievement => {
            const key = `${achievement.id}-${achievement.player}`;
            if (!uniqueAchievements.has(key)) {
                uniqueAchievements.add(key);
                if (playerCounts.hasOwnProperty(achievement.player)) {
                    playerCounts[achievement.player]++;
                }
            }
        });

        // Update DOM elements
        const faidaoCountEl = document.getElementById('faidaoAchievementCount');
        const filipCountEl = document.getElementById('filipAchievementCount');
        const totalUnlockedEl = document.getElementById('totalAchievementsUnlocked');
        const totalAchievementsEl = document.getElementById('totalAchievements');

        if (faidaoCountEl) faidaoCountEl.textContent = playerCounts.faidao;
        if (filipCountEl) filipCountEl.textContent = playerCounts.filip;
        if (totalUnlockedEl) {
            const totalUnlocked = playerCounts.faidao + playerCounts.filip;
            totalUnlockedEl.textContent = totalUnlocked;
        }
        if (totalAchievementsEl) {
            // Total possible achievements = definitions * 2 players
            const totalPossible = this.achievementDefinitions.length * 2;
            totalAchievementsEl.textContent = totalPossible;
        }
    }
}

// Initialize achievements manager
window.achievementsManager = new AchievementsManager();