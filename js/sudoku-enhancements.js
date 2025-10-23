/**
 * Sudoku UX Enhancements Module
 * Phase 4 improvements: Auto-pause, toast notifications, animations, etc.
 */

class SudokuEnhancements {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.toastContainer = null;
        this.init();
    }

    init() {
        this.setupAutoPause();
        this.setupToastSystem();
        this.setupEnhancedKeyboardShortcuts();
        this.setupMobileTouchImprovements();
    }

    // ===================================
    // 1. AUTO-PAUSE ON TAB SWITCH
    // ===================================
    setupAutoPause() {
        let wasPlayingBeforeHidden = false;

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Tab lost focus
                if (this.game.gameStarted && !this.game.gameCompleted && !this.game.gamePaused) {
                    wasPlayingBeforeHidden = true;
                    this.game.pauseGame();
                    this.showToast('Game auto-paused while away', 'info');
                }
            } else {
                // Tab regained focus
                if (wasPlayingBeforeHidden) {
                    // Don't auto-resume - let user decide
                    wasPlayingBeforeHidden = false;
                }
            }
        });
    }

    // ===================================
    // 2. TOAST NOTIFICATION SYSTEM
    // ===================================
    setupToastSystem() {
        // Create toast container if it doesn't exist
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
            this.toastContainer = container;
        } else {
            this.toastContainer = document.getElementById('toast-container');
        }
    }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;

        this.toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('toast-show'), 10);

        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    getToastIcon(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ⓘ'
        };
        return icons[type] || icons.info;
    }

    // ===================================
    // 3. ENHANCED KEYBOARD SHORTCUTS
    // ===================================
    setupEnhancedKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Prevent default for our shortcuts
            const shortcuts = ['h', 'p', 'u', 'c', 'r'];
            if (shortcuts.includes(e.key.toLowerCase()) || e.key === 'Escape') {
                e.preventDefault();
            }

            switch (e.key.toLowerCase()) {
                case 'h':
                    // Hint
                    if (this.game.gameStarted && !this.game.gameCompleted && !this.game.gamePaused) {
                        document.getElementById('hintBtn')?.click();
                    }
                    break;
                case 'p':
                    // Pause/Resume
                    if (this.game.gameStarted && !this.game.gameCompleted) {
                        document.getElementById('pauseBtn')?.click();
                    }
                    break;
                case 'u':
                    // Undo
                    if (this.game.gameStarted && !this.game.gameCompleted && !this.game.gamePaused) {
                        document.getElementById('undoBtn')?.click();
                    }
                    break;
                case 'c':
                    // Toggle candidate mode
                    if (this.game.gameStarted && !this.game.gameCompleted && !this.game.gamePaused) {
                        document.getElementById('candidateModeBtn')?.click();
                    }
                    break;
                case 'r':
                    // Redo (if available)
                    if (this.game.redo && this.game.gameStarted && !this.game.gameCompleted && !this.game.gamePaused) {
                        this.game.redo();
                    }
                    break;
                case 'escape':
                    // Close modals/deselect cell
                    if (this.game.selectedCell) {
                        this.game.selectedCell.classList.remove('selected');
                        this.game.selectedCell = null;
                    }
                    // Close any open modals
                    document.querySelectorAll('.modal.show').forEach(modal => {
                        modal.classList.remove('show');
                    });
                    break;
            }
        });
    }

    // ===================================
    // 4. MOBILE TOUCH IMPROVEMENTS
    // ===================================
    setupMobileTouchImprovements() {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile) return;

        // Prevent double-tap zoom on game grid
        const grid = document.querySelector('.sudoku-grid');
        if (grid) {
            grid.addEventListener('touchstart', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault(); // Prevent pinch zoom
                }
            }, { passive: false });

            // Swipe to undo
            this.setupSwipeGestures(grid);
        }

        // Haptic feedback on errors (if supported)
        this.enableHapticFeedback();
    }

    setupSwipeGestures(element) {
        let touchStartX = 0;
        let touchEndX = 0;

        element.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });

        const handleSwipe = () => {
            const swipeThreshold = 100;
            const diff = touchEndX - touchStartX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe right - undo
                    if (this.game.gameStarted && !this.game.gameCompleted && !this.game.gamePaused) {
                        document.getElementById('undoBtn')?.click();
                        this.showToast('Undo', 'info', 1000);
                    }
                }
            }
        };

        this.handleSwipe = handleSwipe;
    }

    enableHapticFeedback() {
        // Store original method
        this.originalHighlightConflicts = this.game.highlightConflicts;

        // Wrap with haptic feedback
        this.game.highlightConflicts = (...args) => {
            const result = this.originalHighlightConflicts.apply(this.game, args);

            // Trigger haptic on conflict
            if (result && navigator.vibrate) {
                navigator.vibrate(50); // Short vibration
            }

            return result;
        };
    }

    // ===================================
    // 5. VISUAL FEEDBACK ANIMATIONS
    // ===================================
    animateCellFill(cell) {
        cell.classList.add('cell-fill-animation');
        setTimeout(() => cell.classList.remove('cell-fill-animation'), 300);
    }

    animateCellError(cell) {
        cell.classList.add('cell-error-shake');
        setTimeout(() => cell.classList.remove('cell-error-shake'), 500);
    }

    animateHintGlow(cell) {
        cell.classList.add('cell-hint-glow');
        setTimeout(() => cell.classList.remove('cell-hint-glow'), 2000);
    }

    // ===================================
    // 6. COMPLETION CELEBRATION
    // ===================================
    showCompletionCelebration() {
        // Simple confetti effect
        this.createConfetti();
        this.showToast('🎉 Puzzle completed!', 'success', 4000);
    }

    createConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                document.body.appendChild(confetti);

                setTimeout(() => confetti.remove(), 4000);
            }, i * 30);
        }
    }

    // ===================================
    // 7. PROGRESS INDICATORS
    // ===================================
    updateProgressIndicator() {
        const totalCells = 81;
        let filledCells = 0;

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.game.grid[row][col] !== 0) {
                    filledCells++;
                }
            }
        }

        const percentage = Math.round((filledCells / totalCells) * 100);
        const remaining = totalCells - filledCells;

        // Update progress bar if it exists
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }

        // Update progress text
        const progressText = document.getElementById('progress-text');
        if (progressText) {
            progressText.textContent = `${filledCells}/${totalCells} (${percentage}%) · ${remaining} remaining`;
        }

        return { filledCells, totalCells, percentage, remaining };
    }

    // ===================================
    // 8. GAME STATE RECOVERY
    // ===================================
    checkForUnfinishedGame() {
        const currentPlayer = sessionStorage.getItem('currentPlayer');
        if (!currentPlayer) return null;

        const saveKey = `sudoku_save_${currentPlayer}`;
        const savedGame = localStorage.getItem(saveKey);

        if (!savedGame) return null;

        try {
            const gameData = JSON.parse(savedGame);

            // Check if game is not completed and was played recently (within 24 hours)
            if (!gameData.gameCompleted && gameData.lastSaved) {
                const lastSavedTime = new Date(gameData.lastSaved).getTime();
                const now = Date.now();
                const hoursSinceLastPlayed = (now - lastSavedTime) / (1000 * 60 * 60);

                if (hoursSinceLastPlayed < 24) {
                    return {
                        difficulty: gameData.currentDifficulty,
                        timeAgo: this.formatTimeAgo(hoursSinceLastPlayed),
                        data: gameData
                    };
                }
            }
        } catch (e) {
            console.error('Error checking for unfinished game:', e);
        }

        return null;
    }

    formatTimeAgo(hours) {
        if (hours < 1) {
            const minutes = Math.round(hours * 60);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        }
        return `${Math.round(hours)} hour${Math.round(hours) !== 1 ? 's' : ''} ago`;
    }

    async showRecoveryPrompt(gameInfo) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal show recovery-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h2>Resume Game?</h2>
                    <p>You have an unfinished <strong>${gameInfo.difficulty}</strong> puzzle from ${gameInfo.timeAgo}.</p>
                    <div class="modal-actions">
                        <button class="btn btn-primary" id="resumeGame">Resume</button>
                        <button class="btn btn-secondary" id="startFresh">Start Fresh</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('resumeGame').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });

            document.getElementById('startFresh').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });
        });
    }
}

// Export for use in sudoku.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SudokuEnhancements;
}
