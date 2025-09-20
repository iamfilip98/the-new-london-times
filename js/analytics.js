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
        this.updateImprovementStats(entries);
    }

    updateWinRateStats(entries) {
        const statsContainer = document.getElementById('winRateStats');
        if (!statsContainer) return;

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
        const faidaoWinRate = totalGames > 0 ? Math.round((faidaoWins / totalGames) * 100) : 0;
        const filipWinRate = totalGames > 0 ? Math.round((filipWins / totalGames) * 100) : 0;

        statsContainer.innerHTML = `
            <div class="win-rate-item">
                <span class="player-name faidao-color">Faidao</span>
                <span class="win-rate">${faidaoWinRate}%</span>
                <span class="win-count">(${faidaoWins}/${totalGames})</span>
            </div>
            <div class="win-rate-item">
                <span class="player-name filip-color">Filip</span>
                <span class="win-rate">${filipWinRate}%</span>
                <span class="win-count">(${filipWins}/${totalGames})</span>
            </div>
            <div class="win-rate-item">
                <span class="player-name">Ties</span>
                <span class="win-rate">${Math.round((ties / totalGames) * 100)}%</span>
                <span class="win-count">(${ties}/${totalGames})</span>
            </div>
        `;
    }

    updatePerformanceStats(entries) {
        const statsContainer = document.getElementById('avgPerformanceStats');
        if (!statsContainer) return;

        if (entries.length === 0) {
            statsContainer.innerHTML = '<p>No data available</p>';
            return;
        }

        // Calculate averages
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        const stats = {};
        players.forEach(player => {
            const totalScore = entries.reduce((sum, entry) => sum + entry[player].scores.total, 0);
            const avgScore = totalScore / entries.length;

            const totalErrors = entries.reduce((sum, entry) => {
                return sum + (entry[player].errors.easy || 0) +
                       (entry[player].errors.medium || 0) +
                       (entry[player].errors.hard || 0);
            }, 0);
            const avgErrors = totalErrors / entries.length;

            stats[player] = {
                avgScore: Math.round(avgScore),
                avgErrors: Math.round(avgErrors * 100) / 100
            };
        });

        statsContainer.innerHTML = `
            <div class="performance-item">
                <h5>Average Score</h5>
                <div class="performance-comparison">
                    <span class="faidao-color">Faidao: ${stats.faidao.avgScore}</span>
                    <span class="filip-color">Filip: ${stats.filip.avgScore}</span>
                </div>
            </div>
            <div class="performance-item">
                <h5>Average Errors</h5>
                <div class="performance-comparison">
                    <span class="faidao-color">Faidao: ${stats.faidao.avgErrors}</span>
                    <span class="filip-color">Filip: ${stats.filip.avgErrors}</span>
                </div>
            </div>
        `;
    }

    updateImprovementStats(entries) {
        const statsContainer = document.getElementById('improvementStats');
        if (!statsContainer) return;

        if (entries.length < 2) {
            statsContainer.innerHTML = '<p>Need more data to show improvement</p>';
            return;
        }

        // Compare first 5 and last 5 entries
        const firstEntries = entries.slice(-5); // Oldest 5
        const lastEntries = entries.slice(0, 5); // Newest 5

        const getAvgScore = (entryGroup, player) => {
            const total = entryGroup.reduce((sum, entry) => sum + entry[player].scores.total, 0);
            return total / entryGroup.length;
        };

        const faidaoOld = getAvgScore(firstEntries, 'faidao');
        const faidaoNew = getAvgScore(lastEntries, 'faidao');
        const filipOld = getAvgScore(firstEntries, 'filip');
        const filipNew = getAvgScore(lastEntries, 'filip');

        const faidaoImprovement = ((faidaoNew - faidaoOld) / faidaoOld) * 100;
        const filipImprovement = ((filipNew - filipOld) / filipOld) * 100;

        statsContainer.innerHTML = `
            <div class="improvement-item">
                <span class="player-name faidao-color">Faidao</span>
                <span class="improvement ${faidaoImprovement >= 0 ? 'positive' : 'negative'}">
                    ${faidaoImprovement >= 0 ? '+' : ''}${Math.round(faidaoImprovement)}%
                </span>
            </div>
            <div class="improvement-item">
                <span class="player-name filip-color">Filip</span>
                <span class="improvement ${filipImprovement >= 0 ? 'positive' : 'negative'}">
                    ${filipImprovement >= 0 ? '+' : ''}${Math.round(filipImprovement)}%
                </span>
            </div>
        `;
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