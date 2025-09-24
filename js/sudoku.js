class SudokuEngine {
    constructor() {
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.initialGrid = Array(9).fill().map(() => Array(9).fill(0));
        this.playerGrid = Array(9).fill().map(() => Array(9).fill(0));
        this.candidates = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
        this.manualCandidates = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
        this.selectedCell = null;
        this.timer = 0;
        this.timerInterval = null;
        this.hints = 0;
        this.errors = 0;
        this.currentDifficulty = 'easy';
        this.gameStarted = false;
        this.gameCompleted = false;
        this.candidateMode = false;
        this.showAllCandidates = false;
        this.gamePaused = false;
        this.moveHistory = [];
        this.autoSaveInterval = null;
        this.explicitlySelectedDifficulty = false; // Track if user explicitly selected difficulty

        // New NYT-style features
        this.autoCheckErrors = true;
        this.showTimer = true;
        this.autoSave = true;
        this.soundLevel = 'medium';
        this.streakCount = 0;
        this.bestTime = { easy: null, medium: null, hard: null };
    }

    // Initialize Sudoku UI and game
    async init() {
        this.loadSettings();
        this.createSudokuInterface();
        await this.loadDailyPuzzles();
        this.setupEventListeners();

        // Check if there's a selected difficulty from dashboard
        const selectedDifficulty = sessionStorage.getItem('selectedDifficulty');
        if (selectedDifficulty) {
            this.explicitlySelectedDifficulty = true;
            this.currentDifficulty = selectedDifficulty;
            sessionStorage.removeItem('selectedDifficulty'); // Clear it once used
            console.log('Using selected difficulty from dashboard:', selectedDifficulty);

            // When user explicitly selects a difficulty, start fresh game instead of loading saved state
            console.log('Loading fresh puzzle for selected difficulty:', this.currentDifficulty);
            this.loadPuzzle(this.currentDifficulty);
        } else {
            // Only load saved game state if no difficulty was explicitly selected
            await this.loadGameState();

            // If no saved game state and we have a current difficulty, start new game
            if (!this.gameStarted && this.currentDifficulty) {
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
                <div>
                    <div class="puzzle-info">
                        <h2 class="puzzle-title">Sudoku</h2>
                        <div class="puzzle-difficulty">${this.currentDifficulty.charAt(0).toUpperCase() + this.currentDifficulty.slice(1)}</div>
                    </div>
                    <div class="puzzle-date">${this.getFormattedDate()}</div>
                </div>

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
                            <div class="stat-label">Mistakes</div>
                            <span class="errors-count" id="errorsCount">0</span>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Hints</div>
                            <span class="hints-count" id="hintsCount">0</span>
                        </div>
                    </div>
                </div>

                <!-- Sudoku Grid -->
                <div class="sudoku-grid-container">
                    <div class="sudoku-grid" id="sudokuGrid">
                        ${this.generateGridHTML()}
                    </div>
                </div>

                <!-- Game Controls -->
                <div class="game-controls">
                    <div class="number-input">
                        <div class="number-buttons">
                            ${Array.from({length: 9}, (_, i) =>
                                `<button class="number-btn" data-number="${i + 1}">${i + 1}</button>`
                            ).join('')}
                            <button class="number-btn erase-btn" data-number="0">
                                <i class="fas fa-eraser"></i>
                            </button>
                        </div>
                    </div>

                    <div class="action-buttons">
                        <button class="action-btn undo-btn" id="undoBtn" title="Undo last move">
                            <i class="fas fa-undo-alt"></i>
                            <span>Undo</span>
                        </button>
                        <button class="action-btn erase-btn" id="eraseBtn" title="Erase selected cell">
                            <i class="fas fa-eraser"></i>
                            <span>Erase</span>
                        </button>
                        <button class="action-btn candidate-btn" id="candidateBtn" title="Toggle pencil mode">
                            <i class="fas fa-pencil-alt"></i>
                            <span>Notes</span>
                        </button>
                        <button class="action-btn hint-btn" id="hintBtn" title="Get a hint">
                            <i class="fas fa-lightbulb"></i>
                            <span>Hint</span>
                        </button>
                        <button class="action-btn pause-btn" id="pauseBtn" title="Pause game">
                            <i class="fas fa-pause"></i>
                            <span>Pause</span>
                        </button>
                        <button class="action-btn toggle-candidates-btn" id="toggleCandidatesBtn" title="Toggle all candidates visibility">
                            <i class="fas fa-eye"></i>
                            <span>Show All</span>
                        </button>
                        <button class="action-btn settings-btn" id="settingsBtn" title="Game settings">
                            <i class="fas fa-cog"></i>
                            <span>Settings</span>
                        </button>
                    </div>
                </div>

                <!-- Game Status -->
                <div class="game-status" id="gameStatus">
                    <div class="status-message">
                        Select a difficulty to start playing!
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

    getCellClasses(row, col) {
        let classes = [];

        // Add region classes for visual separation
        if (row % 3 === 2 && row < 8) classes.push('bottom-thick');
        if (col % 3 === 2 && col < 8) classes.push('right-thick');
        if (row % 3 === 0 && row > 0) classes.push('top-thick');
        if (col % 3 === 0 && col > 0) classes.push('left-thick');

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

        // Number input
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const number = parseInt(e.target.dataset.number || e.target.closest('.number-btn').dataset.number);
                this.inputNumber(number);
            });
        });

        // Action buttons
        document.getElementById('hintBtn')?.addEventListener('click', () => this.getHint());
        document.getElementById('undoBtn')?.addEventListener('click', () => this.undo());
        document.getElementById('eraseBtn')?.addEventListener('click', () => this.eraseSelectedCell());
        document.getElementById('candidateBtn')?.addEventListener('click', () => this.toggleCandidateMode());
        document.getElementById('toggleCandidatesBtn')?.addEventListener('click', () => this.toggleAllCandidates());
        document.getElementById('pauseBtn')?.addEventListener('click', () => this.togglePause());
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.showSettings());

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyInput(e));

        // Auto-save every 10 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.gameStarted && !this.gameCompleted) {
                this.saveGameState();
            }
        }, 10000);
    }

    changeDifficulty(difficulty) {
        // Don't switch if user already explicitly selected this difficulty
        if (this.explicitlySelectedDifficulty && this.currentDifficulty === difficulty) {
            console.log('Ignoring changeDifficulty call - already loaded explicitly selected difficulty:', difficulty);
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
            // First, check if puzzles are already preloaded
            if (window.preloadedPuzzles) {
                this.dailyPuzzles = window.preloadedPuzzles;
                console.log('✅ Using preloaded puzzles - instant load!');
                return;
            }

            // Check if sudokuApp is available and has preloaded puzzles
            if (window.sudokuApp && window.sudokuApp.arePuzzlesPreloaded()) {
                this.dailyPuzzles = window.sudokuApp.getPreloadedPuzzles();
                console.log('✅ Using cached preloaded puzzles');
                return;
            }

            // Fallback: Load daily puzzles from server API
            console.log('🔄 Preloaded puzzles not available, fetching from server...');
            const today = this.getTodayDateString();
            const response = await fetch(`/api/puzzles?date=${today}`);

            if (response.ok) {
                this.dailyPuzzles = await response.json();
                console.log('Loaded daily puzzles from server:', this.dailyPuzzles);
            } else {
                throw new Error('Failed to fetch daily puzzles');
            }
        } catch (error) {
            console.error('Failed to load daily puzzles:', error);
            // Generate fallback puzzles
            this.generateFallbackPuzzles();
        }
    }

    generatePuzzle(difficulty) {
        // Simplified puzzle generation - in production would use advanced algorithm
        const puzzle = Array(9).fill().map(() => Array(9).fill(0));
        const solution = Array(9).fill().map(() => Array(9).fill(0));

        // Generate a complete solution first
        this.generateCompleteSolution(solution);

        // Remove numbers based on difficulty
        const cellsToRemove = {
            easy: 45,    // ~36 given numbers
            medium: 55,  // ~26 given numbers
            hard: 65     // ~16 given numbers
        };

        // Copy solution to puzzle
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                puzzle[i][j] = solution[i][j];
            }
        }

        // Remove cells to create puzzle
        let removed = 0;
        while (removed < cellsToRemove[difficulty]) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);

            if (puzzle[row][col] !== 0) {
                puzzle[row][col] = 0;
                removed++;
            }
        }

        return { puzzle, solution };
    }

    generateCompleteSolution(grid) {
        // Simple backtracking solver to generate a complete solution
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    this.shuffle(numbers);

                    for (let num of numbers) {
                        if (this.isValidMove(grid, row, col, num)) {
                            grid[row][col] = num;

                            if (this.generateCompleteSolution(grid)) {
                                return true;
                            }

                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
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

        // Reset game state
        this.timer = 0;
        this.hints = 0;
        this.errors = 0;
        this.gameStarted = true;
        this.gameCompleted = false;
        this.gamePaused = false;  // Reset pause state
        this.selectedCell = null;

        // Clear any previous candidates
        this.candidates = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));

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
                    candidatesDiv.innerHTML = '';

                    // Mark as given or user input
                    if (this.initialGrid[row][col] !== 0) {
                        cell.classList.add('given');
                    } else {
                        cell.classList.add('user-input');

                        // Check for errors by temporarily removing the cell value
                        const tempGrid = this.playerGrid.map(row => [...row]);
                        tempGrid[row][col] = 0; // Temporarily remove to check conflicts
                        if (!this.isValidMove(tempGrid, row, col, this.playerGrid[row][col])) {
                            cell.classList.add('error');
                        }
                    }
                } else {
                    valueDiv.textContent = '';

                    // Show candidates if they exist (regardless of candidate mode)
                    if (this.candidates[row][col].size > 0) {
                        candidatesDiv.innerHTML = Array.from(this.candidates[row][col])
                            .sort((a, b) => a - b)
                            .map(num => `<span class="candidate-num">${num}</span>`)
                            .join('');
                    } else {
                        candidatesDiv.innerHTML = '';
                    }
                }

                // Highlight selected cell and related cells
                if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
                    cell.classList.add('selected');
                } else if (this.selectedCell && (
                    this.selectedCell.row === row ||
                    this.selectedCell.col === col ||
                    this.isInSameBox(row, col, this.selectedCell.row, this.selectedCell.col)
                )) {
                    cell.classList.add('highlighted');
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
    }

    isInSameBox(row1, col1, row2, col2) {
        return Math.floor(row1 / 3) === Math.floor(row2 / 3) &&
               Math.floor(col1 / 3) === Math.floor(col2 / 3);
    }

    selectCell(row, col) {
        this.selectedCell = { row, col };
        // Don't update display if it would clear candidates
        this.updateDisplay();
    }

    inputNumber(number) {
        if (!this.selectedCell || !this.gameStarted || this.gameCompleted || this.gamePaused) return;

        const { row, col } = this.selectedCell;

        // Don't allow changing given numbers
        if (this.initialGrid[row][col] !== 0) return;

        // Save current state for undo
        const previousValue = this.playerGrid[row][col];
        const previousCandidates = new Set(this.candidates[row][col]);

        this.moveHistory.push({
            row,
            col,
            previousValue,
            previousCandidates: previousCandidates,
            timestamp: Date.now()
        });

        if (number === 0) {
            // Erase
            this.playerGrid[row][col] = 0;
            this.candidates[row][col].clear();
        } else if (this.candidateMode) {
            // Toggle candidate - only if cell is empty
            if (this.playerGrid[row][col] === 0) {
                if (this.candidates[row][col].has(number)) {
                    this.candidates[row][col].delete(number);
                    this.manualCandidates[row][col].delete(number);
                } else {
                    this.candidates[row][col].add(number);
                    this.manualCandidates[row][col].add(number);
                }
            }
        } else {
            // Place number - clear candidates when placing a number
            this.playerGrid[row][col] = number;
            this.candidates[row][col].clear();

            // Check for errors by temporarily removing the cell value
            const tempGrid = this.playerGrid.map(row => [...row]);
            tempGrid[row][col] = 0;
            if (!this.isValidMove(tempGrid, row, col, number)) {
                this.errors++;
            }
        }

        // Update all candidates if in show all mode or if we placed a number
        if (this.showAllCandidates || (!this.candidateMode && number !== 0)) {
            this.updateAllCandidates();
        }

        // Auto-check for conflicts if enabled
        if (this.autoCheckErrors && number !== 0 && !this.candidateMode) {
            this.highlightConflicts(row, col);
        }

        this.updateDisplay();
        this.playSound('place');
        this.checkCompletion();
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
                if (this.playerGrid[row][col] === 0) {
                    if (this.showAllCandidates) {
                        // Clear and regenerate all candidates
                        this.candidates[row][col].clear();
                        for (let num = 1; num <= 9; num++) {
                            if (this.isValidMove(this.playerGrid, row, col, num)) {
                                this.candidates[row][col].add(num);
                            }
                        }
                    } else {
                        // Remove invalid candidates from user-entered ones
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
    }

    togglePause() {
        if (!this.gameStarted || this.gameCompleted) return;

        this.gamePaused = !this.gamePaused;
        const pauseBtn = document.getElementById('pauseBtn');
        const sudokuGrid = document.getElementById('sudokuGrid');

        if (this.gamePaused) {
            this.stopTimer();
            pauseBtn.querySelector('span').textContent = 'Resume';
            pauseBtn.querySelector('i').className = 'fas fa-play';
            sudokuGrid.classList.add('paused');
            document.getElementById('gameStatus').innerHTML =
                '<div class="status-message">Game paused. Click Resume to continue.</div>';
        } else {
            this.startTimer();
            pauseBtn.querySelector('span').textContent = 'Pause';
            pauseBtn.querySelector('i').className = 'fas fa-pause';
            sudokuGrid.classList.remove('paused');
            document.getElementById('gameStatus').innerHTML =
                '<div class="status-message">Game resumed!</div>';
        }
    }

    getHint() {
        if (!this.gameStarted || this.gameCompleted) return;

        // Find best hint using deterministic algorithm
        const hintCell = this.findBestHint();

        if (hintCell) {
            const { row, col, value, technique } = hintCell;

            // Provide the hint
            this.playerGrid[row][col] = value;
            this.candidates[row][col].clear();
            this.hints++;

            // Select the hinted cell
            this.selectCell(row, col);
            this.updateDisplay();

            // Show enhanced hint explanation
            const statusDiv = document.getElementById('gameStatus');
            statusDiv.innerHTML = `
                <div class="hint-message">
                    <div class="hint-header">
                        <i class="fas fa-lightbulb"></i>
                        <strong>${hintCell.technique}</strong>
                    </div>
                    <div class="hint-body">
                        ${hintCell.explanation}
                    </div>
                    <div class="hint-location">
                        Cell: R${row + 1}C${col + 1} = ${value}
                    </div>
                </div>
            `;

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
                    .hint-location {
                        font-family: 'Orbitron', monospace;
                        font-weight: 700;
                        font-size: 0.9rem;
                        background: rgba(255, 255, 255, 0.2);
                        padding: 0.25rem 0.5rem;
                        border-radius: 4px;
                        display: inline-block;
                    }
                    @keyframes hintAppear {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `;
                document.head.appendChild(hintStyles);
            }

            this.checkCompletion();
        } else {
            document.getElementById('gameStatus').innerHTML =
                '<div class="status-message">No hints available right now.</div>';
        }
    }

    findBestHint() {
        // Deterministic hint finding with advanced techniques

        // 1. Look for naked singles first (easiest)
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.playerGrid[row][col] === 0) {
                    const possibleValues = this.getPossibleValues(row, col);
                    if (possibleValues.length === 1) {
                        return {
                            row,
                            col,
                            value: possibleValues[0],
                            technique: 'Naked Single',
                            explanation: `Only ${possibleValues[0]} can go in this cell`
                        };
                    }
                }
            }
        }

        // 2. Look for hidden singles
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.playerGrid[row][col] === 0) {
                    const possibleValues = this.getPossibleValues(row, col);
                    for (let value of possibleValues) {
                        const hiddenResult = this.isHiddenSingle(row, col, value);
                        if (hiddenResult.isHidden) {
                            return {
                                row,
                                col,
                                value,
                                technique: 'Hidden Single',
                                explanation: `${value} can only go here in this ${hiddenResult.region}`
                            };
                        }
                    }
                }
            }
        }

        // 3. Look for pointing pairs/box-line reduction
        const pointingHint = this.findPointingPairs();
        if (pointingHint) {
            return pointingHint;
        }

        // 4. Look for naked pairs
        const nakedPairHint = this.findNakedPairs();
        if (nakedPairHint) {
            return nakedPairHint;
        }

        // 5. If no logical techniques work, give a random valid move
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.playerGrid[row][col] === 0) {
                    const correctValue = this.solution[row][col];
                    return {
                        row,
                        col,
                        value: correctValue,
                        technique: 'Solution Hint',
                        explanation: `When stuck, try ${correctValue} - it's the correct answer`
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

    isHiddenSingle(row, col, value) {
        // Check if this value can only go in this cell in its row, column, or box

        // Check row
        let canPlaceInRow = 0;
        for (let c = 0; c < 9; c++) {
            if (this.playerGrid[row][c] === 0 && this.isValidMove(this.playerGrid, row, c, value)) {
                canPlaceInRow++;
            }
        }
        if (canPlaceInRow === 1) return { isHidden: true, region: 'row' };

        // Check column
        let canPlaceInCol = 0;
        for (let r = 0; r < 9; r++) {
            if (this.playerGrid[r][col] === 0 && this.isValidMove(this.playerGrid, r, col, value)) {
                canPlaceInCol++;
            }
        }
        if (canPlaceInCol === 1) return { isHidden: true, region: 'column' };

        // Check box
        const startRow = row - row % 3;
        const startCol = col - col % 3;
        let canPlaceInBox = 0;
        for (let r = startRow; r < startRow + 3; r++) {
            for (let c = startCol; c < startCol + 3; c++) {
                if (this.playerGrid[r][c] === 0 && this.isValidMove(this.playerGrid, r, c, value)) {
                    canPlaceInBox++;
                }
            }
        }
        if (canPlaceInBox === 1) return { isHidden: true, region: 'box' };

        return { isHidden: false };
    }

    findPointingPairs() {
        // Look for pointing pairs - when a number in a box can only be in one line
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                const startRow = boxRow * 3;
                const startCol = boxCol * 3;

                for (let num = 1; num <= 9; num++) {
                    // Check if number is already in this box
                    let hasNumber = false;
                    for (let r = startRow; r < startRow + 3; r++) {
                        for (let c = startCol; c < startCol + 3; c++) {
                            if (this.playerGrid[r][c] === num) {
                                hasNumber = true;
                                break;
                            }
                        }
                        if (hasNumber) break;
                    }
                    if (hasNumber) continue;

                    // Find all possible positions for this number in the box
                    const positions = [];
                    for (let r = startRow; r < startRow + 3; r++) {
                        for (let c = startCol; c < startCol + 3; c++) {
                            if (this.playerGrid[r][c] === 0 && this.isValidMove(this.playerGrid, r, c, num)) {
                                positions.push({ row: r, col: c });
                            }
                        }
                    }

                    // Check if all positions are in the same row or column
                    if (positions.length > 1) {
                        const sameRow = positions.every(pos => pos.row === positions[0].row);
                        const sameCol = positions.every(pos => pos.col === positions[0].col);

                        if (sameRow || sameCol) {
                            // This is a pointing pair - eliminate candidates in the line
                            const eliminationFound = this.findPointingPairEliminations(positions, num, sameRow);
                            if (eliminationFound) {
                                return {
                                    row: positions[0].row,
                                    col: positions[0].col,
                                    value: num,
                                    technique: 'Pointing Pair',
                                    explanation: `${num} in this box must be in this ${sameRow ? 'row' : 'column'}`
                                };
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    findPointingPairEliminations(positions, num, sameRow) {
        // Check if we can eliminate candidates elsewhere in the line
        const line = sameRow ? positions[0].row : positions[0].col;

        for (let i = 0; i < 9; i++) {
            const checkRow = sameRow ? line : i;
            const checkCol = sameRow ? i : line;

            // Skip if this position is in the same box as the pointing pair
            const inSameBox = positions.some(pos =>
                Math.floor(checkRow / 3) === Math.floor(pos.row / 3) &&
                Math.floor(checkCol / 3) === Math.floor(pos.col / 3)
            );

            if (!inSameBox && this.playerGrid[checkRow][checkCol] === 0) {
                // This cell could have the number eliminated
                if (this.isValidMove(this.playerGrid, checkRow, checkCol, num)) {
                    return true; // Found a cell where we could eliminate candidates
                }
            }
        }
        return false;
    }

    findNakedPairs() {
        // Look for naked pairs - two cells in a line with the same two candidates
        for (let row = 0; row < 9; row++) {
            const hint = this.findNakedPairsInRow(row);
            if (hint) return hint;
        }

        for (let col = 0; col < 9; col++) {
            const hint = this.findNakedPairsInColumn(col);
            if (hint) return hint;
        }

        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                const hint = this.findNakedPairsInBox(boxRow, boxCol);
                if (hint) return hint;
            }
        }

        return null;
    }

    findNakedPairsInRow(row) {
        const emptyCells = [];
        for (let col = 0; col < 9; col++) {
            if (this.playerGrid[row][col] === 0) {
                const candidates = this.getPossibleValues(row, col);
                if (candidates.length === 2) {
                    emptyCells.push({ row, col, candidates });
                }
            }
        }

        // Look for matching pairs
        for (let i = 0; i < emptyCells.length - 1; i++) {
            for (let j = i + 1; j < emptyCells.length; j++) {
                const cell1 = emptyCells[i];
                const cell2 = emptyCells[j];

                if (cell1.candidates.length === 2 && cell2.candidates.length === 2 &&
                    cell1.candidates[0] === cell2.candidates[0] &&
                    cell1.candidates[1] === cell2.candidates[1]) {

                    // Found a naked pair - check if it helps solve other cells
                    return this.checkNakedPairElimination(row, -1, cell1.candidates, 'row');
                }
            }
        }
        return null;
    }

    findNakedPairsInColumn(col) {
        const emptyCells = [];
        for (let row = 0; row < 9; row++) {
            if (this.playerGrid[row][col] === 0) {
                const candidates = this.getPossibleValues(row, col);
                if (candidates.length === 2) {
                    emptyCells.push({ row, col, candidates });
                }
            }
        }

        // Look for matching pairs
        for (let i = 0; i < emptyCells.length - 1; i++) {
            for (let j = i + 1; j < emptyCells.length; j++) {
                const cell1 = emptyCells[i];
                const cell2 = emptyCells[j];

                if (cell1.candidates.length === 2 && cell2.candidates.length === 2 &&
                    cell1.candidates[0] === cell2.candidates[0] &&
                    cell1.candidates[1] === cell2.candidates[1]) {

                    return this.checkNakedPairElimination(-1, col, cell1.candidates, 'column');
                }
            }
        }
        return null;
    }

    findNakedPairsInBox(boxRow, boxCol) {
        const startRow = boxRow * 3;
        const startCol = boxCol * 3;
        const emptyCells = [];

        for (let r = startRow; r < startRow + 3; r++) {
            for (let c = startCol; c < startCol + 3; c++) {
                if (this.playerGrid[r][c] === 0) {
                    const candidates = this.getPossibleValues(r, c);
                    if (candidates.length === 2) {
                        emptyCells.push({ row: r, col: c, candidates });
                    }
                }
            }
        }

        // Look for matching pairs
        for (let i = 0; i < emptyCells.length - 1; i++) {
            for (let j = i + 1; j < emptyCells.length; j++) {
                const cell1 = emptyCells[i];
                const cell2 = emptyCells[j];

                if (cell1.candidates.length === 2 && cell2.candidates.length === 2 &&
                    cell1.candidates[0] === cell2.candidates[0] &&
                    cell1.candidates[1] === cell2.candidates[1]) {

                    return {
                        row: cell1.row,
                        col: cell1.col,
                        value: cell1.candidates[0],
                        technique: 'Naked Pair',
                        explanation: `Naked pair limits other cells in this box`
                    };
                }
            }
        }
        return null;
    }

    checkNakedPairElimination(row, col, pairCandidates, region) {
        // This is a simplified check - in a real implementation we'd eliminate candidates
        // For hints, we just indicate that a naked pair technique could be applied
        if (region === 'row') {
            for (let c = 0; c < 9; c++) {
                if (this.playerGrid[row][c] === 0) {
                    const candidates = this.getPossibleValues(row, c);
                    if (candidates.length === 1) {
                        return {
                            row,
                            col: c,
                            value: candidates[0],
                            technique: 'Naked Pair Effect',
                            explanation: `Naked pair in this row makes ${candidates[0]} the only possibility`
                        };
                    }
                }
            }
        }
        return null;
    }

    checkCompletion() {
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

        if (completed) {
            this.gameCompleted = true;
            this.stopTimer();
            this.playSound('complete');
            this.incrementStreak();

            const score = this.calculateFinalScore();
            const isPersonalBest = this.checkPersonalBest();

            // Check for theme-specific achievements
            const themeAchievements = this.checkThemeAchievements();

            let statusMessage = `
                <div class="completion-modal">
                    <div class="completion-content">
                        <div class="completion-header">
                            <h2>🎉 Puzzle Complete!</h2>
                            ${isPersonalBest ? '<div class="personal-best">🏆 New Personal Best!</div>' : ''}
                        </div>
                        <div class="completion-stats">
                            <div class="stat-row">
                                <span class="stat-label">Time:</span>
                                <span class="stat-value">${this.formatTime(this.timer)}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Score:</span>
                                <span class="stat-value">${score}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Mistakes:</span>
                                <span class="stat-value">${this.errors}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Streak:</span>
                                <span class="stat-value">${this.streakCount} days</span>
                            </div>
                        </div>
            `;

            // Add theme multiplier info if active
            if (window.themeManager) {
                const themeInfo = window.themeManager.getThemeInfo();
                if (themeInfo && themeInfo.multiplier > 1) {
                    statusMessage += `<div class="theme-bonus">🎨 ${themeInfo.name} Bonus: ×${themeInfo.multiplier}</div>`;
                }
            }

            // Add achievement notifications
            if (themeAchievements.length > 0) {
                statusMessage += `<div class="achievements-unlocked">`;
                themeAchievements.forEach(achievement => {
                    statusMessage += `<div class="achievement-unlock">🏆 ${achievement.name}</div>`;
                });
                statusMessage += `</div>`;
            }

            statusMessage += `
                        <div class="completion-actions">
                            <button class="btn-primary" onclick="window.sudokuEngine.showStats()">View Stats</button>
                            <button class="btn-secondary" onclick="window.sudokuEngine.startNewGame()">New Game</button>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('gameStatus').innerHTML = statusMessage;
            this.saveCompletedGame(score);
        }
    }

    calculateCurrentScore() {
        if (!this.gameStarted) return 0;

        // Use existing scoring formula with hint penalty
        const adjustedTime = this.timer + (this.errors * 30) + (this.hints * 15);
        const adjustedMinutes = adjustedTime / 60;
        const multipliers = { easy: 1, medium: 1.5, hard: 2 };

        if (adjustedMinutes === 0) return 0;

        let score = (1000 / adjustedMinutes) * multipliers[this.currentDifficulty];

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

    startTimer() {
        // Prevent multiple timers by checking if already running
        if (this.timerInterval) {
            console.warn('Timer already running, stopping existing timer first');
            this.stopTimer();
        }

        // Only start timer if game is active and not completed
        if (!this.gameStarted || this.gameCompleted || this.gamePaused) {
            console.log('Not starting timer - game not active or completed/paused');
            return;
        }

        console.log('Starting timer');
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
            console.log('Stopping timer');
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    handleKeyInput(e) {
        if (!this.gameStarted || this.gameCompleted) return;

        // Number keys
        if (e.key >= '1' && e.key <= '9') {
            e.preventDefault();
            this.inputNumber(parseInt(e.key));
        }

        // Delete/Backspace
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            this.inputNumber(0);
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
            this.getHint();
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
            candidates: this.candidates.map(row => row.map(cell => Array.from(cell))),
            timer: this.timer,
            hints: this.hints,
            errors: this.errors,
            difficulty: this.currentDifficulty,
            gameStarted: this.gameStarted,
            gameCompleted: this.gameCompleted,
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

        // Don't load saved state if user explicitly selected a difficulty
        if (this.explicitlySelectedDifficulty) {
            console.log('Skipping loadGameState because user explicitly selected difficulty');
            return;
        }

        try {
            // Try to load from server first
            const response = await fetch(`/api/puzzles?player=${currentPlayer}&date=${this.getTodayDateString()}&difficulty=${this.currentDifficulty}`);

            let gameState = null;

            if (response.ok) {
                const serverState = await response.json();
                if (serverState) {
                    gameState = serverState;
                    console.log('Loaded game state from server');
                }
            }

            // Fallback to localStorage if server fails
            if (!gameState) {
                const key = `sudoku_${currentPlayer}_${this.getTodayDateString()}_${this.currentDifficulty}`;
                const savedState = localStorage.getItem(key);
                if (savedState) {
                    gameState = JSON.parse(savedState);
                    console.log('Loaded game state from localStorage');
                }
            }

            if (gameState) {
                this.playerGrid = gameState.playerGrid || this.playerGrid;
                this.candidates = gameState.candidates ?
                    gameState.candidates.map(row => row.map(cell => new Set(cell))) :
                    this.candidates;
                this.timer = gameState.timer || 0;
                this.hints = gameState.hints || 0;
                this.errors = gameState.errors || 0;
                this.gameStarted = gameState.gameStarted || false;
                this.gameCompleted = gameState.gameCompleted || false;
                this.candidateMode = gameState.candidateMode || false;
                this.showAllCandidates = gameState.showAllCandidates || false;
                this.selectedCell = gameState.selectedCell;

                if (this.gameCompleted) {
                    // Keep completed state - don't start timer
                    document.getElementById('gameStatus').innerHTML =
                        '<div class="status-message success">Puzzle completed! Well done!</div>';
                } else if (this.gameStarted && !this.gamePaused) {
                    // Only start timer if not already running
                    if (!this.timerInterval) {
                        this.startTimer();
                    }
                }

                this.updateDisplay();
                this.updateCandidateModeUI();
                this.updateShowAllCandidatesUI();

                if (!this.gameCompleted) {
                    document.getElementById('gameStatus').innerHTML =
                        '<div class="status-message">Game state restored!</div>';
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

            // Store in localStorage for immediate access
            const key = `completed_${currentPlayer}_${this.getTodayDateString()}_${this.currentDifficulty}`;
            localStorage.setItem(key, JSON.stringify(completedGame));

            // Integrate with existing analytics system
            await this.integrateWithAnalytics(completedGame);

            console.log('Game completed and integrated with analytics:', completedGame);

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
                console.log('Successfully integrated with existing analytics system');

                // Trigger dashboard update if we're on main app
                if (window.sudokuApp) {
                    await window.sudokuApp.loadData();
                    window.sudokuApp.updateDashboard();
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

        console.log('Notified opponent of progress:', notification);
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

    eraseSelectedCell() {
        if (this.selectedCell) {
            this.inputNumber(0);
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
                            Highlight mistakes automatically
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="showTimer" ${this.showTimer !== false ? 'checked' : ''}>
                            Show timer
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="autoSave" ${this.autoSave !== false ? 'checked' : ''}>
                            Auto-save progress
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
        this.autoSave = document.getElementById('autoSave').checked;
        this.soundLevel = document.getElementById('soundLevel').value;

        // Save to localStorage
        const settings = {
            autoCheckErrors: this.autoCheckErrors,
            showTimer: this.showTimer,
            autoSave: this.autoSave,
            soundLevel: this.soundLevel
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
            this.autoSave = parsed.autoSave !== false;
            this.soundLevel = parsed.soundLevel || 'medium';
        }
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
                    [5,3,4,6,7,8,0,1,2],
                    [6,7,2,1,9,5,3,4,8],
                    [1,9,8,3,4,2,5,6,7],
                    [8,5,9,7,6,1,4,2,3],
                    [4,2,6,8,5,3,7,9,1],
                    [7,1,3,9,2,4,8,5,6],
                    [9,6,1,5,3,7,2,8,4],
                    [2,8,7,4,1,9,6,3,5],
                    [3,4,5,2,8,6,1,7,0]
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
        const { row, col, previousValue, previousCandidates } = lastMove;

        // Restore previous state
        this.playerGrid[row][col] = previousValue;
        this.candidates[row][col] = new Set(previousCandidates);

        // Update all candidates if in show all mode
        if (this.showAllCandidates) {
            this.updateAllCandidates();
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
                playTone(800, 0.1);
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
        document.querySelectorAll('.stats-modal, .completion-modal').forEach(modal => modal.remove());
        document.getElementById('gameStatus').innerHTML = '';

        // Navigate back to dashboard
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.page');

        navLinks.forEach(l => l.classList.remove('active'));
        document.querySelector('[data-page="dashboard"]').classList.add('active');

        pages.forEach(page => page.classList.remove('active'));
        document.getElementById('dashboard').classList.add('active');
    }

    destroy() {
        console.log('Destroying SudokuEngine instance');
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
}

// Global Sudoku instance
window.sudokuEngine = null;

// Initialize Sudoku when page is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the sudoku page
    if (document.getElementById('sudoku')) {
        const initSudoku = async () => {
            console.log('Initializing Sudoku');
            if (window.sudokuEngine) {
                console.log('Destroying existing SudokuEngine');
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
                            console.log('Sudoku already initializing, skipping');
                            return;
                        }
                        window.sudokuInitializing = true;
                        setTimeout(async () => {
                            await initSudoku();
                            window.sudokuInitializing = false;
                        }, 100); // Small delay to ensure DOM is ready
                    } else if (window.sudokuEngine) {
                        console.log('Sudoku page no longer active, destroying engine');
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