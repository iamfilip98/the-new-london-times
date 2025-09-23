class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#b0b8c1'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#b0b8c1'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        };
    }

    updateCharts(entries) {
        if (entries.length === 0) {
            this.showNoDataMessage();
            return;
        }

        this.updateScoreChart(entries);
        this.updateTimeChart(entries);
        this.updateErrorChart(entries);
        this.updateStats(entries);
    }

    updateScoreChart(entries) {
        const ctx = document.getElementById('scoreChart');
        if (!ctx) return;

        // Get last 30 entries
        const recentEntries = entries.slice(0, 30).reverse();

        const labels = recentEntries.map(entry => new Date(entry.date).toLocaleDateString());
        const faidaoScores = recentEntries.map(entry => entry.faidao.scores.total);
        const filipScores = recentEntries.map(entry => entry.filip.scores.total);

        if (this.charts.scoreChart) {
            this.charts.scoreChart.destroy();
        }

        this.charts.scoreChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Faidao',
                        data: faidaoScores,
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Filip',
                        data: filipScores,
                        borderColor: '#4ecdc4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Score Trends Over Time',
                        color: '#ffffff'
                    }
                }
            }
        });
    }

    updateTimeChart(entries) {
        const ctx = document.getElementById('timeChart');
        if (!ctx) return;

        // Calculate average times by difficulty
        const difficulties = ['easy', 'medium', 'hard'];
        const players = ['faidao', 'filip'];

        const avgTimes = {};
        players.forEach(player => {
            avgTimes[player] = {};
            difficulties.forEach(difficulty => {
                const times = entries
                    .filter(entry => !entry[player].dnf[difficulty] && entry[player].times[difficulty] !== null)
                    .map(entry => entry[player].times[difficulty]);

                avgTimes[player][difficulty] = times.length > 0 ?
                    times.reduce((sum, time) => sum + time, 0) / times.length : 0;
            });
        });

        if (this.charts.timeChart) {
            this.charts.timeChart.destroy();
        }

        this.charts.timeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Easy', 'Medium', 'Hard'],
                datasets: [
                    {
                        label: 'Faidao (minutes)',
                        data: difficulties.map(diff => Math.round(avgTimes.faidao[diff] / 60 * 100) / 100),
                        backgroundColor: 'rgba(255, 107, 107, 0.8)',
                        borderColor: '#ff6b6b',
                        borderWidth: 2
                    },
                    {
                        label: 'Filip (minutes)',
                        data: difficulties.map(diff => Math.round(avgTimes.filip[diff] / 60 * 100) / 100),
                        backgroundColor: 'rgba(78, 205, 196, 0.8)',
                        borderColor: '#4ecdc4',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Average Completion Times',
                        color: '#ffffff'
                    }
                }
            }
        });
    }

    updateErrorChart(entries) {
        const ctx = document.getElementById('errorChart');
        if (!ctx) return;

        // Get last 30 entries for error trends
        const recentEntries = entries.slice(0, 30).reverse();

        const labels = recentEntries.map(entry => new Date(entry.date).toLocaleDateString());
        const faidaoErrors = recentEntries.map(entry => {
            return (entry.faidao.errors.easy || 0) +
                   (entry.faidao.errors.medium || 0) +
                   (entry.faidao.errors.hard || 0);
        });
        const filipErrors = recentEntries.map(entry => {
            return (entry.filip.errors.easy || 0) +
                   (entry.filip.errors.medium || 0) +
                   (entry.filip.errors.hard || 0);
        });

        if (this.charts.errorChart) {
            this.charts.errorChart.destroy();
        }

        this.charts.errorChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Faidao Errors',
                        data: faidaoErrors,
                        borderColor: '#fee140',
                        backgroundColor: 'rgba(254, 225, 64, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Filip Errors',
                        data: filipErrors,
                        borderColor: '#f093fb',
                        backgroundColor: 'rgba(240, 147, 251, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Error Trends Over Time',
                        color: '#ffffff'
                    }
                },
                scales: {
                    ...this.chartOptions.scales,
                    y: {
                        ...this.chartOptions.scales.y,
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateStats(entries) {
        this.updateWinRateStats(entries);
        this.updatePerformanceStats(entries);
        this.updateRecentFormStats(entries);
    }

    updateWinRateStats(entries) {
        const faidaoWinRateEl = document.getElementById('faidaoWinRate');
        const filipWinRateEl = document.getElementById('filipWinRate');
        const faidaoTrendEl = document.getElementById('faidaoWinTrend');
        const filipTrendEl = document.getElementById('filipWinTrend');
        const totalGamesEl = document.getElementById('totalGamesCount');

        if (!faidaoWinRateEl || !filipWinRateEl) return;

        if (entries.length === 0) {
            faidaoWinRateEl.textContent = '--';
            filipWinRateEl.textContent = '--';
            totalGamesEl.textContent = '0 games';
            if (faidaoTrendEl) faidaoTrendEl.innerHTML = '<i class="fas fa-minus"></i><span>--</span>';
            if (filipTrendEl) filipTrendEl.innerHTML = '<i class="fas fa-minus"></i><span>--</span>';
            return;
        }

        let faidaoWins = 0;
        let filipWins = 0;
        let ties = 0;

        entries.forEach(entry => {
            if (entry.faidao.scores.total > entry.filip.scores.total) {
                faidaoWins++;
            } else if (entry.filip.scores.total > entry.faidao.scores.total) {
                filipWins++;
            } else {
                ties++;
            }
        });

        const totalGames = entries.length;
        const faidaoWinRate = Math.round((faidaoWins / totalGames) * 100);
        const filipWinRate = Math.round((filipWins / totalGames) * 100);

        faidaoWinRateEl.textContent = `${faidaoWinRate}%`;
        filipWinRateEl.textContent = `${filipWinRate}%`;
        totalGamesEl.textContent = `${totalGames} games`;

        // Add winner class to the leading player
        const faidaoStatEl = faidaoWinRateEl.closest('.player-stat');
        const filipStatEl = filipWinRateEl.closest('.player-stat');

        faidaoStatEl?.classList.remove('winner');
        filipStatEl?.classList.remove('winner');

        if (faidaoWins > filipWins) {
            faidaoStatEl?.classList.add('winner');
        } else if (filipWins > faidaoWins) {
            filipStatEl?.classList.add('winner');
        }

        // Calculate trends from recent games
        if (entries.length >= 10) {
            const recentGames = entries.slice(0, 5);
            const olderGames = entries.slice(5, 10);

            const recentFaidaoWins = recentGames.filter(entry =>
                entry.faidao.scores.total > entry.filip.scores.total).length;
            const olderFaidaoWins = olderGames.filter(entry =>
                entry.faidao.scores.total > entry.filip.scores.total).length;

            const recentFaidaoWinRate = (recentFaidaoWins / recentGames.length) * 100;
            const olderFaidaoWinRate = (olderFaidaoWins / olderGames.length) * 100;
            const faidaoTrend = recentFaidaoWinRate - olderFaidaoWinRate;

            const recentFilipWins = recentGames.filter(entry =>
                entry.filip.scores.total > entry.faidao.scores.total).length;
            const olderFilipWins = olderGames.filter(entry =>
                entry.filip.scores.total > entry.faidao.scores.total).length;

            const recentFilipWinRate = (recentFilipWins / recentGames.length) * 100;
            const olderFilipWinRate = (olderFilipWins / olderGames.length) * 100;
            const filipTrend = recentFilipWinRate - olderFilipWinRate;

            this.updateTrendElement(faidaoTrendEl, faidaoTrend);
            this.updateTrendElement(filipTrendEl, filipTrend);
        } else {
            if (faidaoTrendEl) faidaoTrendEl.innerHTML = '<i class="fas fa-minus"></i><span>--</span>';
            if (filipTrendEl) filipTrendEl.innerHTML = '<i class="fas fa-minus"></i><span>--</span>';
        }
    }

    updatePerformanceStats(entries) {
        const faidaoScoreEl = document.getElementById('faidaoAvgScore');
        const filipScoreEl = document.getElementById('filipAvgScore');
        const faidaoTrendEl = document.getElementById('faidaoScoreTrend');
        const filipTrendEl = document.getElementById('filipScoreTrend');
        const scoreDiffEl = document.getElementById('scoreDifference');

        if (!faidaoScoreEl || !filipScoreEl) return;

        if (entries.length === 0) {
            faidaoScoreEl.textContent = '--';
            filipScoreEl.textContent = '--';
            scoreDiffEl.textContent = 'tied';
            if (faidaoTrendEl) faidaoTrendEl.innerHTML = '<i class="fas fa-minus"></i><span>--</span>';
            if (filipTrendEl) filipTrendEl.innerHTML = '<i class="fas fa-minus"></i><span>--</span>';
            return;
        }

        // Calculate average scores
        const faidaoAvg = Math.round(entries.reduce((sum, entry) =>
            sum + entry.faidao.scores.total, 0) / entries.length);
        const filipAvg = Math.round(entries.reduce((sum, entry) =>
            sum + entry.filip.scores.total, 0) / entries.length);

        faidaoScoreEl.textContent = faidaoAvg;
        filipScoreEl.textContent = filipAvg;

        // Show score difference
        const diff = Math.abs(faidaoAvg - filipAvg);
        if (faidaoAvg > filipAvg) {
            scoreDiffEl.textContent = `+${diff} ahead`;
        } else if (filipAvg > faidaoAvg) {
            scoreDiffEl.textContent = `+${diff} ahead`;
        } else {
            scoreDiffEl.textContent = 'tied';
        }

        // Add winner class
        const faidaoStatEl = faidaoScoreEl.closest('.player-stat');
        const filipStatEl = filipScoreEl.closest('.player-stat');

        faidaoStatEl?.classList.remove('winner');
        filipStatEl?.classList.remove('winner');

        if (faidaoAvg > filipAvg) {
            faidaoStatEl?.classList.add('winner');
        } else if (filipAvg > faidaoAvg) {
            filipStatEl?.classList.add('winner');
        }

        // Calculate trends
        if (entries.length >= 10) {
            const recentEntries = entries.slice(0, 5);
            const olderEntries = entries.slice(5, 10);

            const faidaoRecentAvg = recentEntries.reduce((sum, entry) =>
                sum + entry.faidao.scores.total, 0) / recentEntries.length;
            const faidaoOlderAvg = olderEntries.reduce((sum, entry) =>
                sum + entry.faidao.scores.total, 0) / olderEntries.length;
            const faidaoTrend = faidaoRecentAvg - faidaoOlderAvg;

            const filipRecentAvg = recentEntries.reduce((sum, entry) =>
                sum + entry.filip.scores.total, 0) / recentEntries.length;
            const filipOlderAvg = olderEntries.reduce((sum, entry) =>
                sum + entry.filip.scores.total, 0) / olderEntries.length;
            const filipTrend = filipRecentAvg - filipOlderAvg;

            this.updateTrendElement(faidaoTrendEl, faidaoTrend);
            this.updateTrendElement(filipTrendEl, filipTrend);
        } else {
            if (faidaoTrendEl) faidaoTrendEl.innerHTML = '<i class="fas fa-minus"></i><span>--</span>';
            if (filipTrendEl) filipTrendEl.innerHTML = '<i class="fas fa-minus"></i><span>--</span>';
        }
    }

    updateRecentFormStats(entries) {
        const faidaoFormEl = document.getElementById('faidaoRecentForm');
        const filipFormEl = document.getElementById('filipRecentForm');
        const faidaoTrendEl = document.getElementById('faidaoFormTrend');
        const filipTrendEl = document.getElementById('filipFormTrend');
        const formNoteEl = document.getElementById('recentFormNote');

        if (!faidaoFormEl || !filipFormEl) return;

        const recentCount = Math.min(5, entries.length);

        if (entries.length === 0) {
            faidaoFormEl.textContent = '--';
            filipFormEl.textContent = '--';
            formNoteEl.textContent = 'No games yet';
            if (faidaoTrendEl) faidaoTrendEl.innerHTML = '<i class="fas fa-minus"></i><span>--</span>';
            if (filipTrendEl) filipTrendEl.innerHTML = '<i class="fas fa-minus"></i><span>--</span>';
            return;
        }

        const recentGames = entries.slice(0, recentCount);

        // Count wins in recent games
        let faidaoRecentWins = 0;
        let filipRecentWins = 0;

        recentGames.forEach(entry => {
            if (entry.faidao.scores.total > entry.filip.scores.total) {
                faidaoRecentWins++;
            } else if (entry.filip.scores.total > entry.faidao.scores.total) {
                filipRecentWins++;
            }
        });

        faidaoFormEl.textContent = `${faidaoRecentWins}/${recentCount}`;
        filipFormEl.textContent = `${filipRecentWins}/${recentCount}`;
        formNoteEl.textContent = `Last ${recentCount} games`;

        // Add winner class for recent form
        const faidaoStatEl = faidaoFormEl.closest('.player-stat');
        const filipStatEl = filipFormEl.closest('.player-stat');

        faidaoStatEl?.classList.remove('winner');
        filipStatEl?.classList.remove('winner');

        if (faidaoRecentWins > filipRecentWins) {
            faidaoStatEl?.classList.add('winner');
        } else if (filipRecentWins > faidaoRecentWins) {
            filipStatEl?.classList.add('winner');
        }

        // Show recent form trends (win streak indicator)
        const faidaoStreak = this.calculateWinStreak(entries, 'faidao');
        const filipStreak = this.calculateWinStreak(entries, 'filip');

        this.updateStreakTrend(faidaoTrendEl, faidaoStreak);
        this.updateStreakTrend(filipTrendEl, filipStreak);
    }

    calculateWinStreak(entries, player) {
        let streak = 0;
        for (const entry of entries) {
            const playerScore = entry[player].scores.total;
            const opponentScore = entry[player === 'faidao' ? 'filip' : 'faidao'].scores.total;

            if (playerScore > opponentScore) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    updateTrendElement(element, trend) {
        if (!element) return;

        const trendClass = trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral';
        const icon = trend > 0 ? 'fa-arrow-up' : trend < 0 ? 'fa-arrow-down' : 'fa-minus';

        element.className = `stat-trend ${trendClass}`;
        element.innerHTML = `<i class="fas ${icon}"></i><span>${Math.abs(Math.round(trend))}</span>`;
    }

    updateStreakTrend(element, streak) {
        if (!element) return;

        const trendClass = streak > 2 ? 'positive' : streak === 0 ? 'negative' : 'neutral';
        const icon = streak > 2 ? 'fa-fire' : streak === 0 ? 'fa-ice-cube' : 'fa-minus';

        element.className = `stat-trend ${trendClass}`;
        element.innerHTML = `<i class="fas ${icon}"></i><span>${streak}W</span>`;
    }

    showNoDataMessage() {
        const chartContainers = ['scoreChart', 'timeChart', 'errorChart'];
        chartContainers.forEach(chartId => {
            const container = document.getElementById(chartId);
            if (container) {
                container.innerHTML = '<div class="no-data-message">No data available. Start competing to see analytics!</div>';
            }
        });
    }

    getDetailedAnalytics(entries) {
        if (entries.length === 0) return null;

        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        const analytics = {
            overview: {
                totalGames: entries.length,
                dateRange: {
                    from: entries[entries.length - 1].date,
                    to: entries[0].date
                }
            },
            players: {}
        };

        players.forEach(player => {
            const playerEntries = entries.map(entry => entry[player]);

            // Win stats
            const wins = entries.filter(entry =>
                entry[player].scores.total > entry[player === 'faidao' ? 'filip' : 'faidao'].scores.total
            ).length;

            // Score stats
            const scores = playerEntries.map(p => p.scores.total);
            const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            const bestScore = Math.max(...scores);
            const worstScore = Math.min(...scores);

            // Time stats by difficulty
            const timeStats = {};
            difficulties.forEach(difficulty => {
                const times = playerEntries
                    .filter(p => !p.dnf[difficulty] && p.times[difficulty] !== null)
                    .map(p => p.times[difficulty]);

                if (times.length > 0) {
                    timeStats[difficulty] = {
                        avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
                        bestTime: Math.min(...times),
                        worstTime: Math.max(...times),
                        completionRate: (times.length / entries.length) * 100
                    };
                }
            });

            // Error stats
            const totalErrors = playerEntries.reduce((sum, p) => {
                return sum + (p.errors.easy || 0) + (p.errors.medium || 0) + (p.errors.hard || 0);
            }, 0);

            analytics.players[player] = {
                wins,
                winRate: (wins / entries.length) * 100,
                scores: {
                    average: Math.round(avgScore),
                    best: bestScore,
                    worst: worstScore
                },
                times: timeStats,
                errors: {
                    total: totalErrors,
                    average: totalErrors / entries.length,
                    perfectGames: playerEntries.filter(p =>
                        (p.errors.easy || 0) + (p.errors.medium || 0) + (p.errors.hard || 0) === 0
                    ).length
                }
            };
        });

        return analytics;
    }

    exportAnalytics(entries) {
        const analytics = this.getDetailedAnalytics(entries);
        if (!analytics) return;

        const dataStr = JSON.stringify(analytics, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'sudoku-analytics.json';
        link.click();

        URL.revokeObjectURL(url);
    }
}

// Initialize analytics manager
window.analyticsManager = new AnalyticsManager();