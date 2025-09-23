class ThemeManager {
    constructor() {
        this.currentTheme = null;
        this.themes = this.initializeThemes();
        this.specialEvents = this.initializeSpecialEvents();

        this.init();
    }

    init() {
        this.detectCurrentTheme();
        this.applyTheme();
        this.setupThemeControls();
    }

    initializeThemes() {
        return {
            default: {
                name: 'Classic',
                colors: {
                    primary: '#667eea',
                    secondary: '#764ba2',
                    accent: '#4facfe',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                },
                multiplier: 1.0,
                icon: 'fas fa-puzzle-piece'
            },

            halloween: {
                name: 'Halloween Spooky',
                colors: {
                    primary: '#ff6b35',
                    secondary: '#2d1b69',
                    accent: '#ff9500',
                    background: 'linear-gradient(135deg, #2d1b69 0%, #ff6b35 100%)'
                },
                multiplier: 1.25,
                icon: 'fas fa-ghost',
                active: this.isHalloweenSeason(),
                sudokuStyle: {
                    gridBorder: '#ff6b35',
                    cellHighlight: '#ff9500'
                }
            },

            christmas: {
                name: 'Christmas Magic',
                colors: {
                    primary: '#c41e3a',
                    secondary: '#0f7b0f',
                    accent: '#ffd700',
                    background: 'linear-gradient(135deg, #0f7b0f 0%, #c41e3a 100%)'
                },
                multiplier: 1.3,
                icon: 'fas fa-gift',
                active: this.isChristmasSeason(),
                sudokuStyle: {
                    gridBorder: '#c41e3a',
                    cellHighlight: '#ffd700'
                }
            },

            newYear: {
                name: 'New Year Celebration',
                colors: {
                    primary: '#ffd700',
                    secondary: '#4b0082',
                    accent: '#ff69b4',
                    background: 'linear-gradient(135deg, #4b0082 0%, #ffd700 100%)'
                },
                multiplier: 1.4,
                icon: 'fas fa-champagne-glasses',
                active: this.isNewYearSeason(),
                sudokuStyle: {
                    gridBorder: '#ffd700',
                    cellHighlight: '#ff69b4'
                }
            },

            valentines: {
                name: 'Valentine\'s Love',
                colors: {
                    primary: '#e91e63',
                    secondary: '#ff69b4',
                    accent: '#ffb6c1',
                    background: 'linear-gradient(135deg, #e91e63 0%, #ff69b4 100%)'
                },
                multiplier: 1.2,
                icon: 'fas fa-heart',
                active: this.isValentinesSeason(),
                sudokuStyle: {
                    gridBorder: '#e91e63',
                    cellHighlight: '#ffb6c1'
                }
            },

            spring: {
                name: 'Spring Bloom',
                colors: {
                    primary: '#32cd32',
                    secondary: '#ffb347',
                    accent: '#98fb98',
                    background: 'linear-gradient(135deg, #32cd32 0%, #ffb347 100%)'
                },
                multiplier: 1.15,
                icon: 'fas fa-seedling',
                active: this.isSpringSeason(),
                sudokuStyle: {
                    gridBorder: '#32cd32',
                    cellHighlight: '#98fb98'
                }
            },

            summer: {
                name: 'Summer Vibes',
                colors: {
                    primary: '#ff4500',
                    secondary: '#ffd700',
                    accent: '#ff6347',
                    background: 'linear-gradient(135deg, #ff4500 0%, #ffd700 100%)'
                },
                multiplier: 1.1,
                icon: 'fas fa-sun',
                active: this.isSummerSeason(),
                sudokuStyle: {
                    gridBorder: '#ff4500',
                    cellHighlight: '#ff6347'
                }
            }
        };
    }

    initializeSpecialEvents() {
        return {
            perfectMonth: {
                name: 'Perfect Month Challenge',
                description: 'Complete every puzzle in a month with zero errors',
                reward: 'Perfect Champion Badge',
                multiplier: 2.0,
                achievementId: 'perfect_month'
            },

            speedWeek: {
                name: 'Speed Week',
                description: 'Beat your personal best times',
                reward: 'Speed Demon Badge',
                multiplier: 1.5,
                achievementId: 'speed_week'
            },

            hintsChallenge: {
                name: 'No Hints November',
                description: 'Complete puzzles without using any hints',
                reward: 'Pure Solver Badge',
                multiplier: 1.8,
                achievementId: 'no_hints_november'
            }
        };
    }

    detectCurrentTheme() {
        // Check for active seasonal themes
        for (const [key, theme] of Object.entries(this.themes)) {
            if (theme.active && key !== 'default') {
                this.currentTheme = key;
                return;
            }
        }

        // Check for manually selected theme
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme && this.themes[savedTheme]) {
            this.currentTheme = savedTheme;
            return;
        }

        // Default theme
        this.currentTheme = 'default';
    }

    applyTheme() {
        const theme = this.themes[this.currentTheme];
        if (!theme) return;

        // Update CSS custom properties
        const root = document.documentElement;
        root.style.setProperty('--theme-primary', theme.colors.primary);
        root.style.setProperty('--theme-secondary', theme.colors.secondary);
        root.style.setProperty('--theme-accent', theme.colors.accent);
        root.style.setProperty('--primary-gradient', theme.colors.background);

        // Apply Sudoku-specific styling if available
        if (theme.sudokuStyle) {
            root.style.setProperty('--sudoku-grid-border', theme.sudokuStyle.gridBorder);
            root.style.setProperty('--sudoku-cell-highlight', theme.sudokuStyle.cellHighlight);
        }

        // Update page title and icons
        this.updateThemeUI(theme);

        // Store current theme
        localStorage.setItem('currentTheme', this.currentTheme);

        console.log(`Applied theme: ${theme.name} (${this.currentTheme})`);
    }

    updateThemeUI(theme) {
        // Update navigation brand icon
        const brandIcon = document.querySelector('.nav-brand i');
        if (brandIcon) {
            brandIcon.className = theme.icon;
        }

        // Add theme class to body
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${this.currentTheme}`);

        // Update theme indicator if it exists
        const themeIndicator = document.getElementById('themeIndicator');
        if (themeIndicator) {
            themeIndicator.innerHTML = `
                <i class="${theme.icon}"></i>
                <span>${theme.name}</span>
                ${theme.multiplier > 1 ? `<span class="multiplier">×${theme.multiplier}</span>` : ''}
            `;
        }
    }

    setupThemeControls() {
        // Create theme selector if it doesn't exist
        this.createThemeSelector();

        // Listen for theme changes
        document.addEventListener('themeChange', (e) => {
            this.currentTheme = e.detail.theme;
            this.applyTheme();
        });
    }

    createThemeSelector() {
        const navUser = document.querySelector('.nav-user');
        if (!navUser) return;

        // Check if theme selector already exists
        if (document.getElementById('themeSelector')) return;

        const themeSelector = document.createElement('div');
        themeSelector.id = 'themeSelector';
        themeSelector.className = 'theme-selector';
        themeSelector.innerHTML = `
            <button class="theme-toggle-btn" title="Change Theme">
                <i class="${this.themes[this.currentTheme].icon}"></i>
            </button>
            <div class="theme-dropdown">
                ${Object.entries(this.themes).map(([key, theme]) => `
                    <div class="theme-option ${key === this.currentTheme ? 'active' : ''}"
                         data-theme="${key}"
                         ${!theme.active && key !== 'default' && key !== this.currentTheme ? 'style="opacity: 0.5;"' : ''}>
                        <i class="${theme.icon}"></i>
                        <span>${theme.name}</span>
                        ${theme.multiplier > 1 ? `<span class="multiplier">×${theme.multiplier}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        navUser.insertBefore(themeSelector, navUser.firstChild);

        // Add event listeners
        const toggleBtn = themeSelector.querySelector('.theme-toggle-btn');
        const dropdown = themeSelector.querySelector('.theme-dropdown');

        toggleBtn.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });

        themeSelector.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                if (this.themes[theme].active || theme === 'default') {
                    this.selectTheme(theme);
                    dropdown.classList.remove('show');
                }
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!themeSelector.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }

    selectTheme(themeKey) {
        this.currentTheme = themeKey;
        localStorage.setItem('selectedTheme', themeKey);
        this.applyTheme();

        // Update dropdown
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === themeKey);
        });

        // Trigger theme change event
        document.dispatchEvent(new CustomEvent('themeChange', {
            detail: { theme: themeKey }
        }));
    }

    getCurrentMultiplier() {
        const theme = this.themes[this.currentTheme];
        return theme ? theme.multiplier : 1.0;
    }

    getThemeInfo() {
        return this.themes[this.currentTheme];
    }

    // Seasonal detection methods
    isHalloweenSeason() {
        const now = new Date();
        const month = now.getMonth();
        return month === 9; // October (0-indexed)
    }

    isChristmasSeason() {
        const now = new Date();
        const month = now.getMonth();
        return month === 11; // December
    }

    isNewYearSeason() {
        const now = new Date();
        const month = now.getMonth();
        const day = now.getDate();
        return month === 0 && day <= 7; // First week of January
    }

    isValentinesSeason() {
        const now = new Date();
        const month = now.getMonth();
        return month === 1; // February
    }

    isSpringSeason() {
        const now = new Date();
        const month = now.getMonth();
        return month >= 2 && month <= 4; // March-May
    }

    isSummerSeason() {
        const now = new Date();
        const month = now.getMonth();
        return month >= 5 && month <= 7; // June-August
    }

    // Special event methods
    checkSpecialEvents() {
        const activeEvents = [];
        const now = new Date();

        // Check for active special events
        Object.entries(this.specialEvents).forEach(([key, event]) => {
            if (this.isEventActive(key, now)) {
                activeEvents.push({...event, id: key});
            }
        });

        return activeEvents;
    }

    isEventActive(eventKey, date = new Date()) {
        switch (eventKey) {
            case 'perfectMonth':
                return date.getDate() === 1; // Active on first day of each month

            case 'speedWeek':
                // Active first week of each month
                return date.getDate() <= 7;

            case 'hintsChallenge':
                return date.getMonth() === 10; // November

            default:
                return false;
        }
    }

    displayActiveEvents() {
        const activeEvents = this.checkSpecialEvents();
        if (activeEvents.length === 0) return;

        // Create or update events display
        let eventsContainer = document.getElementById('specialEventsContainer');
        if (!eventsContainer) {
            eventsContainer = document.createElement('div');
            eventsContainer.id = 'specialEventsContainer';
            eventsContainer.className = 'special-events-container';

            const dashboard = document.getElementById('dashboard');
            if (dashboard) {
                dashboard.insertBefore(eventsContainer, dashboard.firstChild);
            }
        }

        eventsContainer.innerHTML = `
            <div class="special-events-header">
                <h3><i class="fas fa-star"></i> Special Events Active!</h3>
            </div>
            <div class="events-grid">
                ${activeEvents.map(event => `
                    <div class="event-card">
                        <div class="event-name">${event.name}</div>
                        <div class="event-description">${event.description}</div>
                        <div class="event-reward">
                            <i class="fas fa-trophy"></i>
                            ${event.reward}
                        </div>
                        <div class="event-multiplier">
                            Score Multiplier: ×${event.multiplier}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Achievement integration
    checkThemeAchievements(gameData) {
        const achievements = [];

        // Theme-specific achievements
        if (this.currentTheme === 'halloween' && gameData.errors === 0) {
            achievements.push({
                id: 'spooky_perfect',
                name: 'Spooky Perfection',
                description: 'Complete a Halloween puzzle with zero errors'
            });
        }

        if (this.currentTheme === 'christmas' && gameData.time < 300) {
            achievements.push({
                id: 'christmas_speedster',
                name: 'Christmas Speedster',
                description: 'Complete a Christmas puzzle in under 5 minutes'
            });
        }

        return achievements;
    }
}

// Global theme manager instance
window.themeManager = null;

// Initialize theme manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.themeManager = new ThemeManager();

    // Display active special events
    setTimeout(() => {
        window.themeManager.displayActiveEvents();
    }, 1000);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}