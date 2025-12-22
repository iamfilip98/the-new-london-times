class ThemeManager {
    constructor() {
        this.currentTheme = 'default';
        this.themes = this.initializeThemes();
        this.init();
    }

    init() {
        this.applyTheme();
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
            }
        };
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

        // Update page title and icons
        this.updateThemeUI(theme);
    }

    updateThemeUI(theme) {
        // Update navigation brand icon
        const brandIcon = document.querySelector('.nav-brand i');
        if (brandIcon) {
            brandIcon.className = theme.icon;
        }

        // Remove any theme classes from body
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add('theme-default');
    }

    getThemeInfo() {
        return this.themes[this.currentTheme];
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
