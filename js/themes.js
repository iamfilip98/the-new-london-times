class ThemeManager {
    constructor() {
        this.currentTheme = null;
        this.themes = this.initializeThemes();
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
                    primary: '#ff6b35',
                    secondary: '#2d1b69',
                    accent: '#ff9500',
                    background: 'linear-gradient(135deg, #2d1b69 0%, #ff6b35 100%)'
                },
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
                icon: 'fas fa-sun',
                active: this.isSummerSeason(),
                sudokuStyle: {
                    gridBorder: '#ff4500',
                    cellHighlight: '#ff6347'
                }
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

        // Add seasonal animations
        this.addSeasonalAnimations();

        // Store current theme
        localStorage.setItem('currentTheme', this.currentTheme);

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
            `;
        }
    }

    setupThemeControls() {
        // Theme selector removed - themes change automatically

        // Listen for theme changes
        document.addEventListener('themeChange', (e) => {
            this.currentTheme = e.detail.theme;
            this.applyTheme();
        });
    }


    selectTheme(themeKey) {
        this.currentTheme = themeKey;
        localStorage.setItem('selectedTheme', themeKey);
        this.applyTheme();

        // Trigger theme change event
        document.dispatchEvent(new CustomEvent('themeChange', {
            detail: { theme: themeKey }
        }));
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


    // Seasonal animations
    addSeasonalAnimations() {
        // Remove any existing seasonal animation container
        const existing = document.getElementById('seasonal-animation-container');
        if (existing) {
            existing.remove();
        }

        // Only add animations for seasonal themes
        if (this.currentTheme === 'default') return;

        const container = document.createElement('div');
        container.id = 'seasonal-animation-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        `;

        // Add theme-specific animations
        switch (this.currentTheme) {
            case 'christmas':
                this.createSnowfall(container);
                break;
            case 'halloween':
                this.createFloatingGhosts(container);
                break;
            case 'valentines':
                this.createFloatingHearts(container);
                break;
            case 'spring':
                this.createFlowerPetals(container);
                break;
            case 'newYear':
                this.createSparkles(container);
                break;
        }

        document.body.appendChild(container);
    }

    createSnowfall(container) {
        for (let i = 0; i < 30; i++) {
            const snowflake = document.createElement('div');
            snowflake.textContent = '❄';
            snowflake.style.cssText = `
                position: absolute;
                top: -20px;
                left: ${Math.random() * 100}%;
                font-size: ${Math.random() * 10 + 10}px;
                color: rgba(255, 255, 255, 0.8);
                animation: snowfall ${Math.random() * 3 + 2}s linear infinite;
                animation-delay: ${Math.random() * 5}s;
                will-change: transform, opacity;
                contain: layout style paint;
            `;
            container.appendChild(snowflake);
        }
    }

    createFloatingGhosts(container) {
        for (let i = 0; i < 15; i++) {
            const ghost = document.createElement('div');
            ghost.textContent = '👻';
            ghost.style.cssText = `
                position: absolute;
                top: ${Math.random() * 100}%;
                left: -50px;
                font-size: ${Math.random() * 20 + 20}px;
                opacity: 0.6;
                animation: floatGhost ${Math.random() * 10 + 15}s linear infinite;
                animation-delay: ${Math.random() * 10}s;
                will-change: transform;
                contain: layout style paint;
            `;
            container.appendChild(ghost);
        }
    }

    createFloatingHearts(container) {
        for (let i = 0; i < 20; i++) {
            const heart = document.createElement('div');
            heart.textContent = '💕';
            heart.style.cssText = `
                position: absolute;
                bottom: -20px;
                left: ${Math.random() * 100}%;
                font-size: ${Math.random() * 15 + 15}px;
                animation: floatUp ${Math.random() * 4 + 3}s ease-in infinite;
                animation-delay: ${Math.random() * 5}s;
                will-change: transform, opacity;
                contain: layout style paint;
            `;
            container.appendChild(heart);
        }
    }

    createFlowerPetals(container) {
        const petals = ['🌸', '🌺', '🌼', '🌻', '🌷'];
        for (let i = 0; i < 20; i++) {
            const petal = document.createElement('div');
            petal.textContent = petals[Math.floor(Math.random() * petals.length)];
            petal.style.cssText = `
                position: absolute;
                top: -20px;
                left: ${Math.random() * 100}%;
                font-size: ${Math.random() * 15 + 10}px;
                animation: petalFall ${Math.random() * 5 + 5}s ease-in infinite;
                animation-delay: ${Math.random() * 5}s;
                will-change: transform, opacity;
                contain: layout style paint;
            `;
            container.appendChild(petal);
        }
    }

    createSparkles(container) {
        for (let i = 0; i < 25; i++) {
            const sparkle = document.createElement('div');
            sparkle.textContent = '✨';
            sparkle.style.cssText = `
                position: absolute;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                font-size: ${Math.random() * 15 + 10}px;
                animation: sparkle ${Math.random() * 2 + 1}s ease-in-out infinite;
                animation-delay: ${Math.random() * 3}s;
                will-change: transform, opacity;
                contain: layout style paint;
            `;
            container.appendChild(sparkle);
        }
    }
}

// Global theme manager instance
window.themeManager = null;

// Initialize theme manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.themeManager = new ThemeManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}