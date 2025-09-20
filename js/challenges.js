class ChallengesManager {
    constructor() {
        this.challengeTypes = [
            {
                id: 'error_free_week',
                title: 'Error-Free Week',
                description: 'Complete 7 consecutive days with minimal total errors (less than 5 per day)',
                icon: 'fas fa-gem',
                duration: 7,
                type: 'errors',
                target: { maxErrorsPerDay: 5, consecutiveDays: 7 },
                reward: { points: 500, title: 'Precision Master' }
            },
            {
                id: 'speed_week',
                title: 'Speed Week',
                description: 'Focus on fastest completion times - average under 10 minutes total',
                icon: 'fas fa-bolt',
                duration: 7,
                type: 'speed',
                target: { avgTotalTime: 600, consecutiveDays: 7 },
                reward: { points: 400, title: 'Speed Demon' }
            },
            {
                id: 'consistency_challenge',
                title: 'Consistency Challenge',
                description: 'Maintain steady performance - daily scores within 20% of your average',
                icon: 'fas fa-chart-line',
                duration: 10,
                type: 'consistency',
                target: { scoreVariation: 20, consecutiveDays: 10 },
                reward: { points: 600, title: 'Steady Performer' }
            },
            {
                id: 'perfect_streak',
                title: 'Perfect Streak',
                description: 'Complete 5 consecutive days without any DNFs',
                icon: 'fas fa-star',
                duration: 5,
                type: 'completion',
                target: { noDNF: true, consecutiveDays: 5 },
                reward: { points: 350, title: 'Completion Champion' }
            },
            {
                id: 'improvement_challenge',
                title: 'Improvement Challenge',
                description: 'Show consistent improvement - each day better than the last for 5 days',
                icon: 'fas fa-trending-up',
                duration: 5,
                type: 'improvement',
                target: { consecutiveImprovement: 5 },
                reward: { points: 450, title: 'Rising Star' }
            }
        ];

        this.activeChallenges = [];
        this.completedChallenges = [];

        // Initialize challenge rotation after loading data
        this.initializeAsync();
    }

    async initializeAsync() {
        try {
            this.activeChallenges = await sudokuApp.loadChallenges() || [];
            this.completedChallenges = await this.loadCompletedChallenges() || [];
            this.initializeChallengeRotation();
        } catch (error) {
            console.error('Failed to initialize challenges:', error);
            this.initializeChallengeRotation();
        }
    }

    initializeChallengeRotation() {
        const now = new Date();
        const currentWeek = this.getWeekNumber(now);

        // Check if we need to start a new challenge
        const activeChallenge = this.activeChallenges.find(c => c.active);

        if (!activeChallenge || this.hasExpired(activeChallenge)) {
            this.startNewChallenge(currentWeek);
        }
    }

    getWeekNumber(date) {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - startOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    }

    startNewChallenge(weekNumber) {
        // End any active challenges
        this.activeChallenges.forEach(challenge => {
            challenge.active = false;
        });

        // Select challenge based on week rotation
        const challengeIndex = weekNumber % this.challengeTypes.length;
        const challengeType = this.challengeTypes[challengeIndex];

        const newChallenge = {
            id: `${challengeType.id}_${Date.now()}`,
            typeId: challengeType.id,
            title: challengeType.title,
            description: challengeType.description,
            icon: challengeType.icon,
            duration: challengeType.duration,
            type: challengeType.type,
            target: challengeType.target,
            reward: challengeType.reward,
            startDate: new Date().toISOString().split('T')[0],
            endDate: this.getEndDate(challengeType.duration),
            active: true,
            progress: {
                daysCompleted: 0,
                currentStreak: 0,
                bestStreak: 0,
                milestones: []
            },
            participants: {
                faidao: { participating: true, progress: 0 },
                filip: { participating: true, progress: 0 }
            }
        };

        this.activeChallenges.push(newChallenge);
        this.saveChallenges();

        return newChallenge;
    }

    getEndDate(duration) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);
        return endDate.toISOString().split('T')[0];
    }

    hasExpired(challenge) {
        const endDate = new Date(challenge.endDate);
        const now = new Date();
        return now > endDate;
    }

    updateChallengeProgress(entries) {
        const activeChallenge = this.activeChallenges.find(c => c.active);
        if (!activeChallenge) return;

        const relevantEntries = this.getRelevantEntries(entries, activeChallenge);
        const progress = this.calculateProgress(activeChallenge, relevantEntries);

        activeChallenge.progress = progress;

        // Check for completion
        if (this.isChallengeCompleted(activeChallenge, progress)) {
            this.completeChallenge(activeChallenge);
        }

        this.saveChallenges();
    }

    getRelevantEntries(entries, challenge) {
        const startDate = new Date(challenge.startDate);
        return entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate;
        }).slice(0, challenge.duration);
    }

    calculateProgress(challenge, entries) {
        switch (challenge.type) {
            case 'errors':
                return this.calculateErrorProgress(challenge, entries);
            case 'speed':
                return this.calculateSpeedProgress(challenge, entries);
            case 'consistency':
                return this.calculateConsistencyProgress(challenge, entries);
            case 'completion':
                return this.calculateCompletionProgress(challenge, entries);
            case 'improvement':
                return this.calculateImprovementProgress(challenge, entries);
            default:
                return challenge.progress;
        }
    }

    calculateErrorProgress(challenge, entries) {
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;

        entries.forEach(entry => {
            const faidaoErrors = (entry.faidao.errors.easy || 0) +
                               (entry.faidao.errors.medium || 0) +
                               (entry.faidao.errors.hard || 0);
            const filipErrors = (entry.filip.errors.easy || 0) +
                              (entry.filip.errors.medium || 0) +
                              (entry.filip.errors.hard || 0);

            const meetsTarget = faidaoErrors <= challenge.target.maxErrorsPerDay ||
                              filipErrors <= challenge.target.maxErrorsPerDay;

            if (meetsTarget) {
                tempStreak++;
                bestStreak = Math.max(bestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        });

        currentStreak = tempStreak;

        return {
            daysCompleted: entries.length,
            currentStreak,
            bestStreak,
            milestones: this.generateMilestones(challenge, currentStreak),
            percentage: Math.min((currentStreak / challenge.target.consecutiveDays) * 100, 100)
        };
    }

    calculateSpeedProgress(challenge, entries) {
        let currentStreak = 0;
        let totalTimeSum = 0;
        let validDays = 0;

        entries.forEach(entry => {
            const faidaoTotal = (entry.faidao.times.easy || 0) +
                               (entry.faidao.times.medium || 0) +
                               (entry.faidao.times.hard || 0);
            const filipTotal = (entry.filip.times.easy || 0) +
                              (entry.filip.times.medium || 0) +
                              (entry.filip.times.hard || 0);

            const betterTime = Math.min(faidaoTotal, filipTotal);

            if (betterTime > 0 && betterTime <= challenge.target.avgTotalTime) {
                currentStreak++;
                totalTimeSum += betterTime;
                validDays++;
            } else {
                currentStreak = 0;
            }
        });

        const avgTime = validDays > 0 ? totalTimeSum / validDays : 0;

        return {
            daysCompleted: entries.length,
            currentStreak,
            bestStreak: Math.max(challenge.progress?.bestStreak || 0, currentStreak),
            avgTime,
            milestones: this.generateMilestones(challenge, currentStreak),
            percentage: Math.min((currentStreak / challenge.target.consecutiveDays) * 100, 100)
        };
    }

    calculateConsistencyProgress(challenge, entries) {
        if (entries.length < 3) {
            return {
                daysCompleted: entries.length,
                currentStreak: 0,
                bestStreak: 0,
                milestones: [],
                percentage: 0
            };
        }

        // Calculate average score across all entries
        const allScores = [];
        entries.forEach(entry => {
            allScores.push(entry.faidao.scores.total, entry.filip.scores.total);
        });

        const avgScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
        const variationLimit = avgScore * (challenge.target.scoreVariation / 100);

        let currentStreak = 0;
        let tempStreak = 0;

        entries.forEach(entry => {
            const faidaoVariation = Math.abs(entry.faidao.scores.total - avgScore);
            const filipVariation = Math.abs(entry.filip.scores.total - avgScore);

            const meetsTarget = faidaoVariation <= variationLimit || filipVariation <= variationLimit;

            if (meetsTarget) {
                tempStreak++;
            } else {
                tempStreak = 0;
            }
        });

        currentStreak = tempStreak;

        return {
            daysCompleted: entries.length,
            currentStreak,
            bestStreak: Math.max(challenge.progress?.bestStreak || 0, currentStreak),
            avgScore,
            variationLimit,
            milestones: this.generateMilestones(challenge, currentStreak),
            percentage: Math.min((currentStreak / challenge.target.consecutiveDays) * 100, 100)
        };
    }

    calculateCompletionProgress(challenge, entries) {
        let currentStreak = 0;
        let tempStreak = 0;

        entries.forEach(entry => {
            const faidaoDNFs = entry.faidao.dnf.easy || entry.faidao.dnf.medium || entry.faidao.dnf.hard;
            const filipDNFs = entry.filip.dnf.easy || entry.filip.dnf.medium || entry.filip.dnf.hard;

            const meetsTarget = !faidaoDNFs || !filipDNFs;

            if (meetsTarget) {
                tempStreak++;
            } else {
                tempStreak = 0;
            }
        });

        currentStreak = tempStreak;

        return {
            daysCompleted: entries.length,
            currentStreak,
            bestStreak: Math.max(challenge.progress?.bestStreak || 0, currentStreak),
            milestones: this.generateMilestones(challenge, currentStreak),
            percentage: Math.min((currentStreak / challenge.target.consecutiveDays) * 100, 100)
        };
    }

    calculateImprovementProgress(challenge, entries) {
        let currentStreak = 0;

        for (let i = 1; i < entries.length; i++) {
            const prevEntry = entries[i - 1];
            const currEntry = entries[i];

            const prevBest = Math.max(prevEntry.faidao.scores.total, prevEntry.filip.scores.total);
            const currBest = Math.max(currEntry.faidao.scores.total, currEntry.filip.scores.total);

            if (currBest > prevBest) {
                currentStreak++;
            } else {
                break;
            }
        }

        return {
            daysCompleted: entries.length,
            currentStreak,
            bestStreak: Math.max(challenge.progress?.bestStreak || 0, currentStreak),
            milestones: this.generateMilestones(challenge, currentStreak),
            percentage: Math.min((currentStreak / challenge.target.consecutiveImprovement) * 100, 100)
        };
    }

    generateMilestones(challenge, currentProgress) {
        const milestones = [];
        const targetDays = challenge.target.consecutiveDays || challenge.target.consecutiveImprovement || challenge.duration;

        for (let i = 1; i <= targetDays; i++) {
            milestones.push({
                day: i,
                completed: currentProgress >= i,
                description: `Day ${i}`
            });
        }

        return milestones;
    }

    isChallengeCompleted(challenge, progress) {
        switch (challenge.type) {
            case 'errors':
            case 'speed':
            case 'completion':
                return progress.currentStreak >= challenge.target.consecutiveDays;
            case 'consistency':
                return progress.currentStreak >= challenge.target.consecutiveDays;
            case 'improvement':
                return progress.currentStreak >= challenge.target.consecutiveImprovement;
            default:
                return false;
        }
    }

    completeChallenge(challenge) {
        challenge.active = false;
        challenge.completedDate = new Date().toISOString().split('T')[0];

        this.completedChallenges.push({
            ...challenge,
            completedAt: new Date().toISOString()
        });

        this.saveCompletedChallenges();

        // Show completion notification
        sudokuApp.showAchievementNotification({
            title: 'Challenge Completed!',
            description: `${challenge.title} - Earned ${challenge.reward.points} points and title "${challenge.reward.title}"`
        });
    }

    updateChallenges(entries) {
        this.updateChallengeProgress(entries);
        this.renderCurrentChallenge();
        this.renderChallengeHistory();
    }

    renderCurrentChallenge() {
        const container = document.getElementById('currentChallenge');
        if (!container) return;

        const activeChallenge = this.activeChallenges.find(c => c.active);

        if (!activeChallenge) {
            container.innerHTML = `
                <div class="no-challenge">
                    <h3>No Active Challenge</h3>
                    <p>A new challenge will start automatically each week!</p>
                </div>
            `;
            return;
        }

        const progress = activeChallenge.progress;
        const daysRemaining = Math.max(0, activeChallenge.duration - progress.daysCompleted);

        container.innerHTML = `
            <div class="challenge-header">
                <div class="challenge-icon">
                    <i class="${activeChallenge.icon}"></i>
                </div>
                <div class="challenge-info">
                    <h3>${activeChallenge.title}</h3>
                    <p>${activeChallenge.description}</p>
                </div>
            </div>

            <div class="challenge-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                </div>
                <div class="progress-text">${Math.round(progress.percentage)}% Complete</div>
            </div>

            <div class="challenge-stats">
                <div class="stat-item">
                    <span class="stat-label">Current Streak</span>
                    <span class="stat-value">${progress.currentStreak}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Best Streak</span>
                    <span class="stat-value">${progress.bestStreak}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Days Remaining</span>
                    <span class="stat-value">${daysRemaining}</span>
                </div>
            </div>

            <div class="challenge-milestones">
                <h4>Progress Milestones</h4>
                <div class="milestones-grid">
                    ${progress.milestones.map(milestone => `
                        <div class="milestone ${milestone.completed ? 'completed' : ''}">
                            <div class="milestone-icon">
                                ${milestone.completed ? '<i class="fas fa-check"></i>' : '<i class="fas fa-circle"></i>'}
                            </div>
                            <span>${milestone.description}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="challenge-reward">
                <h4>Reward</h4>
                <div class="reward-info">
                    <span class="reward-points">${activeChallenge.reward.points} Points</span>
                    <span class="reward-title">Title: "${activeChallenge.reward.title}"</span>
                </div>
            </div>
        `;
    }

    renderChallengeHistory() {
        const container = document.getElementById('challengeHistory');
        if (!container) return;

        if (this.completedChallenges.length === 0) {
            container.innerHTML = '<div class="no-history">No completed challenges yet.</div>';
            return;
        }

        container.innerHTML = this.completedChallenges.map(challenge => `
            <div class="challenge-item completed">
                <div class="challenge-icon">
                    <i class="${challenge.icon}"></i>
                </div>
                <div class="challenge-details">
                    <h4>${challenge.title}</h4>
                    <p>Completed on ${new Date(challenge.completedDate).toLocaleDateString()}</p>
                    <div class="challenge-rewards">
                        <span class="points">+${challenge.reward.points} points</span>
                        <span class="title">"${challenge.reward.title}"</span>
                    </div>
                </div>
                <div class="challenge-status">
                    <i class="fas fa-trophy"></i>
                </div>
            </div>
        `).join('');
    }

    // Storage methods
    saveChallenges() {
        sudokuApp.saveChallenges();
    }

    async saveCompletedChallenges() {
        try {
            for (const challenge of this.completedChallenges) {
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
            console.error('Failed to save completed challenges:', error);
        }
    }

    async loadCompletedChallenges() {
        try {
            // Check for localStorage data first (migration)
            const localData = localStorage.getItem('sudokuCompletedChallenges');
            if (localData) {
                const challenges = JSON.parse(localData);
                // Migrate to database
                for (const challenge of challenges) {
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
                localStorage.removeItem('sudokuCompletedChallenges');
                return challenges;
            }

            const response = await fetch('/api/stats?type=challenges');
            if (!response.ok) {
                throw new Error('Failed to load challenges');
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to load completed challenges:', error);
            return [];
        }
    }
}

// Initialize challenges manager
window.challengesManager = new ChallengesManager();