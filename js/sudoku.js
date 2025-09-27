class SudokuEngine {
    constructor() {
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.initialGrid = Array(9).fill().map(() => Array(9).fill(0));
        this.playerGrid = Array(9).fill().map(() => Array(9).fill(0));
        this.lockedGrid = Array(9).fill().map(() => Array(9).fill(false));
        this.candidates = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
        this.manualCandidates = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
        this.removedCandidates = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
        this.selectedCell = null;
        this.timer = 0;
        this.timerInterval = null;
        this.hints = 0;
        this.errors = 0;
        this.hintTimePenalty = 0; // Track actual time penalty for scoring
        this.currentHintCell = null; // Track which cell is being hinted
        this.hintState = 'none'; // 'none', 'pointing', 'revealed'
        this.currentDifficulty = 'easy';
        this.gameStarted = false;
        this.gameCompleted = false;
        this.candidateMode = false;
        this.showAllCandidates = false;
        this.gamePaused = false;
        this.moveHistory = [];
        this.autoSaveInterval = null;
        this.explicitlySelectedDifficulty = false; // Track if user explicitly selected difficulty
        this.lastPuzzleDate = null; // Track puzzle date for auto-refresh
        this.dailyRefreshInterval = null; // Auto-refresh timer

        // New NYT-style features
        this.autoCheckErrors = true;
        this.showTimer = true;
        this.autoSave = true;
        this.soundLevel = 'medium';
        this.inputSoundType = 'classic';
        this.streakCount = 0;
        this.bestTime = { easy: null, medium: null, hard: null };
    }

    // Initialize Sudoku UI and game
    async init() {
        this.loadSettings();
        this.createSudokuInterface();

        // INSTANT LOADING: Generate fallback puzzles immediately before any async operations
        if (!this.dailyPuzzles) {
            debugLog('⚡ Generating instant fallback puzzles...');
            this.generateFallbackPuzzles();
        }

        // Setup automatic daily refresh system
        this.setupAutomaticRefresh();

        // Load puzzles (now instant due to fallback)
        this.loadDailyPuzzles();
        this.setupEventListeners();

        // Check if there's a selected difficulty from dashboard
        const selectedDifficulty = sessionStorage.getItem('selectedDifficulty');
        if (selectedDifficulty) {
            sessionStorage.removeItem('selectedDifficulty'); // Clear it once used
            debugLog('Selected difficulty from dashboard:', selectedDifficulty);

            // Set the selected difficulty and mark as explicitly selected
            this.currentDifficulty = selectedDifficulty;
            this.explicitlySelectedDifficulty = true;

            // Always try to load saved state first, regardless of how we got here
            debugLog('Attempting to load saved game state for difficulty:', this.currentDifficulty);
            await this.loadGameState();

            // If no saved game state was found, start a new game
            if (!this.gameStarted) {
                debugLog('No saved state found, loading fresh puzzle:', this.currentDifficulty);
                this.loadPuzzle(this.currentDifficulty);
            }
        } else {
            // No difficulty was explicitly selected - try to load saved game state
            debugLog('No explicit difficulty selection, loading saved game state');
            await this.loadGameState();

            // If no saved game state and we have a current difficulty, start new game
            if (!this.gameStarted && this.currentDifficulty) {
                debugLog('No saved state found, loading fresh puzzle for default difficulty:', this.currentDifficulty);
                this.loadPuzzle(this.currentDifficulty);
            }
        }
    }

    createSudokuInterface() {
        const sudokuContainer = document.querySelector('.sudoku-game-container');
        if (!sudokuContainer) return;

        // Replace placeholder with actual game interface
        sudokuContainer.innerHTML = `
            <div class="sudoku-game">
                <!-- NYT-style Header -->

                <!-- Difficulty Selection - Hidden for daily puzzles -->
                <div class="difficulty-selector" style="display: none;">
                    <h3>Choose Difficulty</h3>
                    <div class="difficulty-buttons">
                        <button class="difficulty-btn active" data-difficulty="easy">
                            <i class="fas fa-seedling"></i>
                            <span>Easy</span>
                        </button>
                        <button class="difficulty-btn" data-difficulty="medium">
                            <i class="fas fa-bolt"></i>
                            <span>Medium</span>
                        </button>
                        <button class="difficulty-btn" data-difficulty="hard">
                            <i class="fas fa-fire"></i>
                            <span>Hard</span>
                        </button>
                    </div>
                </div>

                <!-- NYT-style Game Info Panel -->
                <div class="game-info-panel">
                    <div class="timer-section">
                        <div class="stat-label">Timer</div>
                        <span class="timer-display" id="timerDisplay">0:00</span>
                    </div>
                    <div class="stats-section">
                        <div class="stat-item">
                            <div class="stat-label">Errors</div>
                            <span class="errors-count" id="errorsCount">0</span>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Hints</div>
                            <span class="hints-count" id="hintsCount">0</span>
                        </div>
                    </div>
                    <div class="game-controls">
                        <button class="icon-btn hint-btn" id="hintBtn" title="Get a hint">
                            <i class="fas fa-lightbulb"></i>
                        </button>
                        <button class="icon-btn pause-btn" id="pauseBtn" title="Pause game">
                            <i class="fas fa-pause"></i>
                        </button>
                        <button class="icon-btn settings-btn" id="settingsBtn" title="Game settings">
                            <i class="fas fa-cog"></i>
                        </button>
                    </div>
                </div>

                <!-- Sudoku Grid -->
                <div class="sudoku-grid-container">
                    <div class="sudoku-grid" id="sudokuGrid">
                        ${this.generateGridHTML()}
                    </div>
                </div>

                <!-- Number Input Rows -->
                ${this.generateNumberInputHTML()}

                <!-- Action Buttons Row -->
                <div class="action-buttons">
                    <button class="action-btn candidate-btn" id="candidateBtn" title="Toggle pencil mode">
                        <i class="fas fa-pencil-alt"></i>
                        <span>Notes</span>
                    </button>
                    <button class="action-btn erase-btn" id="eraseBtn" title="Erase selected cell">
                        <i class="fas fa-eraser"></i>
                        <span>Erase</span>
                    </button>
                    <button class="action-btn toggle-candidates-btn" id="toggleCandidatesBtn" title="Toggle all candidates visibility">
                        <i class="fas fa-eye"></i>
                        <span>Show All</span>
                    </button>
                </div>

                <!-- Game Status -->
                <div class="game-status" id="gameStatus">
                    <div class="status-message">
                        Ready to play! Select a difficulty to start.
                    </div>
                </div>
            </div>
        `;
    }

    generateGridHTML() {
        let html = '';
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cellClass = this.getCellClasses(row, col);
                html += `
                    <div class="sudoku-cell ${cellClass}"
                         data-row="${row}"
                         data-col="${col}"
                         tabindex="0">
                        <div class="cell-value"></div>
                        <div class="cell-candidates"></div>
                    </div>
                `;
            }
        }
        return html;
    }

    generateNumberInputHTML() {
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // Mobile: Two rows layout
            return `
                <div class="number-input">
                    <div class="number-row-1">
                        ${Array.from({length: 5}, (_, i) =>
                            `<button class="number-btn" data-number="${i + 1}">${i + 1}</button>`
                        ).join('')}
                    </div>
                    <div class="number-row-2">
                        ${Array.from({length: 4}, (_, i) =>
                            `<button class="number-btn" data-number="${i + 6}">${i + 6}</button>`
                        ).join('')}
                        <button class="undo-btn" id="undoBtn" title="Undo last move">
                            <i class="fas fa-undo-alt"></i>
                            <span>Undo</span>
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Desktop: Single row layout
            return `
                <div class="number-input number-input-desktop">
                    ${Array.from({length: 9}, (_, i) =>
                        `<button class="number-btn" data-number="${i + 1}">${i + 1}</button>`
                    ).join('')}
                    <button class="undo-btn" id="undoBtn" title="Undo last move">
                        <i class="fas fa-undo-alt"></i>
                        <span>Undo</span>
                    </button>
                </div>
            `;
        }
    }

    getCellClasses(row, col) {
        let classes = [];

        // Add region classes for visual separation
        if (row % 3 === 2 && row < 8) classes.push('bottom-thick');
        if (col % 3 === 2 && col < 8) classes.push('right-thick');
        if (row % 3 === 0 && row > 0) classes.push('top-thick');
        if (col % 3 === 0 && col > 0) classes.push('left-thick');

        // Add locked class for locked user inputs
        if (this.lockedGrid[row][col]) classes.push('locked');

        return classes.join(' ');
    }

    setupEventListeners() {
        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeDifficulty(e.target.dataset.difficulty || e.target.closest('.difficulty-btn').dataset.difficulty);
            });
        });

        // Grid cell clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.sudoku-cell')) {
                const cell = e.target.closest('.sudoku-cell');
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                this.selectCell(row, col);
            }
        });

        // Number input and action buttons
        this.attachNumberInputListeners();

        // Other action buttons
        document.getElementById('hintBtn')?.addEventListener('click', async () => await this.getHint());
        document.getElementById('eraseBtn')?.addEventListener('click', async () => await this.eraseSelectedCell());
        document.getElementById('candidateBtn')?.addEventListener('click', () => this.toggleCandidateMode());
        document.getElementById('toggleCandidatesBtn')?.addEventListener('click', () => this.toggleAllCandidates());
        document.getElementById('pauseBtn')?.addEventListener('click', () => this.togglePause());
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.showSettings());

        // Keyboard controls
        document.addEventListener('keydown', async (e) => await this.handleKeyInput(e));

        // Auto-save every 10 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.gameStarted && !this.gameCompleted) {
                this.saveGameState();
            }
        }, 10000);

        // Handle window resize for responsive number input
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateNumberInputLayout();
            }, 150);
        });
    }

    updateNumberInputLayout() {
        const numberInputContainer = document.querySelector('.number-input');
        if (numberInputContainer) {
            numberInputContainer.outerHTML = this.generateNumberInputHTML();
            // Re-attach event listeners for the new buttons
            this.attachNumberInputListeners();
        }
    }

    attachNumberInputListeners() {
        // Number input buttons
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const number = parseInt(e.target.dataset.number);
                await this.inputNumber(number);
            });
        });

        // Undo button
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }
    }

    changeDifficulty(difficulty) {
        // Don't switch if user already explicitly selected this difficulty
        if (this.explicitlySelectedDifficulty && this.currentDifficulty === difficulty) {
            debugLog('Ignoring changeDifficulty call - already loaded explicitly selected difficulty:', difficulty);
            return;
        }

        // Prevent switching during active gameplay
        if (this.gameStarted && !this.gameCompleted && !this.gamePaused) {
            document.getElementById('gameStatus').innerHTML =
                '<div class="status-message error">Cannot switch difficulty during active gameplay. Please pause or complete the current game first.</div>';
            return;
        }

        // Save current game if in progress and pause timer
        if (this.gameStarted && !this.gameCompleted) {
            this.saveGameState();
            this.stopTimer();
            // Set paused state to prevent timer restart
            this.gamePaused = true;
        }

        this.currentDifficulty = difficulty;

        // Update UI
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-difficulty="${difficulty}"]`).classList.add('active');

        // Load puzzle for this difficulty
        this.loadPuzzle(difficulty);

        // Update candidate mode based on difficulty and show candidates for medium/hard
        if (difficulty === 'easy') {
            this.candidateMode = false;
            this.showAllCandidates = false;
        } else {
            this.candidateMode = false; // Start in number mode
            this.showAllCandidates = true; // But show all candidates
        }
        this.updateCandidateModeUI();
        this.updateShowAllCandidatesUI();
    }

    async loadDailyPuzzles() {
        try {
            // INSTANT LOADING: Always ensure fallback puzzles are available immediately
            if (!this.dailyPuzzles) {
                debugLog('⚡ Loading fallback puzzles instantly...');
                this.generateFallbackPuzzles();
            }

            // First, check if puzzles are already preloaded
            if (window.preloadedPuzzles) {
                this.dailyPuzzles = window.preloadedPuzzles;
                debugLog('✅ Using preloaded puzzles - instant load!');
                return;
            }

            // Check if sudokuApp is available and has preloaded puzzles
            if (window.sudokuApp && window.sudokuApp.arePuzzlesPreloaded()) {
                this.dailyPuzzles = window.sudokuApp.getPreloadedPuzzles();
                debugLog('✅ Using cached preloaded puzzles');
                return;
            }

            // Background: Try to load daily puzzles from server API (non-blocking)
            // This runs in background while user can play with fallback puzzles
            debugLog('🔄 Attempting background API update...');
            setTimeout(async () => {
                try {
                    const today = this.getTodayDateString();
                    const response = await fetch(`/api/puzzles?date=${today}&t=${Date.now()}`);

                    if (response.ok) {
                        const apiPuzzles = await response.json();
                        const validation = this.validatePuzzleData(apiPuzzles);
                        if (validation.isValid) {
                            this.dailyPuzzles = apiPuzzles;
                            debugLog('✅ Daily puzzles updated in background');
                        }
                    }
                } catch (error) {
                    debugLog('ℹ️ Background API update failed, using fallback puzzles');
                }
            }, 100); // Minimal delay to not block UI

        } catch (error) {
            debugLog('ℹ️ Using fallback puzzles for instant loading');
            // Fallback puzzles are already loaded, so no delay here
        }
    }

    async forceRefreshPuzzles() {
        try {
            debugLog('🔄 Force refreshing puzzles from server...');

            // Clear ALL cached puzzle data
            window.preloadedPuzzles = null;

            // Clear main app cache if available
            if (window.sudokuApp) {
                debugLog('🧹 Clearing main app puzzle cache...');
                window.sudokuApp.puzzleCache.puzzles = null;
                window.sudokuApp.puzzleCache.loadTime = null;
                window.sudokuApp.cache.data = null;
                window.sudokuApp.cache.lastUpdate = null;
            }

            // Force reload from API with cache busting
            const today = this.getTodayDateString();
            const response = await fetch(`/api/puzzles?date=${today}&t=${Date.now()}`);

            if (response.ok) {
                this.dailyPuzzles = await response.json();
                debugLog('✅ Successfully refreshed puzzles from server');

                // Update global cache
                window.preloadedPuzzles = this.dailyPuzzles;

                // Update main app cache if available
                if (window.sudokuApp) {
                    window.sudokuApp.puzzleCache.puzzles = this.dailyPuzzles;
                    window.sudokuApp.puzzleCache.loadTime = Date.now();
                }

                // If currently playing, reload the current puzzle
                if (this.currentDifficulty && this.gameStarted) {
                    debugLog(`🔄 Reloading current ${this.currentDifficulty} puzzle with fresh data`);
                    this.loadPuzzle(this.currentDifficulty);
                }

                return true;
            } else {
                throw new Error(`Server responded with ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Failed to force refresh puzzles:', error);
            return false;
        }
    }

    generatePuzzle(difficulty) {
        debugLog(`⚡ Fast puzzle generation for ${difficulty}`);

        // Use pre-generated solutions for speed - avoid expensive computation
        if (this.dailyPuzzles && this.dailyPuzzles[difficulty]) {
            debugLog(`✅ Using cached ${difficulty} puzzle`);
            return {
                puzzle: this.dailyPuzzles[difficulty].puzzle.map(row => [...row]),
                solution: this.dailyPuzzles[difficulty].solution.map(row => [...row])
            };
        }

        // If no cached puzzles, generate fallback immediately
        this.generateFallbackPuzzles();
        debugLog(`✅ Generated fallback puzzles, using ${difficulty}`);

        return {
            puzzle: this.dailyPuzzles[difficulty].puzzle.map(row => [...row]),
            solution: this.dailyPuzzles[difficulty].solution.map(row => [...row])
        };
    }

    // Keep the slow generation as a separate method for special use cases
    generatePuzzleFromScratch(difficulty) {
        console.warn('🐌 Using slow puzzle generation - this may take several seconds');

        const puzzle = Array(9).fill().map(() => Array(9).fill(0));
        const solution = Array(9).fill().map(() => Array(9).fill(0));

        // Generate a complete solution first
        const startTime = Date.now();
        const success = this.generateCompleteSolution(solution);
        const endTime = Date.now();

        debugLog(`Puzzle generation took ${endTime - startTime}ms`);

        if (!success) {
            console.warn('Failed to generate solution, using fallback');
            this.generateFallbackPuzzles();
            return {
                puzzle: this.dailyPuzzles[difficulty].puzzle.map(row => [...row]),
                solution: this.dailyPuzzles[difficulty].solution.map(row => [...row])
            };
        }

        // Remove numbers based on difficulty
        const cellsToRemove = {
            easy: 35,    // ~46 given numbers - more approachable
            medium: 50,  // ~31 given numbers - more challenging
            hard: 67     // ~14 given numbers - extremely difficult
        };

        // Copy solution to puzzle
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                puzzle[i][j] = solution[i][j];
            }
        }

        // Remove cells to create puzzle with better distribution
        const positions = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                positions.push([i, j]);
            }
        }

        // Shuffle positions for random removal
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        let removed = 0;
        const targetCells = cellsToRemove[difficulty];

        for (let [row, col] of positions) {
            if (removed >= targetCells) break;

            if (puzzle[row][col] !== 0) {
                // For easy mode, ensure regions don't become too sparse
                if (difficulty === 'easy') {
                    const regionClues = this.countRegionClues(puzzle, row, col);
                    if (regionClues < 4) continue;
                }

                puzzle[row][col] = 0;
                removed++;
            }
        }

        return { puzzle, solution };
    }

    // Helper function to count clues in a 3x3 region
    countRegionClues(grid, row, col) {
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        let count = 0;

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[startRow + i][startCol + j] !== 0) {
                    count++;
                }
            }
        }

        return count;
    }

    generateCompleteSolution(grid, iterations = 0) {
        // Add iteration limit to prevent infinite loops
        if (iterations > 10000) {
            console.warn('Puzzle generation taking too long, using fallback');
            return false;
        }

        // Optimized backtracking with Most Constrained Variable (MCV) heuristic
        let bestCell = null;
        let minPossibilities = 10;

        // Find the empty cell with the fewest possible values
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    const possibilities = this.getPossibleValues(grid, row, col);
                    if (possibilities.length === 0) {
                        return false; // No solution possible
                    }
                    if (possibilities.length < minPossibilities) {
                        minPossibilities = possibilities.length;
                        bestCell = { row, col, possibilities };
                    }
                }
            }
        }

        // If no empty cells, puzzle is complete
        if (!bestCell) return true;

        const { row, col, possibilities } = bestCell;
        this.shuffle(possibilities);

        for (let num of possibilities) {
            grid[row][col] = num;

            if (this.generateCompleteSolution(grid, iterations + 1)) {
                return true;
            }

            grid[row][col] = 0;
        }

        return false;
    }

    getPossibleValues(grid, row, col) {
        const used = new Set();

        // Check row
        for (let c = 0; c < 9; c++) {
            if (grid[row][c] !== 0) used.add(grid[row][c]);
        }

        // Check column
        for (let r = 0; r < 9; r++) {
            if (grid[r][col] !== 0) used.add(grid[r][col]);
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (grid[r][c] !== 0) used.add(grid[r][c]);
            }
        }

        const possibilities = [];
        for (let num = 1; num <= 9; num++) {
            if (!used.has(num)) {
                possibilities.push(num);
            }
        }

        return possibilities;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    isValidMove(grid, row, col, num) {
        // Check row (excluding the current cell)
        for (let x = 0; x < 9; x++) {
            if (x !== col && grid[row][x] === num) return false;
        }

        // Check column (excluding the current cell)
        for (let x = 0; x < 9; x++) {
            if (x !== row && grid[x][col] === num) return false;
        }

        // Check 3x3 box (excluding the current cell)
        const startRow = row - row % 3;
        const startCol = col - col % 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const checkRow = i + startRow;
                const checkCol = j + startCol;
                if (!(checkRow === row && checkCol === col) && grid[checkRow][checkCol] === num) {
                    return false;
                }
            }
        }

        return true;
    }

    loadPuzzle(difficulty) {
        if (!this.dailyPuzzles || !this.dailyPuzzles[difficulty]) {
            // Generate fallback puzzles if not loaded
            this.generateFallbackPuzzles();
        }

        const puzzleData = this.dailyPuzzles[difficulty];
        this.initialGrid = puzzleData.puzzle.map(row => [...row]);
        this.solution = puzzleData.solution.map(row => [...row]);
        this.playerGrid = puzzleData.puzzle.map(row => [...row]);
        this.lockedGrid = Array(9).fill().map(() => Array(9).fill(false));

        // Validate that the solution is actually valid
        debugLog(`🔍 Loading ${difficulty} solution. R6C5 should be:`, this.solution[5][4]);
        if (!this.isValidSudokuSolution(this.solution)) {
            console.error(`❌ Invalid solution loaded for ${difficulty} difficulty!`);
            debugLog('Solution:', this.solution.map(r => r.join('')).join('\n'));
        } else {
            debugLog(`✅ Valid ${difficulty} solution loaded`);
        }

        // Reset game state
        this.timer = 0;
        this.hints = 0;
        this.errors = 0;
        this.hintTimePenalty = 0;
        this.currentHintCell = null;
        this.hintState = 'none';
        this.gameStarted = true;
        this.gameCompleted = false;
        this.gamePaused = false;  // Reset pause state
        this.selectedCell = null;

        // Set candidate visibility based on difficulty
        if (difficulty === 'easy') {
            this.showAllCandidates = false;
        } else {
            this.showAllCandidates = true; // Show candidates by default for medium and hard
        }

        // Clear any previous candidates
        this.candidates = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
        this.removedCandidates = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));

        // Generate candidates if in show all mode (medium/hard)
        if (this.showAllCandidates) {
            this.generateAllCandidates();
        }

        this.updateDisplay();
        this.updateCandidateModeUI();
        this.updateShowAllCandidatesUI();
        this.startTimer();

        document.getElementById('gameStatus').innerHTML =
            '<div class="status-message">Game started! Good luck!</div>';
    }

    updateDisplay() {
        const grid = document.getElementById('sudokuGrid');
        if (!grid) return;

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = grid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const valueDiv = cell.querySelector('.cell-value');
                const candidatesDiv = cell.querySelector('.cell-candidates');

                // Clear existing classes
                cell.classList.remove('given', 'user-input', 'error', 'selected', 'highlighted', 'same-number');

                if (this.playerGrid[row][col] !== 0) {
                    valueDiv.textContent = this.playerGrid[row][col];

                    // Mark as given or user input
                    if (this.initialGrid[row][col] !== 0) {
                        cell.classList.add('given');
                    } else {
                        cell.classList.add('user-input');

                        // Check for errors by comparing with the correct solution
                        // Only show errors during active gameplay, not for completed puzzles
                        if (!this.gameCompleted && this.playerGrid[row][col] !== this.solution[row][col]) {
                            cell.classList.add('error');
                        }
                    }

                    // Show candidates even when cell has a value (for notes on filled cells)
                    if (this.candidates[row][col].size > 0) {
                        candidatesDiv.innerHTML = this.renderCandidatesGrid(this.candidates[row][col]);
                    } else {
                        candidatesDiv.innerHTML = '';
                    }
                } else {
                    valueDiv.textContent = '';

                    // Show candidates if they exist (regardless of candidate mode)
                    if (this.candidates[row][col].size > 0) {
                        candidatesDiv.innerHTML = this.renderCandidatesGrid(this.candidates[row][col]);
                    } else {
                        candidatesDiv.innerHTML = '';
                    }
                }

                // Highlight selected cell only
                if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
                    cell.classList.add('selected');
                }

                // Highlight cells with the same number as the selected cell
                if (this.selectedCell && this.playerGrid[row][col] !== 0) {
                    const selectedValue = this.playerGrid[this.selectedCell.row][this.selectedCell.col];
                    if (selectedValue !== 0 && this.playerGrid[row][col] === selectedValue) {
                        cell.classList.add('same-number');
                    }
                }
            }
        }

        // Update stats display
        document.getElementById('timerDisplay').textContent = this.formatTime(this.timer);
        document.getElementById('errorsCount').textContent = this.errors;
        document.getElementById('hintsCount').textContent = this.hints;

        // Update number button states
        this.updateNumberButtons();
    }

    updateNumberButtons() {
        // Count how many of each number (1-9) are on the grid
        const numberCounts = Array(10).fill(0);

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = this.playerGrid[row][col];
                if (value !== 0) {
                    numberCounts[value]++;
                }
            }
        }

        // Update button states - grey out if all 9 instances are placed
        for (let num = 1; num <= 9; num++) {
            const button = document.querySelector(`.number-btn[data-number="${num}"]`);
            if (button) {
                if (numberCounts[num] >= 9) {
                    button.classList.add('completed');
                } else {
                    button.classList.remove('completed');
                }
            }
        }
    }

    isInSameBox(row1, col1, row2, col2) {
        return Math.floor(row1 / 3) === Math.floor(row2 / 3) &&
               Math.floor(col1 / 3) === Math.floor(col2 / 3);
    }

    renderCandidatesGrid(candidatesSet) {
        // Create a 3x3 grid for candidates numbered 1-9
        // Grid positions: 1=top-left, 2=top-center, 3=top-right,
        //                 4=mid-left, 5=mid-center, 6=mid-right,
        //                 7=bot-left, 8=bot-center, 9=bot-right
        const grid = Array(9).fill('');
        const candidatesArray = Array.from(candidatesSet).sort((a, b) => a - b);

        candidatesArray.forEach(num => {
            grid[num - 1] = num; // Position numbers 1-9 in grid positions 0-8
        });

        return `
            <div class="candidates-grid">
                <span class="candidate-cell">${grid[0] || ''}</span>
                <span class="candidate-cell">${grid[1] || ''}</span>
                <span class="candidate-cell">${grid[2] || ''}</span>
                <span class="candidate-cell">${grid[3] || ''}</span>
                <span class="candidate-cell">${grid[4] || ''}</span>
                <span class="candidate-cell">${grid[5] || ''}</span>
                <span class="candidate-cell">${grid[6] || ''}</span>
                <span class="candidate-cell">${grid[7] || ''}</span>
                <span class="candidate-cell">${grid[8] || ''}</span>
            </div>
        `;
    }

    selectCell(row, col) {
        this.selectedCell = { row, col };
        // Don't update display if it would clear candidates
        this.updateDisplay();
    }

    async inputNumber(number) {
        if (!this.selectedCell || !this.gameStarted || this.gameCompleted || this.gamePaused) return;

        const { row, col } = this.selectedCell;

        // Don't allow changing given numbers or locked cells
        if (this.initialGrid[row][col] !== 0 || this.lockedGrid[row][col]) return;

        // Save current state for undo
        const previousValue = this.playerGrid[row][col];
        const previousCandidates = new Set(this.candidates[row][col]);
        const previousManualCandidates = new Set(this.manualCandidates[row][col]);
        const previousRemovedCandidates = new Set(this.removedCandidates[row][col]);

        // Determine move type
        let moveType = 'number';
        if (number === 0) {
            moveType = 'erase';
        } else if (this.candidateMode) {
            moveType = 'candidate';
        }

        this.moveHistory.push({
            row,
            col,
            previousValue,
            previousCandidates: previousCandidates,
            previousManualCandidates: previousManualCandidates,
            previousRemovedCandidates: previousRemovedCandidates,
            previousLocked: this.lockedGrid[row][col],
            moveType: moveType,
            candidateNumber: this.candidateMode ? number : null,
            timestamp: Date.now()
        });

        if (number === 0) {
            // Erase
            this.playerGrid[row][col] = 0;
            this.candidates[row][col].clear();
            this.manualCandidates[row][col].clear();
            this.removedCandidates[row][col].clear();
            this.lockedGrid[row][col] = false;
        } else if (this.candidateMode) {
            // Toggle candidate - allow even if cell has a value
            if (this.candidates[row][col].has(number)) {
                // Removing candidate
                this.candidates[row][col].delete(number);
                this.manualCandidates[row][col].delete(number);
                // Track that this candidate was explicitly removed
                this.removedCandidates[row][col].add(number);
            } else {
                // Adding candidate
                this.candidates[row][col].add(number);
                this.manualCandidates[row][col].add(number);
                // Remove from removed list since it's being re-added
                this.removedCandidates[row][col].delete(number);
            }
        } else {
            // Check if the number matches the correct solution
            const isCorrectSolution = (this.solution[row][col] === number);

            // Player chose to place this number (whether correct or not)

            // Place number - clear candidates when placing a number
            this.playerGrid[row][col] = number;
            this.candidates[row][col].clear();
            this.manualCandidates[row][col].clear();
            this.removedCandidates[row][col].clear();

            // Increment errors if this doesn't match the solution
            if (!isCorrectSolution) {
                this.errors++;
                // Provide immediate feedback for errors
                this.showErrorFeedback(row, col);
            } else {
                // Lock the cell when correct number is entered
                this.lockedGrid[row][col] = true;
                // Check if user solved the hinted cell manually
                if (this.hintState === 'pointing' && this.currentHintCell &&
                    this.currentHintCell.row === row && this.currentHintCell.col === col) {
                    // User solved the hinted cell manually - reset hint state
                    this.currentHintCell = null;
                    this.hintState = 'none';
                    this.clearHintIndicators();

                    // Show positive feedback
                    const statusDiv = document.getElementById('gameStatus');
                    statusDiv.innerHTML = `
                        <div class="hint-message solved-manually">
                            <div class="hint-header">
                                <i class="fas fa-check-circle"></i>
                                <strong>Great work!</strong>
                            </div>
                            <div class="hint-body">
                                You solved the hinted cell yourself! Only 5 seconds penalty applied.
                            </div>
                        </div>
                    `;
                    // Clear the message after a few seconds
                    setTimeout(() => {
                        statusDiv.innerHTML = '';
                    }, 3000);
                }
            }
        }

        // Update candidates when placing or removing numbers (not when in candidate mode)
        if (!this.candidateMode) {
            this.updateAllCandidates();
        }

        // Auto-check for conflicts if enabled
        if (this.autoCheckErrors && number !== 0 && !this.candidateMode) {
            this.highlightConflicts(row, col);
        }

        this.updateDisplay();
        this.playSound('place');
        await this.checkCompletion();
    }

    toggleCandidateMode() {
        this.candidateMode = !this.candidateMode;
        this.updateCandidateModeUI();
        this.updateDisplay();
    }

    updateCandidateModeUI() {
        const candidateBtn = document.getElementById('candidateBtn');
        if (candidateBtn) {
            candidateBtn.classList.toggle('active', this.candidateMode);
        }
    }

    toggleAllCandidates() {
        this.showAllCandidates = !this.showAllCandidates;

        const toggleBtn = document.getElementById('toggleCandidatesBtn');
        if (toggleBtn) {
            toggleBtn.classList.toggle('active', this.showAllCandidates);
            const span = toggleBtn.querySelector('span');
            const icon = toggleBtn.querySelector('i');
            if (this.showAllCandidates) {
                span.textContent = 'Hide All';
                icon.className = 'fas fa-eye-slash';
                // Generate all possible candidates for empty cells
                this.generateAllCandidates();
            } else {
                span.textContent = 'Show All';
                icon.className = 'fas fa-eye';
                // Keep only manually entered candidates
                for (let row = 0; row < 9; row++) {
                    for (let col = 0; col < 9; col++) {
                        if (this.playerGrid[row][col] === 0) {
                            this.candidates[row][col] = new Set(this.manualCandidates[row][col]);
                        }
                    }
                }
            }
        }

        this.updateDisplay();
    }

    generateAllCandidates() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.playerGrid[row][col] === 0) {
                    // Preserve manual candidates
                    const manualCands = new Set(this.manualCandidates[row][col]);

                    // Clear and regenerate all candidates
                    this.candidates[row][col].clear();

                    // Add valid auto-generated candidates
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValidMove(this.playerGrid, row, col, num)) {
                            this.candidates[row][col].add(num);
                        }
                    }

                    // Re-add manual candidates (even if they're invalid - user choice)
                    manualCands.forEach(num => {
                        this.candidates[row][col].add(num);
                    });
                }
            }
        }
    }

    clearGeneratedCandidates() {
        // This would ideally track which candidates were user-entered vs generated
        // For now, we'll keep user-entered candidates and only clear if they're invalid
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.playerGrid[row][col] === 0) {
                    // Keep only valid user-entered candidates
                    const toRemove = [];
                    this.candidates[row][col].forEach(num => {
                        if (!this.isValidMove(this.playerGrid, row, col, num)) {
                            toRemove.push(num);
                        }
                    });
                    toRemove.forEach(num => this.candidates[row][col].delete(num));
                }
            }
        }
    }

    updateShowAllCandidatesUI() {
        const toggleBtn = document.getElementById('toggleCandidatesBtn');
        if (toggleBtn) {
            toggleBtn.classList.toggle('active', this.showAllCandidates);
            const span = toggleBtn.querySelector('span');
            const icon = toggleBtn.querySelector('i');
            if (this.showAllCandidates) {
                span.textContent = 'Hide All';
                icon.className = 'fas fa-eye-slash';
            } else {
                span.textContent = 'Show All';
                icon.className = 'fas fa-eye';
            }
        }
    }

    updateAllCandidates() {
        // Update candidates for all empty cells
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                // Only update candidates for empty cells
                if (this.playerGrid[row][col] === 0) {
                    if (this.showAllCandidates) {
                        // In show-all mode, combine auto-generated and manual candidates
                        const manualCands = new Set(this.manualCandidates[row][col]);
                        const removedCands = this.removedCandidates[row][col];
                        const autoCands = new Set();

                        // Generate auto candidates, but exclude explicitly removed ones
                        for (let num = 1; num <= 9; num++) {
                            if (this.isValidMove(this.playerGrid, row, col, num) && !removedCands.has(num)) {
                                autoCands.add(num);
                            }
                        }

                        // Combine auto and manual candidates
                        this.candidates[row][col] = new Set([...autoCands, ...manualCands]);
                    } else {
                        // In normal mode, only show manual candidates but remove invalid ones
                        const validManualCands = new Set();
                        this.manualCandidates[row][col].forEach(num => {
                            // Keep manual candidates even if they're currently invalid
                            // (user might have placed them for strategic reasons)
                            validManualCands.add(num);
                        });
                        this.candidates[row][col] = validManualCands;
                    }
                } else {
                    // Clear candidates for filled cells
                    this.candidates[row][col].clear();
                    this.manualCandidates[row][col].clear();
                    this.removedCandidates[row][col].clear();
                }
            }
        }

        // Update the display after updating candidates
        this.updateDisplay();
    }

    togglePause() {
        if (!this.gameStarted || this.gameCompleted) return;

        this.gamePaused = !this.gamePaused;
        const pauseBtn = document.getElementById('pauseBtn');
        const hintBtn = document.getElementById('hintBtn');
        const sudokuGrid = document.getElementById('sudokuGrid');

        if (this.gamePaused) {
            this.stopTimer();
            pauseBtn.querySelector('i').className = 'fas fa-play';
            pauseBtn.title = 'Resume game';
            if (hintBtn) {
                hintBtn.disabled = true;
                hintBtn.classList.add('disabled');
            }
            sudokuGrid.classList.add('paused');
            document.getElementById('gameStatus').innerHTML =
                '<div class="status-message">Game paused. Click Resume to continue.</div>';
        } else {
            this.startTimer();
            pauseBtn.querySelector('i').className = 'fas fa-pause';
            pauseBtn.title = 'Pause game';
            if (hintBtn) {
                hintBtn.disabled = false;
                hintBtn.classList.remove('disabled');
            }
            sudokuGrid.classList.remove('paused');
            document.getElementById('gameStatus').innerHTML =
                '<div class="status-message">Game resumed!</div>';
        }
    }

    updatePauseUI() {
        const pauseBtn = document.getElementById('pauseBtn');
        const hintBtn = document.getElementById('hintBtn');
        const sudokuGrid = document.getElementById('sudokuGrid');

        if (pauseBtn && sudokuGrid) {
            if (this.gamePaused) {
                pauseBtn.querySelector('i').className = 'fas fa-play';
                pauseBtn.title = 'Resume game';
                if (hintBtn) {
                    hintBtn.disabled = true;
                    hintBtn.classList.add('disabled');
                }
                sudokuGrid.classList.add('paused');
            } else {
                pauseBtn.querySelector('i').className = 'fas fa-pause';
                pauseBtn.title = 'Pause game';
                if (hintBtn) {
                    hintBtn.disabled = false;
                    hintBtn.classList.remove('disabled');
                }
                sudokuGrid.classList.remove('paused');
            }
        }
    }

    async getHint() {
        if (!this.gameStarted || this.gameCompleted || this.gamePaused) return;

        const statusDiv = document.getElementById('gameStatus');

        // Progressive hint system
        if (this.hintState === 'none') {
            // First click: point to the next cell to solve
            const hintCell = this.findBestHint();

            if (hintCell) {
                const { row, col, value, technique } = hintCell;
                this.currentHintCell = { row, col, value, technique };
                this.hintState = 'pointing';
                this.hints++;
                this.hintTimePenalty += 5; // 5 second penalty for pointing

                // Clear any existing hint visual indicators
                this.clearHintIndicators();

                // Add visual indication to the pointed cell
                this.addHintIndicator(row, col, 'pointing');

                // Select the pointed cell
                this.selectCell(row, col);
                this.updateDisplay();

                // Show pointing message
                statusDiv.innerHTML = `
                    <div class="hint-message pointing">
                        <div class="hint-header">
                            <i class="fas fa-search"></i>
                            <strong>Hint: Focus Here</strong>
                        </div>
                        <div class="hint-body">
                            Look at cell R${row + 1}C${col + 1}. This is the next cell you should solve using ${technique}.
                        </div>
                        <div class="hint-penalty">
                            Penalty: 5 seconds | Click hint again to reveal the answer (+10 more seconds)
                        </div>
                    </div>
                `;
            } else {
                statusDiv.innerHTML = '<div class="status-message">No hints available right now.</div>';
            }
        } else if (this.hintState === 'pointing') {
            // Second click: reveal the cell value
            if (this.currentHintCell) {
                const { row, col, value, technique } = this.currentHintCell;
                this.hintState = 'revealed';
                this.hintTimePenalty += 10; // 10 second penalty for revealing

                // Place the value
                this.playerGrid[row][col] = value;
                this.candidates[row][col].clear();
                this.removedCandidates[row][col].clear();

                // Update candidates
                if (this.showAllCandidates) {
                    this.updateAllCandidates();
                }

                // Update visual indicator
                this.clearHintIndicators();
                this.addHintIndicator(row, col, 'revealed');

                this.selectCell(row, col);
                this.updateDisplay();

                // Show reveal message
                statusDiv.innerHTML = `
                    <div class="hint-message revealed">
                        <div class="hint-header">
                            <i class="fas fa-lightbulb"></i>
                            <strong>${technique}</strong>
                        </div>
                        <div class="hint-body">
                            Cell R${row + 1}C${col + 1} = ${value}
                        </div>
                        <div class="hint-penalty">
                            Total penalty: 15 seconds (5 + 10)
                        </div>
                    </div>
                `;

                // Reset hint state for next hint
                this.currentHintCell = null;
                this.hintState = 'none';

                await this.checkCompletion();
            }
        }

        // Add hint message styling if not already present
        if (!document.querySelector('.hint-styles-added')) {
            const hintStyles = document.createElement('style');
            hintStyles.className = 'hint-styles-added';
            hintStyles.textContent = `
                .hint-message {
                    background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
                    color: white;
                    padding: 1rem;
                    border-radius: var(--border-radius);
                    margin: 1rem 0;
                    box-shadow: var(--box-shadow);
                    animation: hintAppear 0.4s ease-out;
                }
                .hint-message.pointing {
                    background: linear-gradient(135deg, var(--accent-orange), var(--accent-yellow));
                }
                .hint-message.revealed {
                    background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
                }
                .hint-message.solved-manually {
                    background: linear-gradient(135deg, var(--accent-green), var(--accent-teal));
                }
                .hint-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1.1rem;
                    margin-bottom: 0.5rem;
                }
                .hint-body {
                    font-size: 0.95rem;
                    margin-bottom: 0.5rem;
                    opacity: 0.9;
                }
                .hint-penalty {
                    font-family: 'Orbitron', monospace;
                    font-weight: 600;
                    font-size: 0.85rem;
                    background: rgba(0, 0, 0, 0.2);
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    display: inline-block;
                }
                .cell.hint-pointing {
                    background: linear-gradient(135deg, rgba(255, 152, 0, 0.3), rgba(255, 193, 7, 0.3)) !important;
                    border: 2px solid var(--accent-orange) !important;
                    animation: hintPulse 1.5s infinite;
                }
                .cell.hint-revealed {
                    background: linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.3)) !important;
                    border: 2px solid var(--accent-green) !important;
                }
                @keyframes hintAppear {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes hintPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `;
            document.head.appendChild(hintStyles);
        }
    }

    clearHintIndicators() {
        // Remove hint indicators from all cells
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('hint-pointing', 'hint-revealed');
        });
    }

    addHintIndicator(row, col, type) {
        // Add hint indicator to specific cell
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add(`hint-${type}`);
        }
    }

    findBestHint() {
        // Completely rewritten hint finding with correct logic

        // 1. Look for naked singles first (cells with only one possible value)
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.playerGrid[row][col] === 0) {
                    const possibleValues = this.getPossibleValues(row, col);
                    if (possibleValues.length === 1) {
                        // Verify this is actually correct by checking against solution
                        if (this.solution[row][col] === possibleValues[0]) {
                            return {
                                row,
                                col,
                                value: possibleValues[0],
                                technique: 'Naked Single',
                                explanation: `Cell R${row+1}C${col+1} can only contain ${possibleValues[0]} - no other number is valid here`
                            };
                        }
                    }
                }
            }
        }

        // 2. Look for hidden singles (number that can only go in one cell within a region)
        // Check each row for hidden singles
        for (let row = 0; row < 9; row++) {
            for (let num = 1; num <= 9; num++) {
                if (!this.isNumberInRow(row, num)) {
                    const possibleCols = [];
                    for (let col = 0; col < 9; col++) {
                        if (this.playerGrid[row][col] === 0 && this.isValidMove(this.playerGrid, row, col, num)) {
                            possibleCols.push(col);
                        }
                    }
                    if (possibleCols.length === 1) {
                        const col = possibleCols[0];
                        // Verify against solution
                        if (this.solution[row][col] === num) {
                            return {
                                row,
                                col,
                                value: num,
                                technique: 'Hidden Single (Row)',
                                explanation: `${num} can only go in R${row+1}C${col+1} within row ${row+1}`
                            };
                        }
                    }
                }
            }
        }

        // Check each column for hidden singles
        for (let col = 0; col < 9; col++) {
            for (let num = 1; num <= 9; num++) {
                if (!this.isNumberInColumn(col, num)) {
                    const possibleRows = [];
                    for (let row = 0; row < 9; row++) {
                        if (this.playerGrid[row][col] === 0 && this.isValidMove(this.playerGrid, row, col, num)) {
                            possibleRows.push(row);
                        }
                    }
                    if (possibleRows.length === 1) {
                        const row = possibleRows[0];
                        // Verify against solution
                        if (this.solution[row][col] === num) {
                            return {
                                row,
                                col,
                                value: num,
                                technique: 'Hidden Single (Column)',
                                explanation: `${num} can only go in R${row+1}C${col+1} within column ${col+1}`
                            };
                        }
                    }
                }
            }
        }

        // Check each 3x3 box for hidden singles
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                for (let num = 1; num <= 9; num++) {
                    if (!this.isNumberInBox(boxRow * 3, boxCol * 3, num)) {
                        const possiblePositions = [];
                        for (let r = 0; r < 3; r++) {
                            for (let c = 0; c < 3; c++) {
                                const row = boxRow * 3 + r;
                                const col = boxCol * 3 + c;
                                if (this.playerGrid[row][col] === 0 && this.isValidMove(this.playerGrid, row, col, num)) {
                                    possiblePositions.push([row, col]);
                                }
                            }
                        }
                        if (possiblePositions.length === 1) {
                            const [row, col] = possiblePositions[0];
                            // Verify against solution
                            if (this.solution[row][col] === num) {
                                return {
                                    row,
                                    col,
                                    value: num,
                                    technique: 'Hidden Single (Box)',
                                    explanation: `${num} can only go in R${row+1}C${col+1} within the 3x3 box`
                                };
                            }
                        }
                    }
                }
            }
        }

        // 3. If no obvious logical moves, find the cell with fewest possibilities
        let bestCell = null;
        let minPossibilities = 10;

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.playerGrid[row][col] === 0) {
                    const possibleValues = this.getPossibleValues(row, col);
                    if (possibleValues.length > 0 && possibleValues.length < minPossibilities) {
                        // Check if the correct solution value is among the possibilities
                        const correctValue = this.solution[row][col];
                        if (possibleValues.includes(correctValue)) {
                            bestCell = { row, col, value: correctValue, possibilities: possibleValues.length };
                            minPossibilities = possibleValues.length;
                        }
                    }
                }
            }
        }

        if (bestCell) {
            return {
                row: bestCell.row,
                col: bestCell.col,
                value: bestCell.value,
                technique: 'Strategic Hint',
                explanation: `This cell has only ${bestCell.possibilities} possible values. Try ${bestCell.value} - it's correct!`
            };
        }

        // 4. Last resort: give any correct move
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.playerGrid[row][col] === 0) {
                    const correctValue = this.solution[row][col];
                    return {
                        row,
                        col,
                        value: correctValue,
                        technique: 'Solution Hint',
                        explanation: `When all else fails, ${this.solution[row][col]} is the correct answer for R${row+1}C${col+1}`
                    };
                }
            }
        }

        return null;
    }

    getPossibleValues(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (this.isValidMove(this.playerGrid, row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }

    // Helper methods for hint system
    isNumberInRow(row, num) {
        for (let col = 0; col < 9; col++) {
            if (this.playerGrid[row][col] === num) return true;
        }
        return false;
    }

    isNumberInColumn(col, num) {
        for (let row = 0; row < 9; row++) {
            if (this.playerGrid[row][col] === num) return true;
        }
        return false;
    }

    isNumberInBox(startRow, startCol, num) {
        const boxRow = Math.floor(startRow / 3) * 3;
        const boxCol = Math.floor(startCol / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (this.playerGrid[r][c] === num) return true;
            }
        }
        return false;
    }

    // Removed broken hint methods - using simplified correct approach in findBestHint()

    isValidSudokuSolution(grid) {
        // Check if a 9x9 grid is a valid complete Sudoku solution

        // Check rows
        for (let row = 0; row < 9; row++) {
            const seen = new Set();
            for (let col = 0; col < 9; col++) {
                const num = grid[row][col];
                if (num < 1 || num > 9 || seen.has(num)) {
                    return false;
                }
                seen.add(num);
            }
        }

        // Check columns
        for (let col = 0; col < 9; col++) {
            const seen = new Set();
            for (let row = 0; row < 9; row++) {
                const num = grid[row][col];
                if (seen.has(num)) {
                    return false;
                }
                seen.add(num);
            }
        }

        // Check 3x3 boxes
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                const seen = new Set();
                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                        const num = grid[boxRow * 3 + r][boxCol * 3 + c];
                        if (seen.has(num)) {
                            return false;
                        }
                        seen.add(num);
                    }
                }
            }
        }

        return true;
    }

    async checkCompletion() {
        let completed = true;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.playerGrid[row][col] === 0) {
                    completed = false;
                    break;
                }
            }
            if (!completed) break;
        }

        // Only mark as completed if all cells are filled AND the solution is valid
        if (completed && this.isValidSudokuSolution(this.playerGrid)) {
            this.gameCompleted = true;
            this.stopTimer();

            // Save the completed state to prevent the game from appearing unfinished when reloaded
            await this.saveGameState();

            // Show completion notification overlay
            this.showCompletionNotification();

            this.playSound('complete');
            this.incrementStreak();

            const score = this.calculateFinalScore();
            const isPersonalBest = this.checkPersonalBest();

            // Check for theme-specific achievements
            const themeAchievements = this.checkThemeAchievements();

            document.getElementById('gameStatus').innerHTML = '';
            this.saveCompletedGame(score);
        }
    }

    calculateCurrentScore() {
        if (!this.gameStarted) return 0;

        // Use progressive hint penalty system
        const adjustedTime = this.timer + (this.errors * 30) + this.hintTimePenalty;
        const adjustedMinutes = adjustedTime / 60;
        const multipliers = { easy: 1, medium: 1.8, hard: 3.2 };

        if (adjustedMinutes === 0) return 0;

        // Square root scaling for better score distribution
        let score = (1000 / Math.sqrt(adjustedMinutes)) * multipliers[this.currentDifficulty];

        // Apply theme multiplier if theme manager is available
        if (window.themeManager) {
            const themeMultiplier = window.themeManager.getCurrentMultiplier();
            score *= themeMultiplier;
        }

        return Math.round(score);
    }

    calculateFinalScore() {
        return this.calculateCurrentScore();
    }

    showCompletionNotification(isPersistent = false) {
        debugLog('showCompletionNotification called, isPersistent:', isPersistent);

        // Remove any existing notification
        const existingNotification = document.querySelector('.completion-notification-overlay');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create the completion notification overlay
        const notification = document.createElement('div');
        notification.className = 'completion-notification-overlay';

        if (isPersistent) {
            notification.classList.add('persistent');
        }

        // Set initial styles to prevent flash in top-left corner
        notification.style.position = 'absolute';
        notification.style.top = '50%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.zIndex = '1000';
        notification.style.pointerEvents = 'none';
        notification.style.opacity = '0';

        // Determine next difficulty navigation
        let navigationButton = '';
        if (this.currentDifficulty === 'easy') {
            navigationButton = '<button class="completion-nav-btn" onclick="window.sudokuEngine.navigateToMedium()">Go to Medium</button>';
        } else if (this.currentDifficulty === 'medium') {
            navigationButton = '<button class="completion-nav-btn" onclick="window.sudokuEngine.navigateToHard()">Go to Hard</button>';
        } else if (this.currentDifficulty === 'hard') {
            navigationButton = '<button class="completion-nav-btn" onclick="window.sudokuEngine.navigateToDashboard()">Go to Dashboard</button>';
        }

        notification.innerHTML = `
            <div class="completion-notification">
                <div class="completion-icon">🎉</div>
                <div class="completion-text">Puzzle Complete!</div>
                <div class="completion-time">${this.formatTime(this.timer)}</div>
                ${navigationButton}
                ${isPersistent ? '<div class="completion-hint">Click anywhere to dismiss</div>' : ''}
            </div>
        `;

        // Find the sudoku grid container and add the notification
        let gridContainer = document.querySelector('.sudoku-grid-container');
        debugLog('Grid container found:', !!gridContainer);

        // Fallback: try to find by ID or other selector
        if (!gridContainer) {
            gridContainer = document.querySelector('.sudoku-game-container');
            debugLog('Fallback: using sudoku-game-container:', !!gridContainer);
        }

        if (gridContainer) {
            // Ensure the container has relative positioning for absolute positioning of notification
            if (gridContainer.style.position !== 'relative') {
                gridContainer.style.position = 'relative';
            }

            gridContainer.appendChild(notification);
            debugLog('Notification added to grid container');

            // Trigger smooth fade-in and scale animation
            setTimeout(() => {
                notification.style.opacity = '1';
                const notificationInner = notification.querySelector('.completion-notification');
                if (notificationInner) {
                    notificationInner.classList.add('show');
                }
            }, 10); // Small delay to ensure DOM is updated

            if (isPersistent) {
                // Add click handler to dismiss persistent notification
                const dismissNotification = () => {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 500);
                    document.removeEventListener('click', dismissNotification);
                };

                // Allow clicking to dismiss
                notification.style.pointerEvents = 'auto';
                notification.style.cursor = 'pointer';
                setTimeout(() => {
                    document.addEventListener('click', dismissNotification);
                }, 100); // Small delay to prevent immediate dismissal
            } else {
                // Auto-remove the notification after 3 seconds for fresh completions
                setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 500);
                }, 3000);
            }
        } else {
            console.error('Could not find grid container for completion notification');
        }
    }

    startTimer() {
        // Prevent multiple timers by checking if already running
        if (this.timerInterval) {
            console.warn('Timer already running, stopping existing timer first');
            this.stopTimer();
        }

        // Only start timer if game is active and not completed
        if (!this.gameStarted || this.gameCompleted || this.gamePaused) {
            debugLog('Not starting timer - game not active or completed/paused');
            return;
        }

        debugLog('Starting timer');
        this.timerInterval = setInterval(() => {
            this.timer++;
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                timerDisplay.textContent = this.formatTime(this.timer);
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            debugLog('Stopping timer');
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    async handleKeyInput(e) {
        if (!this.gameStarted || this.gameCompleted) return;

        // Number keys
        if (e.key >= '1' && e.key <= '9') {
            e.preventDefault();
            await this.inputNumber(parseInt(e.key));
        }

        // Delete/Backspace
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            await this.inputNumber(0);
        }

        // Arrow keys for navigation
        if (this.selectedCell && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const { row, col } = this.selectedCell;
            let newRow = row, newCol = col;

            switch (e.key) {
                case 'ArrowUp': newRow = Math.max(0, row - 1); break;
                case 'ArrowDown': newRow = Math.min(8, row + 1); break;
                case 'ArrowLeft': newCol = Math.max(0, col - 1); break;
                case 'ArrowRight': newCol = Math.min(8, col + 1); break;
            }

            this.selectCell(newRow, newCol);
        }

        // Space or Enter to toggle candidate mode
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this.toggleCandidateMode();
        }

        // Additional keyboard shortcuts
        if (e.key === 'h' && e.ctrlKey) {
            e.preventDefault();
            await this.getHint();
        }
        if (e.key === 'z' && e.ctrlKey) {
            e.preventDefault();
            this.undo();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            if (this.selectedCell) {
                this.selectedCell = null;
                this.updateDisplay();
            }
        }
        if (e.key === 'p' && e.ctrlKey) {
            e.preventDefault();
            this.togglePause();
        }
    }

    saveGame() {
        if (!this.gameStarted) {
            document.getElementById('gameStatus').innerHTML =
                '<div class="status-message">No game to save!</div>';
            return;
        }

        this.saveGameState();
        document.getElementById('gameStatus').innerHTML =
            '<div class="status-message">Game saved successfully!</div>';
    }

    async saveGameState() {
        const currentPlayer = sessionStorage.getItem('currentPlayer');
        if (!currentPlayer) return;

        const gameState = {
            playerGrid: this.playerGrid,
            initialGrid: this.initialGrid,
            lockedGrid: this.lockedGrid,
            candidates: this.candidates.map(row => row.map(cell => Array.from(cell))),
            removedCandidates: this.removedCandidates.map(row => row.map(cell => Array.from(cell))),
            timer: this.timer,
            hints: this.hints,
            errors: this.errors,
            hintTimePenalty: this.hintTimePenalty,
            currentHintCell: this.currentHintCell,
            hintState: this.hintState,
            difficulty: this.currentDifficulty,
            gameStarted: this.gameStarted,
            gameCompleted: this.gameCompleted,
            gamePaused: this.gamePaused,
            pausedAt: this.gamePaused ? Date.now() : null,
            candidateMode: this.candidateMode,
            showAllCandidates: this.showAllCandidates,
            selectedCell: this.selectedCell,
            lastSaved: Date.now()
        };

        // Save to localStorage for immediate access
        const key = `sudoku_${currentPlayer}_${this.getTodayDateString()}_${this.currentDifficulty}`;
        localStorage.setItem(key, JSON.stringify(gameState));

        // Also save to server for persistence across devices
        try {
            await fetch('/api/puzzles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'save',
                    player: currentPlayer,
                    date: this.getTodayDateString(),
                    difficulty: this.currentDifficulty,
                    state: gameState
                })
            });
        } catch (error) {
            console.error('Failed to save game state to server:', error);
        }
    }

    async loadGameState() {
        const currentPlayer = sessionStorage.getItem('currentPlayer');
        if (!currentPlayer) return;

        // This function now always attempts to load saved state for the current difficulty

        try {
            // Try to load from server first
            const response = await fetch(`/api/puzzles?player=${currentPlayer}&date=${this.getTodayDateString()}&difficulty=${this.currentDifficulty}`);

            let gameState = null;

            if (response.ok) {
                const serverState = await response.json();
                if (serverState) {
                    gameState = serverState;
                    debugLog('Loaded game state from server');
                }
            }

            // Fallback to localStorage if server fails
            if (!gameState) {
                const key = `sudoku_${currentPlayer}_${this.getTodayDateString()}_${this.currentDifficulty}`;
                const savedState = localStorage.getItem(key);
                if (savedState) {
                    gameState = JSON.parse(savedState);
                    debugLog('Loaded game state from localStorage');
                }
            }

            if (gameState) {
                // CRITICAL FIX: Ensure puzzles are loaded before restoring game state
                const savedDifficulty = gameState.difficulty || this.currentDifficulty;

                // If puzzles aren't loaded yet, load them now
                if (!this.dailyPuzzles) {
                    debugLog('⚠️ Puzzles not loaded during game state restore - loading fallback puzzles');
                    this.generateFallbackPuzzles();
                }

                // Now ensure we have the correct solution loaded
                if (savedDifficulty && this.dailyPuzzles && this.dailyPuzzles[savedDifficulty]) {
                    const puzzleData = this.dailyPuzzles[savedDifficulty];
                    this.solution = puzzleData.solution.map(row => [...row]);
                    this.currentDifficulty = savedDifficulty;
                    debugLog('✅ Solution loaded for saved game state');
                } else {
                    debugLog('❌ Could not load solution for difficulty:', savedDifficulty);
                }

                this.playerGrid = gameState.playerGrid || this.playerGrid;
                this.initialGrid = gameState.initialGrid || this.initialGrid;
                this.lockedGrid = gameState.lockedGrid || Array(9).fill().map(() => Array(9).fill(false));
                this.candidates = gameState.candidates ?
                    gameState.candidates.map(row => row.map(cell => new Set(cell))) :
                    this.candidates;
                this.removedCandidates = gameState.removedCandidates ?
                    gameState.removedCandidates.map(row => row.map(cell => new Set(cell))) :
                    Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
                this.timer = gameState.timer || 0;
                this.hints = gameState.hints || 0;
                this.errors = gameState.errors || 0;
                this.hintTimePenalty = gameState.hintTimePenalty || 0;
                this.currentHintCell = gameState.currentHintCell || null;
                this.hintState = gameState.hintState || 'none';
                this.gameStarted = gameState.gameStarted || false;
                this.gameCompleted = gameState.gameCompleted || false;
                this.gamePaused = gameState.gamePaused || false;
                this.candidateMode = gameState.candidateMode || false;
                this.showAllCandidates = gameState.showAllCandidates || false;
                this.selectedCell = gameState.selectedCell;

                if (this.gameCompleted) {
                    // Keep completed state - don't start timer
                    document.getElementById('gameStatus').innerHTML =
                        '<div class="status-message success">Puzzle completed! Well done!</div>';

                    // Show completion notification overlay for previously completed games
                    setTimeout(() => {
                        debugLog('Showing completion notification for completed game');
                        this.showCompletionNotification(true); // Make it persistent
                    }, 800); // Increased delay to ensure interface is fully loaded
                } else if (this.gameStarted) {
                    if (this.gamePaused) {
                        // Game was paused - update UI but don't start timer
                        this.updatePauseUI();
                        document.getElementById('gameStatus').innerHTML =
                            '<div class="status-message">Game paused. Click Resume to continue playing.</div>';
                    } else {
                        // Game was not paused - start timer if not already running
                        if (!this.timerInterval) {
                            this.startTimer();
                        }
                    }
                }

                this.updateDisplay();
                this.updateCandidateModeUI();
                this.updateShowAllCandidatesUI();

                if (!this.gameCompleted) {
                    if (!this.gamePaused) {
                        document.getElementById('gameStatus').innerHTML =
                            '<div class="status-message">Game state restored!</div>';
                    }
                    // If paused, the message was already set above
                }
            }

        } catch (error) {
            console.error('Failed to load game state:', error);
        }
    }

    async saveCompletedGame(score) {
        const currentPlayer = sessionStorage.getItem('currentPlayer');
        if (!currentPlayer) return;

        try {
            // Save completed game data for integration with existing analytics
            const completedGame = {
                date: this.getTodayDateString(),
                player: currentPlayer,
                difficulty: this.currentDifficulty,
                time: this.timer,
                hints: this.hints,
                errors: this.errors,
                score: score,
                completed: true,
                timestamp: Date.now()
            };

            // Store in localStorage for immediate access (backwards compatibility)
            const key = `completed_${currentPlayer}_${this.getTodayDateString()}_${this.currentDifficulty}`;
            localStorage.setItem(key, JSON.stringify(completedGame));

            // Also save to database for cross-browser sync
            await this.saveGameToDatabase(completedGame);

            // Integrate with existing analytics system
            await this.integrateWithAnalytics(completedGame);

            debugLog('Game completed and integrated with analytics:', completedGame);

        } catch (error) {
            console.error('Failed to save completed game:', error);
        }
    }

    async integrateWithAnalytics(gameData) {
        try {
            // Check if we have all 3 difficulties completed for today
            const todayCompleted = this.getTodayCompletedGames();

            // Update the analytics if this is the last game or if we want to show partial progress
            if (todayCompleted.length >= 3 || this.shouldUpdateAnalytics()) {
                await this.updateExistingAnalytics(todayCompleted);
            }

            // Trigger real-time update for the opponent
            this.notifyOpponentProgress(gameData);

        } catch (error) {
            console.error('Failed to integrate with analytics:', error);
        }
    }

    getTodayCompletedGames() {
        const currentPlayer = sessionStorage.getItem('currentPlayer');
        const today = this.getTodayDateString();
        const completed = [];

        ['easy', 'medium', 'hard'].forEach(difficulty => {
            const key = `completed_${currentPlayer}_${today}_${difficulty}`;
            const gameData = localStorage.getItem(key);
            if (gameData) {
                completed.push(JSON.parse(gameData));
            }
        });

        return completed;
    }

    shouldUpdateAnalytics() {
        // Update analytics immediately for demo purposes
        // In production, might want to wait for all 3 games
        return true;
    }

    async updateExistingAnalytics(completedGames) {
        if (completedGames.length === 0) return;

        const currentPlayer = sessionStorage.getItem('currentPlayer');
        const today = this.getTodayDateString();

        // Convert Sudoku game data to existing analytics format
        const analyticsEntry = this.convertToAnalyticsFormat(completedGames, today, currentPlayer);

        // Get opponent's data for the same date
        const opponentData = this.getOpponentDataForDate(today, currentPlayer);

        // Create complete entry for existing system if both players have data
        if (this.canCreateCompleteEntry(analyticsEntry, opponentData)) {
            await this.saveToExistingSystem(today, analyticsEntry, opponentData);
        } else {
            // Save partial entry
            await this.savePartialEntry(today, currentPlayer, analyticsEntry);
        }
    }

    convertToAnalyticsFormat(completedGames, date, player) {
        const entry = {
            times: { easy: null, medium: null, hard: null },
            errors: { easy: 0, medium: 0, hard: 0 },
            dnf: { easy: false, medium: false, hard: false },
            scores: { easy: 0, medium: 0, hard: 0, total: 0 },
            hints: { easy: 0, medium: 0, hard: 0 }  // Add hints tracking
        };

        let totalScore = 0;

        completedGames.forEach(game => {
            const diff = game.difficulty;
            entry.times[diff] = game.time;
            entry.errors[diff] = game.errors;
            entry.hints[diff] = game.hints;  // Store hints used
            entry.scores[diff] = game.score;
            totalScore += game.score;
        });

        entry.scores.total = totalScore;
        return entry;
    }

    getOpponentDataForDate(date, currentPlayer) {
        const opponent = currentPlayer === 'faidao' ? 'filip' : 'faidao';
        const completed = [];

        ['easy', 'medium', 'hard'].forEach(difficulty => {
            const key = `completed_${opponent}_${date}_${difficulty}`;
            const gameData = localStorage.getItem(key);
            if (gameData) {
                completed.push(JSON.parse(gameData));
            }
        });

        if (completed.length > 0) {
            return this.convertToAnalyticsFormat(completed, date, opponent);
        }
        return null;
    }

    canCreateCompleteEntry(playerData, opponentData) {
        // For now, create entry even with partial data to show progress
        return true;
    }

    async saveToExistingSystem(date, playerData, opponentData) {
        try {
            const currentPlayer = sessionStorage.getItem('currentPlayer');
            const opponent = currentPlayer === 'faidao' ? 'filip' : 'faidao';

            // Create entry in existing system format
            const entryData = {
                [currentPlayer]: playerData
            };

            if (opponentData) {
                entryData[opponent] = opponentData;
            } else {
                // Create empty opponent data
                entryData[opponent] = {
                    times: { easy: null, medium: null, hard: null },
                    errors: { easy: 0, medium: 0, hard: 0 },
                    dnf: { easy: false, medium: false, hard: false },
                    scores: { easy: 0, medium: 0, hard: 0, total: 0 }
                };
            }

            // Save to database using existing API
            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: date,
                    [currentPlayer]: entryData[currentPlayer],
                    [opponent]: entryData[opponent]
                })
            });

            if (response.ok) {
                debugLog('Successfully integrated with existing analytics system');

                // Trigger dashboard update if we're on main app
                if (window.sudokuApp) {
                    await window.sudokuApp.loadData();
                    await window.sudokuApp.updateDashboard();

                    // Check for achievements when a new entry is completed
                    const entries = window.sudokuApp.entries;
                    const latestEntry = entries.find(entry => entry.date === date);
                    if (latestEntry) {
                        await window.sudokuApp.checkAchievements(latestEntry);
                        debugLog('✅ Achievements checked for completed puzzle');
                    }

                    // Ensure Today's Battle results are updated immediately
                    window.sudokuApp.updateTodaysBattleResults();
                    debugLog('✅ Today\'s Battle results updated');
                }
            }

        } catch (error) {
            console.error('Failed to save to existing system:', error);
        }
    }

    async savePartialEntry(date, player, playerData) {
        // Store partial data for later completion
        const key = `partial_entry_${date}_${player}`;
        localStorage.setItem(key, JSON.stringify({
            date,
            player,
            data: playerData,
            timestamp: Date.now()
        }));
    }

    async saveGameToDatabase(gameData) {
        try {
            const response = await fetch('/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    player: gameData.player,
                    date: gameData.date,
                    difficulty: gameData.difficulty,
                    time: gameData.time,
                    errors: gameData.errors,
                    score: gameData.score,
                    hints: gameData.hints
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save game to database');
            }

            debugLog('Game saved to database for cross-browser sync');

            // Immediately invalidate the today's progress cache to ensure live updates
            if (window.sudokuApp && window.sudokuApp.todayProgressCache) {
                window.sudokuApp.todayProgressCache.data = null;
                window.sudokuApp.todayProgressCache.lastUpdate = null;
                window.sudokuApp.todayProgressCache.date = null;
                debugLog('Today progress cache invalidated for live updates');

                // Trigger immediate refresh of today's progress
                await window.sudokuApp.updateTodayProgress();
            }
        } catch (error) {
            console.error('Failed to save game to database:', error);
            // Don't throw error - localStorage fallback is still available
        }
    }

    notifyOpponentProgress(gameData) {
        // Store progress notification for opponent
        const currentPlayer = sessionStorage.getItem('currentPlayer');
        const opponent = currentPlayer === 'faidao' ? 'filip' : 'faidao';

        const notification = {
            from: currentPlayer,
            difficulty: gameData.difficulty,
            score: gameData.score,
            time: gameData.time,
            errors: gameData.errors,
            hints: gameData.hints,
            timestamp: Date.now()
        };

        const key = `opponent_progress_${opponent}_${this.getTodayDateString()}`;
        const existing = localStorage.getItem(key);
        const notifications = existing ? JSON.parse(existing) : [];

        notifications.push(notification);
        localStorage.setItem(key, JSON.stringify(notifications));

        debugLog('Notified opponent of progress:', notification);
    }

    getTodayDateString() {
        return new Date().toISOString().split('T')[0];
    }

    getFormattedDate() {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    async eraseSelectedCell() {
        if (this.selectedCell) {
            await this.inputNumber(0);
        }
    }

    showSettings() {
        // Create settings modal
        const modal = document.createElement('div');
        modal.className = 'settings-modal';
        modal.innerHTML = `
            <div class="settings-content">
                <div class="settings-header">
                    <h3>Game Settings</h3>
                    <button class="close-btn" onclick="this.closest('.settings-modal').remove()">&times;</button>
                </div>
                <div class="settings-body">
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="autoCheckErrors" ${this.autoCheckErrors ? 'checked' : ''}>
                            Highlight errors automatically
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="showTimer" ${this.showTimer !== false ? 'checked' : ''}>
                            Show timer
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>Sound Effects</label>
                        <select id="soundLevel">
                            <option value="off" ${this.soundLevel === 'off' ? 'selected' : ''}>Off</option>
                            <option value="low" ${this.soundLevel === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${this.soundLevel === 'medium' || !this.soundLevel ? 'selected' : ''}>Medium</option>
                            <option value="high" ${this.soundLevel === 'high' ? 'selected' : ''}>High</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>Number Input Sound</label>
                        <select id="inputSoundType">
                            <option value="classic" ${this.inputSoundType === 'classic' || !this.inputSoundType ? 'selected' : ''}>Classic</option>
                            <option value="bubble" ${this.inputSoundType === 'bubble' ? 'selected' : ''}>Bubble</option>
                            <option value="click" ${this.inputSoundType === 'click' ? 'selected' : ''}>Click</option>
                            <option value="soft" ${this.inputSoundType === 'soft' ? 'selected' : ''}>Soft</option>
                        </select>
                    </div>
                    ${(() => {
                        debugLog('Settings modal debug:', {
                            gameStarted: this.gameStarted,
                            gameCompleted: this.gameCompleted,
                            currentDifficulty: this.currentDifficulty,
                            showResetButton: this.gameStarted && !this.gameCompleted
                        });
                        return this.gameStarted && !this.gameCompleted;
                    })() ? `
                    <div class="setting-item restart-section">
                        <hr>
                        <button class="btn-secondary restart-btn" onclick="window.sudokuEngine.restartPuzzle(); this.closest('.settings-modal').remove();">
                            🔄 Restart Current Puzzle
                        </button>
                        <small>This will clear your progress and start the puzzle fresh</small>
                    </div>
                    ` : ''}
                </div>
                <div class="settings-footer">
                    <button class="btn-primary" onclick="window.sudokuEngine.saveSettings(); this.closest('.settings-modal').remove();">Save Settings</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close modal on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    saveSettings() {
        this.autoCheckErrors = document.getElementById('autoCheckErrors').checked;
        this.showTimer = document.getElementById('showTimer').checked;
        this.soundLevel = document.getElementById('soundLevel').value;
        this.inputSoundType = document.getElementById('inputSoundType').value;

        // Save to localStorage
        const settings = {
            autoCheckErrors: this.autoCheckErrors,
            showTimer: this.showTimer,
            soundLevel: this.soundLevel,
            inputSoundType: this.inputSoundType
        };
        localStorage.setItem('sudoku_settings', JSON.stringify(settings));

        // Update UI visibility
        const timerSection = document.querySelector('.timer-section');
        if (timerSection) {
            timerSection.style.display = this.showTimer ? 'block' : 'none';
        }
    }

    loadSettings() {
        const settings = localStorage.getItem('sudoku_settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.autoCheckErrors = parsed.autoCheckErrors !== false;
            this.showTimer = parsed.showTimer !== false;
            this.soundLevel = parsed.soundLevel || 'medium';
            this.inputSoundType = parsed.inputSoundType || 'classic';
        }
        // Auto-save is always enabled
        this.autoSave = true;
    }


    // Automatic daily puzzle refresh system
    setupAutomaticRefresh() {
        debugLog('🔄 Setting up automatic daily puzzle refresh...');

        // Clear any existing interval
        if (this.dailyRefreshInterval) {
            clearInterval(this.dailyRefreshInterval);
        }

        // Check for new puzzles every 5 minutes
        this.dailyRefreshInterval = setInterval(() => {
            this.checkAndRefreshDailyPuzzles();
        }, 5 * 60 * 1000); // 5 minutes

        // Also check immediately on visibility change (tab focus)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                debugLog('🔄 Tab focused, checking for new daily puzzles...');
                this.checkAndRefreshDailyPuzzles();
            }
        });

        // Check on page load
        this.checkAndRefreshDailyPuzzles();
    }

    async checkAndRefreshDailyPuzzles() {
        const today = new Date().toISOString().split('T')[0];

        // If we don't have puzzles or they're for a different date, refresh
        if (!this.dailyPuzzles || this.lastPuzzleDate !== today) {
            debugLog(`📅 Date changed or no puzzles loaded. Current: ${today}, Last: ${this.lastPuzzleDate}`);
            await this.loadDailyPuzzles(true); // Force refresh
            this.lastPuzzleDate = today;

            // If user has a game in progress for old date, handle it
            if (this.gameStarted && this.lastPuzzleDate !== today) {
                debugLog('🔄 New day detected, clearing old game state');
                this.clearOldGameState();
                // Auto-load easy difficulty for new day
                this.loadPuzzle('easy');
            }
        }
    }

    clearOldGameState() {
        // Clear localStorage for previous dates
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('sudoku') && !key.includes(new Date().toISOString().split('T')[0])) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Reset game state
        this.gameStarted = false;
        this.gameCompleted = false;
        this.timer = 0;
        this.hints = 0;
        this.errors = 0;
        this.hintTimePenalty = 0;
        this.currentHintCell = null;
        this.hintState = 'none';
    }

    getTodayDate() {
        // Get today's date in local timezone as YYYY-MM-DD string
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async loadDailyPuzzles(forceRefresh = false) {
        try {
            const today = this.getTodayDate();

            // Always use cache-busting for reliable updates
            const cacheBuster = `_cb=${Date.now()}`;
            const dateParam = `date=${today}`;
            const url = `/api/puzzles?${dateParam}&${cacheBuster}`;

            debugLog('🔄 Loading daily puzzles:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const puzzleData = await response.json();

            // Validate puzzle data thoroughly
            const validation = this.validatePuzzleData(puzzleData);
            if (!validation.isValid) {
                throw new Error(`Invalid puzzle data: ${validation.reason}`);
            }

            this.dailyPuzzles = puzzleData;
            this.lastPuzzleDate = today;

            debugLog('✅ Daily puzzles loaded and validated successfully');

            // Log puzzle info for verification
            Object.keys(this.dailyPuzzles).forEach(difficulty => {
                const puzzle = this.dailyPuzzles[difficulty];
                if (puzzle && puzzle.puzzle) {
                    const clueCount = this.countClues(puzzle.puzzle);
                    debugLog(`  ${difficulty}: ${clueCount} clues`);
                }
            });

            return true;

        } catch (error) {
            console.error('❌ Failed to load daily puzzles:', error);

            if (!forceRefresh) {
                debugLog('🔄 Trying force refresh...');
                return await this.loadDailyPuzzles(true);
            } else {
                debugLog('🔄 Using fallback puzzles...');
                this.generateFallbackPuzzles();
                this.lastPuzzleDate = new Date().toISOString().split('T')[0];
                return false;
            }
        }
    }

    validatePuzzleData(puzzleData) {
        if (!puzzleData || typeof puzzleData !== 'object') {
            return { isValid: false, reason: 'No puzzle data received' };
        }

        const difficulties = ['easy', 'medium', 'hard'];
        for (const difficulty of difficulties) {
            const puzzle = puzzleData[difficulty];

            if (!puzzle || !puzzle.puzzle || !puzzle.solution) {
                return { isValid: false, reason: `Missing ${difficulty} puzzle data` };
            }

            // Check if puzzle is properly formatted (9x9 arrays)
            if (!Array.isArray(puzzle.puzzle) || puzzle.puzzle.length !== 9) {
                return { isValid: false, reason: `Invalid ${difficulty} puzzle format` };
            }

            // Check if puzzle has empty cells (not already solved)
            let emptyCells = 0;
            for (let row = 0; row < 9; row++) {
                if (!Array.isArray(puzzle.puzzle[row]) || puzzle.puzzle[row].length !== 9) {
                    return { isValid: false, reason: `Invalid ${difficulty} puzzle row format` };
                }
                for (let col = 0; col < 9; col++) {
                    if (puzzle.puzzle[row][col] === 0) emptyCells++;
                }
            }

            if (emptyCells === 0) {
                return { isValid: false, reason: `${difficulty} puzzle is already solved` };
            }

            // Reasonable clue count check
            const clues = 81 - emptyCells;
            if (clues < 17 || clues > 50) {
                return { isValid: false, reason: `${difficulty} puzzle has unreasonable clue count: ${clues}` };
            }
        }

        return { isValid: true, reason: 'Valid puzzle data' };
    }

    countClues(puzzle) {
        if (!puzzle || !Array.isArray(puzzle)) {
            return 0;
        }

        let clueCount = 0;
        for (let row = 0; row < 9; row++) {
            if (!Array.isArray(puzzle[row])) continue;
            for (let col = 0; col < 9; col++) {
                if (puzzle[row][col] !== 0) {
                    clueCount++;
                }
            }
        }
        return clueCount;
    }

    generateFallbackPuzzles() {
        // Base solution - all puzzles use this same solution
        const baseSolution = [
            [5,3,4,6,7,8,9,1,2],
            [6,7,2,1,9,5,3,4,8],
            [1,9,8,3,4,2,5,6,7],
            [8,5,9,7,6,1,4,2,3],
            [4,2,6,8,5,3,7,9,1],
            [7,1,3,9,2,4,8,5,6],
            [9,6,1,5,3,7,2,8,4],
            [2,8,7,4,1,9,6,3,5],
            [3,4,5,2,8,6,1,7,9]
        ];

        // Working validated puzzles with proper difficulty progression
        this.dailyPuzzles = {
            easy: {
                puzzle: [
                    [5,3,0,6,7,0,9,1,2],
                    [6,0,2,1,9,5,0,4,8],
                    [0,9,8,3,0,2,5,6,0],
                    [8,5,0,7,6,1,0,2,3],
                    [4,0,6,8,5,3,7,0,1],
                    [7,1,0,9,2,4,8,5,0],
                    [0,6,1,5,3,0,2,8,4],
                    [2,0,7,4,1,9,0,3,5],
                    [3,4,0,2,8,6,1,0,9]
                ],
                solution: baseSolution
            },
            medium: {
                puzzle: [
                    [5,3,0,0,7,0,0,0,0],
                    [6,0,0,1,9,5,0,0,0],
                    [0,9,8,0,0,0,0,6,0],
                    [8,0,0,0,6,0,0,0,3],
                    [4,0,0,8,0,3,0,0,1],
                    [7,0,0,0,2,0,0,0,6],
                    [0,6,0,0,0,0,2,8,0],
                    [0,0,0,4,1,9,0,0,5],
                    [0,0,0,0,8,0,0,7,9]
                ],
                solution: baseSolution
            },
            hard: {
                puzzle: [
                    [0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,5,0,0,0],
                    [0,0,0,0,0,0,0,6,0],
                    [0,0,0,0,6,0,0,0,3],
                    [0,0,0,8,0,3,0,0,0],
                    [7,0,0,0,0,0,0,0,6],
                    [0,6,0,0,0,0,2,0,0],
                    [0,0,0,4,1,0,0,0,0],
                    [0,0,0,0,8,0,0,7,0]
                ],
                solution: baseSolution
            }
        };
    }

    undo() {
        if (this.moveHistory.length === 0) {
            document.getElementById('gameStatus').innerHTML =
                '<div class="status-message">No moves to undo</div>';
            return;
        }

        const lastMove = this.moveHistory.pop();
        const { row, col, previousValue, previousCandidates, previousManualCandidates, previousRemovedCandidates, previousLocked, moveType, candidateNumber } = lastMove;

        // Clear any existing conflict highlights before undoing
        document.querySelectorAll('.sudoku-cell.conflict').forEach(cell => {
            cell.classList.remove('conflict');
        });

        if (moveType === 'candidate' && candidateNumber) {
            // For candidate moves, restore the previous state for all tracking
            this.candidates[row][col] = new Set(previousCandidates);
            this.manualCandidates[row][col] = new Set(previousManualCandidates);
            this.removedCandidates[row][col] = new Set(previousRemovedCandidates);
        } else {
            // For number and erase moves, restore the full previous state
            this.playerGrid[row][col] = previousValue;
            this.candidates[row][col] = new Set(previousCandidates);
            this.lockedGrid[row][col] = previousLocked || false;

            // Restore manual candidates (handle backwards compatibility)
            if (previousManualCandidates) {
                this.manualCandidates[row][col] = new Set(previousManualCandidates);
            }

            // Restore removed candidates (handle backwards compatibility)
            if (previousRemovedCandidates) {
                this.removedCandidates[row][col] = new Set(previousRemovedCandidates);
            }

            // Only update other cells' candidates if in show all mode, but preserve this cell's restored candidates
            if (this.showAllCandidates) {
                // Save the restored candidates for this cell
                const restoredCandidates = new Set(this.candidates[row][col]);
                const restoredManualCandidates = new Set(this.manualCandidates[row][col]);
                const restoredRemovedCandidates = new Set(this.removedCandidates[row][col]);

                // Update all other cells
                this.updateAllCandidates();

                // Restore this specific cell's candidates after the update
                this.candidates[row][col] = restoredCandidates;
                this.manualCandidates[row][col] = restoredManualCandidates;
                this.removedCandidates[row][col] = restoredRemovedCandidates;
            }
        }

        // Select the cell that was just undone
        this.selectCell(row, col);
        this.updateDisplay();

        document.getElementById('gameStatus').innerHTML =
            '<div class="status-message">Move undone</div>';
    }

    checkThemeAchievements() {
        const achievements = [];

        if (!window.themeManager) return achievements;

        const currentTheme = window.themeManager.currentTheme;
        const gameData = {
            time: this.timer,
            errors: this.errors,
            hints: this.hints,
            difficulty: this.currentDifficulty
        };

        // Use theme manager's achievement checking
        const themeAchievements = window.themeManager.checkThemeAchievements(gameData);
        achievements.push(...themeAchievements);

        // Additional Sudoku-specific themed achievements
        if (currentTheme === 'halloween' && this.errors === 0 && this.hints === 0) {
            achievements.push({
                id: 'spooky_master',
                name: 'Spooky Master',
                description: 'Complete a Halloween puzzle with no errors or hints'
            });
        }

        if (currentTheme === 'christmas' && this.timer < 180) { // Under 3 minutes
            achievements.push({
                id: 'christmas_lightning',
                name: 'Christmas Lightning',
                description: 'Complete a Christmas puzzle in under 3 minutes'
            });
        }

        if (currentTheme === 'newYear' && this.currentDifficulty === 'hard' && this.errors <= 1) {
            achievements.push({
                id: 'new_year_resolution',
                name: 'New Year Resolution',
                description: 'Complete a Hard New Year puzzle with minimal errors'
            });
        }

        return achievements;
    }

    highlightConflicts(row, col) {
        const value = this.playerGrid[row][col];
        if (value === 0) return;

        // Clear previous conflict highlights
        document.querySelectorAll('.sudoku-cell.conflict').forEach(cell => {
            cell.classList.remove('conflict');
        });

        // Check for conflicts and highlight them
        for (let i = 0; i < 9; i++) {
            // Row conflicts
            if (i !== col && this.playerGrid[row][i] === value) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${i}"]`);
                cell?.classList.add('conflict');
            }
            // Column conflicts
            if (i !== row && this.playerGrid[i][col] === value) {
                const cell = document.querySelector(`[data-row="${i}"][data-col="${col}"]`);
                cell?.classList.add('conflict');
            }
        }

        // Box conflicts
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let r = startRow; r < startRow + 3; r++) {
            for (let c = startCol; c < startCol + 3; c++) {
                if ((r !== row || c !== col) && this.playerGrid[r][c] === value) {
                    const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                    cell?.classList.add('conflict');
                }
            }
        }
    }

    showErrorFeedback(row, col) {
        // Visual feedback - flash the cell red
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('error-flash');
            setTimeout(() => {
                cell.classList.remove('error-flash');
            }, 500);
        }

        // Audio feedback
        this.playSound('error');

        // Show temporary error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Wrong number!';
        errorMessage.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: bold;
            z-index: 1000;
            animation: fadeOut 1.5s forwards;
        `;

        document.body.appendChild(errorMessage);
        setTimeout(() => {
            errorMessage.remove();
        }, 1500);
    }

    playSound(type) {
        if (this.soundLevel === 'off') return;

        const volume = {
            'low': 0.3,
            'medium': 0.6,
            'high': 1.0
        }[this.soundLevel] || 0.6;

        // Create audio context for sound effects
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const playTone = (frequency, duration) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };

        switch (type) {
            case 'place':
                this.playInputSound();
                break;
            case 'error':
                playTone(300, 0.2);
                break;
            case 'complete':
                playTone(523, 0.2); // C
                setTimeout(() => playTone(659, 0.2), 100); // E
                setTimeout(() => playTone(784, 0.4), 200); // G
                break;
            case 'hint':
                playTone(1000, 0.15);
                break;
        }
    }

    playInputSound() {
        if (this.soundLevel === 'off') return;

        const volume = {
            'low': 0.3,
            'medium': 0.6,
            'high': 1.0
        }[this.soundLevel] || 0.6;

        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const playTone = (frequency, duration, waveType = 'sine') => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = waveType;
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };

        switch (this.inputSoundType) {
            case 'classic':
                playTone(800, 0.1);
                break;
            case 'bubble':
                // Create a soft, cute bubble-like sound with gentle frequencies
                playTone(400, 0.08, 'sine');
                setTimeout(() => playTone(600, 0.06, 'sine'), 30);
                setTimeout(() => playTone(800, 0.04, 'sine'), 60);
                break;
            case 'click':
                // Sharp, quick click sound
                playTone(1200, 0.03, 'square');
                break;
            case 'soft':
                // Gentle, mellow sound
                playTone(500, 0.15, 'triangle');
                break;
        }
    }

    updateStreakCounter() {
        // Load current streak
        const streakData = localStorage.getItem('sudoku_streak');
        if (streakData) {
            const parsed = JSON.parse(streakData);
            this.streakCount = parsed.count || 0;
        }
    }

    incrementStreak() {
        this.streakCount++;
        const streakData = {
            count: this.streakCount,
            lastDate: this.getTodayDateString()
        };
        localStorage.setItem('sudoku_streak', JSON.stringify(streakData));
    }

    checkPersonalBest() {
        const bestTimes = localStorage.getItem('sudoku_best_times');
        let best = { easy: null, medium: null, hard: null };

        if (bestTimes) {
            best = JSON.parse(bestTimes);
        }

        const currentTime = this.timer;
        const difficulty = this.currentDifficulty;

        if (!best[difficulty] || currentTime < best[difficulty]) {
            best[difficulty] = currentTime;
            localStorage.setItem('sudoku_best_times', JSON.stringify(best));
            return true;
        }
        return false;
    }

    showStats() {
        // Close completion modal
        document.getElementById('gameStatus').innerHTML = '';

        // Show comprehensive stats
        const modal = document.createElement('div');
        modal.className = 'stats-modal';
        modal.innerHTML = `
            <div class="stats-content">
                <div class="stats-header">
                    <h3>Your Statistics</h3>
                    <button class="close-btn" onclick="this.closest('.stats-modal').remove()">&times;</button>
                </div>
                <div class="stats-body">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h4>Current Streak</h4>
                            <div class="stat-number">${this.streakCount}</div>
                            <div class="stat-unit">days</div>
                        </div>
                        <div class="stat-card">
                            <h4>Games Played</h4>
                            <div class="stat-number">${this.getGamesPlayed()}</div>
                            <div class="stat-unit">total</div>
                        </div>
                        <div class="stat-card">
                            <h4>Average Time</h4>
                            <div class="stat-number">${this.getAverageTime()}</div>
                            <div class="stat-unit">minutes</div>
                        </div>
                    </div>
                    ${this.getBestTimesHTML()}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    getGamesPlayed() {
        // Count completed games from localStorage
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('completed_')) {
                count++;
            }
        }
        return count;
    }

    getAverageTime() {
        // Calculate average time from completed games
        let totalTime = 0;
        let count = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('completed_')) {
                try {
                    const game = JSON.parse(localStorage.getItem(key));
                    if (game && game.time) {
                        totalTime += game.time;
                        count++;
                    }
                } catch (e) {}
            }
        }

        if (count === 0) return '0:00';
        const avgSeconds = Math.round(totalTime / count);
        return this.formatTime(avgSeconds);
    }

    getBestTimesHTML() {
        const bestTimes = localStorage.getItem('sudoku_best_times');
        const best = bestTimes ? JSON.parse(bestTimes) : { easy: null, medium: null, hard: null };

        return `
            <div class="best-times">
                <h4>Best Times</h4>
                <div class="difficulty-times">
                    <div class="time-row">
                        <span class="difficulty">Easy:</span>
                        <span class="time">${best.easy ? this.formatTime(best.easy) : 'Not set'}</span>
                    </div>
                    <div class="time-row">
                        <span class="difficulty">Medium:</span>
                        <span class="time">${best.medium ? this.formatTime(best.medium) : 'Not set'}</span>
                    </div>
                    <div class="time-row">
                        <span class="difficulty">Hard:</span>
                        <span class="time">${best.hard ? this.formatTime(best.hard) : 'Not set'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    startNewGame() {
        // Close any modals
        document.querySelectorAll('.stats-modal').forEach(modal => modal.remove());
        document.getElementById('gameStatus').innerHTML = '';

        // Navigate back to dashboard
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.page');

        navLinks.forEach(l => l.classList.remove('active'));
        document.querySelector('[data-page="dashboard"]').classList.add('active');

        pages.forEach(page => page.classList.remove('active'));
        document.getElementById('dashboard').classList.add('active');
    }

    restartPuzzle() {
        if (!confirm('Are you sure you want to restart the current puzzle? This will clear all your progress.')) {
            return;
        }

        debugLog('Restarting current puzzle');

        // Remember if the game was paused before restarting
        const wasPaused = this.gamePaused;

        // Clear saved game state for this difficulty
        const currentPlayer = sessionStorage.getItem('currentPlayer');
        if (currentPlayer) {
            const key = `sudoku_${currentPlayer}_${this.getTodayDateString()}_${this.currentDifficulty}`;
            localStorage.removeItem(key);
        }

        // Stop current timer and clear auto-save
        this.stopTimer();
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }

        // Reset all game state
        this.timer = 0;
        this.hints = 0;
        this.errors = 0;
        this.hintTimePenalty = 0;
        this.currentHintCell = null;
        this.hintState = 'none';
        this.gameStarted = false;
        this.gameCompleted = false;
        this.gamePaused = false;
        this.selectedCell = null;
        this.moveHistory = [];

        // Explicitly clear the player grid before reloading
        this.playerGrid = Array(9).fill().map(() => Array(9).fill(0));
        this.candidates = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
        this.removedCandidates = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));

        // Force a display update to clear the DOM
        this.updateDisplay();

        // Reload the same puzzle fresh
        this.loadPuzzle(this.currentDifficulty);

        // If the game was paused before restarting, pause it again
        if (wasPaused) {
            this.gamePaused = true;
            this.stopTimer();

            // Update pause button and blur state
            const pauseBtn = document.getElementById('pauseBtn');
            if (pauseBtn) {
                pauseBtn.querySelector('i').className = 'fas fa-play';
                pauseBtn.title = 'Resume game';
            }

            // Add blur effect to sudoku grid
            const sudokuGrid = document.getElementById('sudokuGrid');
            if (sudokuGrid) {
                sudokuGrid.classList.add('blurred');
            }

            // Disable hint button
            const hintBtn = document.getElementById('hintBtn');
            if (hintBtn) {
                hintBtn.disabled = true;
            }

            document.getElementById('gameStatus').innerHTML =
                '<div class="status-message">Game paused. Click Resume to continue.</div>';
        } else {
            document.getElementById('gameStatus').innerHTML =
                '<div class="status-message">Puzzle restarted! Good luck!</div>';
        }

        // Restart auto-save interval
        this.autoSaveInterval = setInterval(() => {
            if (this.gameStarted && !this.gameCompleted) {
                this.saveGameState();
            }
        }, 10000);
    }

    destroy() {
        debugLog('Destroying SudokuEngine instance');

        // Auto-pause if game is in progress and not completed
        if (this.gameStarted && !this.gameCompleted && !this.gamePaused) {
            debugLog('Auto-pausing game before leaving puzzle page');
            this.gamePaused = true;
            this.saveGameState(); // Save the paused state
        }

        // Cleanup when switching pages
        this.stopTimer();
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }

        // Reset game state flags to prevent timer restart
        this.gameStarted = false;
        this.gameCompleted = false;
        this.gamePaused = false;

        // Close any open modals
        document.querySelectorAll('.settings-modal').forEach(modal => modal.remove());
    }

    // Navigation methods for completion notifications
    navigateToMedium() {
        // Ensure we stay on sudoku page
        this.ensureOnSudokuPage();

        // Remove completion notification first
        const notification = document.querySelector('.completion-notification-overlay');
        if (notification) {
            notification.remove();
        }

        // Close any modals and clear game status
        document.querySelectorAll('.stats-modal').forEach(modal => modal.remove());
        document.getElementById('gameStatus').innerHTML = '';

        // Change difficulty (this will load the new puzzle)
        this.changeDifficulty('medium');
    }

    navigateToHard() {
        // Ensure we stay on sudoku page
        this.ensureOnSudokuPage();

        // Remove completion notification first
        const notification = document.querySelector('.completion-notification-overlay');
        if (notification) {
            notification.remove();
        }

        // Close any modals and clear game status
        document.querySelectorAll('.stats-modal').forEach(modal => modal.remove());
        document.getElementById('gameStatus').innerHTML = '';

        // Change difficulty (this will load the new puzzle)
        this.changeDifficulty('hard');
    }

    // Helper method to ensure we're on the sudoku page
    ensureOnSudokuPage() {
        // Check if we're not on the sudoku page and navigate there if needed
        const sudokuPage = document.getElementById('sudoku');
        const pages = document.querySelectorAll('.page');
        const navLinks = document.querySelectorAll('.nav-link');

        if (!sudokuPage || !sudokuPage.classList.contains('active')) {
            // Switch to sudoku page
            pages.forEach(page => page.classList.remove('active'));
            navLinks.forEach(link => link.classList.remove('active'));

            if (sudokuPage) {
                sudokuPage.classList.add('active');
            }

            const sudokuNavLink = document.querySelector('.nav-link[data-page="sudoku"]');
            if (sudokuNavLink) {
                sudokuNavLink.classList.add('active');
            }
        }
    }

    navigateToDashboard() {
        // Navigate to dashboard section in the main app
        if (window.sudokuApp && window.sudokuApp.switchPage) {
            window.sudokuApp.switchPage('dashboard');
        } else {
            // Fallback: trigger navigation event
            const navEvent = new CustomEvent('navigate', {
                detail: { page: 'dashboard' }
            });
            document.dispatchEvent(navEvent);
        }

        // Remove completion notification
        const notification = document.querySelector('.completion-notification-overlay');
        if (notification) {
            notification.remove();
        }
    }
}

// Global Sudoku instance
window.sudokuEngine = null;

// Initialize Sudoku when page is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the sudoku page
    if (document.getElementById('sudoku')) {
        const initSudoku = async () => {
            debugLog('Initializing Sudoku');
            if (window.sudokuEngine) {
                debugLog('Destroying existing SudokuEngine');
                window.sudokuEngine.destroy();
                // Add small delay to ensure cleanup is complete
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            window.sudokuEngine = new SudokuEngine();
            await window.sudokuEngine.init();
        };

        // Initialize immediately if sudoku page is active
        if (document.getElementById('sudoku').classList.contains('active')) {
            initSudoku();
        }

        // Listen for page changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const sudokuPage = document.getElementById('sudoku');
                    if (sudokuPage && sudokuPage.classList.contains('active')) {
                        // Prevent rapid re-initialization
                        if (window.sudokuInitializing) {
                            debugLog('Sudoku already initializing, skipping');
                            return;
                        }
                        window.sudokuInitializing = true;
                        setTimeout(async () => {
                            await initSudoku();
                            window.sudokuInitializing = false;
                        }, 100); // Small delay to ensure DOM is ready
                    } else if (window.sudokuEngine) {
                        debugLog('Sudoku page no longer active, destroying engine');
                        window.sudokuEngine.destroy();
                        window.sudokuEngine = null;
                    }
                }
            });
        });

        const sudokuPage = document.getElementById('sudoku');
        if (sudokuPage) {
            observer.observe(sudokuPage, { attributes: true });
        }
    }
});

// Global function to force refresh puzzles from browser console
window.refreshPuzzles = function(clearSavedGames = false) {
    if (window.sudokuEngine) {
        if (clearSavedGames) {
            debugLog('🗑️ Clearing saved game states...');
            const player = sessionStorage.getItem('currentPlayer');
            const today = new Date().toISOString().split('T')[0];
            if (player) {
                ['easy', 'medium', 'hard'].forEach(diff => {
                    const key = `sudoku_${player}_${today}_${diff}`;
                    localStorage.removeItem(key);
                    debugLog('Cleared saved game:', key);
                });
                debugLog('✅ All saved games cleared for today');
            }
        }
        return window.sudokuEngine.forceRefreshPuzzles();
    } else {
        console.warn('Sudoku engine not available. Try running this on the puzzle page.');
        return false;
    }
};

// Convenience function to refresh puzzles and clear saved games
window.refreshPuzzlesCompletely = function() {
    return window.refreshPuzzles(true);
};

// Debug flag - set to true to enable console output for debug functions
window.sudokuDebug = false;

// Helper function for conditional debug logging
function debugLog(...args) {
    if (window.sudokuDebug) {
        console.log(...args);
    }
}

// Convenience functions to enable/disable debug output
window.enableDebug = () => { window.sudokuDebug = true; console.log('🔧 Debug output enabled'); };
window.disableDebug = () => { window.sudokuDebug = false; console.log('🔇 Debug output disabled'); };

// Master refresh function for development - clears EVERYTHING and forces new puzzles
window.masterRefresh = async function(verbose = true) {
    // Temporarily enable debug output for this function
    const originalDebug = window.sudokuDebug;
    if (verbose) window.sudokuDebug = true;

    debugLog('🚀 MASTER REFRESH - Nuclear option for development');
    debugLog('=' .repeat(60));

    const today = new Date().toISOString().split('T')[0];
    const player = sessionStorage.getItem('currentPlayer');

    try {
        // Step 1: Clear all browser storage
        debugLog('🧹 Step 1: Clearing all browser storage...');
        localStorage.clear();
        sessionStorage.setItem('currentPlayer', player); // Restore player
        window.preloadedPuzzles = null;
        debugLog('✅ Browser storage cleared');

        // Step 2: Clear all app caches
        debugLog('🧹 Step 2: Clearing all app caches...');
        if (window.sudokuApp) {
            window.sudokuApp.puzzleCache.puzzles = null;
            window.sudokuApp.puzzleCache.loadTime = null;
            window.sudokuApp.cache.data = null;
            window.sudokuApp.cache.lastUpdate = null;
            debugLog('✅ App caches cleared');
        }

        // Step 3: Reset database puzzles via API
        debugLog('🗃️ Step 3: Resetting database puzzles...');
        try {
            const resetResponse = await fetch('/api/puzzles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset', date: today })
            });
            if (resetResponse.ok) {
                debugLog('✅ Database puzzles reset');
            } else {
                console.warn('⚠️ Database reset failed, continuing...');
            }
        } catch (error) {
            console.warn('⚠️ Database reset error:', error.message);
        }

        // Step 4: Force generate new puzzles
        debugLog('🎲 Step 4: Force generating new puzzles...');
        try {
            const generateResponse = await fetch('/api/puzzles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate', date: today })
            });
            if (generateResponse.ok) {
                const newPuzzles = await generateResponse.json();
                debugLog('✅ New puzzles generated');

                // Show puzzle stats
                if (newPuzzles.easy?.puzzle) {
                    const easyClues = newPuzzles.easy.puzzle.flat().filter(n => n !== 0).length;
                    debugLog('🟢 Easy puzzle:', easyClues, 'clues');
                }
                if (newPuzzles.medium?.puzzle) {
                    const mediumClues = newPuzzles.medium.puzzle.flat().filter(n => n !== 0).length;
                    debugLog('🟡 Medium puzzle:', mediumClues, 'clues');
                }
                if (newPuzzles.hard?.puzzle) {
                    const hardClues = newPuzzles.hard.puzzle.flat().filter(n => n !== 0).length;
                    debugLog('🔴 Hard puzzle:', hardClues, 'clues');
                }
            }
        } catch (error) {
            console.warn('⚠️ Puzzle generation error:', error.message);
        }

        // Step 5: Force reload current page data
        debugLog('🔄 Step 5: Reloading puzzle engine...');
        if (window.sudokuEngine) {
            // Clear current game state
            window.sudokuEngine.gameStarted = false;
            window.sudokuEngine.currentDifficulty = null;
            window.sudokuEngine.dailyPuzzles = null;

            // Force reload puzzles
            await window.sudokuEngine.loadDailyPuzzles(true);
            debugLog('✅ Puzzle engine reloaded');

            // Show what's loaded in memory
            if (window.sudokuEngine.dailyPuzzles) {
                debugLog('📊 Puzzles now in memory:');
                Object.keys(window.sudokuEngine.dailyPuzzles).forEach(diff => {
                    const puzzle = window.sudokuEngine.dailyPuzzles[diff];
                    if (puzzle?.puzzle) {
                        const clues = puzzle.puzzle.flat().filter(n => n !== 0).length;
                        debugLog(`  ${diff}: ${clues} clues`);
                    }
                });
            }
        }

        // Step 6: Force UI refresh
        debugLog('🖼️ Step 6: Force refreshing UI...');
        if (window.location.pathname.includes('sudoku') || window.location.pathname.includes('puzzle')) {
            debugLog('On puzzle page - you may need to select a difficulty to see new puzzles');
        } else {
            debugLog('Navigate to puzzle page to test new puzzles');
        }

        debugLog('=' .repeat(60));
        debugLog('🎯 MASTER REFRESH COMPLETE!');
        debugLog('💡 Try selecting a difficulty level to see the new puzzles');
        debugLog('📝 New algorithm: Easy=32-38, Medium=22-30, Hard=17-25 clues');

        // Restore original debug state
        window.sudokuDebug = originalDebug;
        return true;

    } catch (error) {
        console.error('❌ Master refresh failed:', error);
        // Restore original debug state
        window.sudokuDebug = originalDebug;
        return false;
    }
};

// Debug function to inspect current puzzle state
window.debugPuzzleState = function(verbose = true) {
    // Temporarily enable debug output for this function
    const originalDebug = window.sudokuDebug;
    if (verbose) window.sudokuDebug = true;

    debugLog('🔍 PUZZLE STATE DIAGNOSTIC');
    debugLog('=' .repeat(50));

    // Check if sudokuEngine exists
    if (!window.sudokuEngine) {
        debugLog('❌ window.sudokuEngine not found');
        debugLog('💡 Make sure you\'re on the Sudoku game page');
        window.sudokuDebug = originalDebug;
        return;
    }

    const engine = window.sudokuEngine;

    // Basic engine state
    debugLog('📋 Basic Engine State:');
    debugLog('  Current difficulty:', engine.currentDifficulty);
    debugLog('  Game started:', engine.gameStarted);
    debugLog('  Last puzzle date:', engine.lastPuzzleDate);

    // Check daily puzzles in memory
    debugLog('\n📊 Daily Puzzles in Memory:');
    if (engine.dailyPuzzles) {
        Object.keys(engine.dailyPuzzles).forEach(diff => {
            const puzzle = engine.dailyPuzzles[diff];
            if (puzzle?.puzzle) {
                const clues = puzzle.puzzle.flat().filter(n => n !== 0).length;
                debugLog(`  ${diff}: ${clues} clues`);
            } else {
                debugLog(`  ${diff}: Invalid puzzle data`);
            }
        });
    } else {
        debugLog('  ❌ No dailyPuzzles loaded');
    }

    // Check what's displayed on screen
    debugLog('\n🖼️ Current Display State:');
    if (engine.initialGrid) {
        const displayedClues = engine.initialGrid.flat().filter(n => n !== 0).length;
        debugLog('  Displayed puzzle clues:', displayedClues);
    } else {
        debugLog('  ❌ No initialGrid (nothing displayed)');
    }

    if (engine.playerGrid) {
        const playerClues = engine.playerGrid.flat().filter(n => n !== 0).length;
        debugLog('  Player grid filled cells:', playerClues);
    }

    // Check caches
    debugLog('\n💾 Cache Status:');
    debugLog('  window.preloadedPuzzles:', !!window.preloadedPuzzles);
    if (window.sudokuApp) {
        debugLog('  sudokuApp.puzzleCache:', !!window.sudokuApp.puzzleCache.puzzles);
        debugLog('  sudokuApp cache time:', window.sudokuApp.puzzleCache.loadTime);
    }

    // Check localStorage
    const player = sessionStorage.getItem('currentPlayer');
    const today = new Date().toISOString().split('T')[0];
    debugLog('\n💾 LocalStorage Saved Games:');
    if (player) {
        ['easy', 'medium', 'hard'].forEach(diff => {
            const key = `sudoku_${player}_${today}_${diff}`;
            const saved = localStorage.getItem(key);
            debugLog(`  ${diff}: ${saved ? 'SAVED GAME EXISTS' : 'No saved game'}`);
        });
    } else {
        debugLog('  No player found');
    }

    debugLog('\n🔧 Recommendations:');
    if (!engine.dailyPuzzles) {
        debugLog('  • Run masterRefresh() to reload puzzles');
    } else if (engine.dailyPuzzles && engine.initialGrid) {
        const memoryClues = engine.dailyPuzzles[engine.currentDifficulty]?.puzzle?.flat().filter(n => n !== 0).length;
        const displayClues = engine.initialGrid.flat().filter(n => n !== 0).length;
        if (memoryClues !== displayClues) {
            debugLog(`  • MISMATCH: Memory has ${memoryClues} clues but display shows ${displayClues}`);
            debugLog('  • Try masterRefresh() or switch difficulty levels');
        } else {
            debugLog('  • Memory and display match - puzzle should be correct');
        }
    }

    debugLog('=' .repeat(50));

    // Restore original debug state
    window.sudokuDebug = originalDebug;
};