class SudokuEngine {
    constructor() {
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.initialGrid = Array(9).fill().map(() => Array(9).fill(0));
        this.playerGrid = Array(9).fill().map(() => Array(9).fill(0));
        this.candidates = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
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
    }

    // Initialize Sudoku UI and game
    init() {
        this.createSudokuInterface();
        this.loadDailyPuzzles();
        this.setupEventListeners();
        this.loadGameState();
    }

    createSudokuInterface() {
        const sudokuContainer = document.querySelector('.sudoku-game-container');
        if (!sudokuContainer) return;

        // Replace placeholder with actual game interface
        sudokuContainer.innerHTML = `
            <div class="sudoku-game">
                <!-- Difficulty Selection -->
                <div class="difficulty-selector">
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

                <!-- Game Info Panel -->
                <div class="game-info-panel">
                    <div class="timer-section">
                        <i class="fas fa-clock"></i>
                        <span class="timer-display" id="timerDisplay">0:00</span>
                    </div>
                    <div class="stats-section">
                        <div class="stat-item">
                            <i class="fas fa-lightbulb"></i>
                            <span class="hints-count" id="hintsCount">0</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span class="errors-count" id="errorsCount">0</span>
                        </div>
                    </div>
                    <div class="score-section" id="scoreSection" style="display: none;">
                        <div class="current-score">
                            Score: <span id="currentScore">0</span>
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
                        <button class="action-btn hint-btn" id="hintBtn">
                            <i class="fas fa-lightbulb"></i>
                            <span>Hint</span>
                        </button>
                        <button class="action-btn undo-btn" id="undoBtn">
                            <i class="fas fa-undo"></i>
                            <span>Undo</span>
                        </button>
                        <button class="action-btn candidate-btn" id="candidateBtn">
                            <i class="fas fa-pencil-alt"></i>
                            <span>Notes</span>
                        </button>
                        <button class="action-btn toggle-candidates-btn" id="toggleCandidatesBtn">
                            <i class="fas fa-eye"></i>
                            <span>Show All</span>
                        </button>
                        <button class="action-btn pause-btn" id="pauseBtn">
                            <i class="fas fa-pause"></i>
                            <span>Pause</span>
                        </button>
                        <button class="action-btn save-btn" id="saveBtn">
                            <i class="fas fa-save"></i>
                            <span>Save</span>
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
        document.getElementById('candidateBtn')?.addEventListener('click', () => this.toggleCandidateMode());
        document.getElementById('toggleCandidatesBtn')?.addEventListener('click', () => this.toggleAllCandidates());
        document.getElementById('pauseBtn')?.addEventListener('click', () => this.togglePause());
        document.getElementById('saveBtn')?.addEventListener('click', () => this.saveGame());

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
            // Load daily puzzles from server API
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
        this.selectedCell = null;

        // Clear any previous candidates
        this.candidates = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));

        // Generate candidates if in show all mode (medium/hard)
        if (this.showAllCandidates) {
            this.generateAllCandidates();
        }

        this.updateDisplay();
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
                cell.classList.remove('given', 'user-input', 'error', 'selected', 'highlighted');

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
            }
        }

        // Update stats display
        document.getElementById('timerDisplay').textContent = this.formatTime(this.timer);
        document.getElementById('hintsCount').textContent = this.hints;
        document.getElementById('errorsCount').textContent = this.errors;
        document.getElementById('currentScore').textContent = this.calculateCurrentScore();
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
                } else {
                    this.candidates[row][col].add(number);
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

        this.updateDisplay();
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
                // Keep only user-entered candidates
                this.clearGeneratedCandidates();
            }
        }

        this.updateDisplay();
    }

    generateAllCandidates() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.playerGrid[row][col] === 0) {
                    // Add all valid numbers as candidates
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValidMove(this.playerGrid, row, col, num)) {
                            this.candidates[row][col].add(num);
                        }
                    }
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

        if (this.gamePaused) {
            this.stopTimer();
            pauseBtn.querySelector('span').textContent = 'Resume';
            pauseBtn.querySelector('i').className = 'fas fa-play';
            document.getElementById('gameStatus').innerHTML =
                '<div class="status-message">Game paused. Click Resume to continue.</div>';
        } else {
            this.startTimer();
            pauseBtn.querySelector('span').textContent = 'Pause';
            pauseBtn.querySelector('i').className = 'fas fa-pause';
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

            // Show hint explanation
            document.getElementById('gameStatus').innerHTML =
                `<div class="status-message hint">Hint: ${technique} - Cell R${row + 1}C${col + 1} = ${value}</div>`;

            this.checkCompletion();
        } else {
            document.getElementById('gameStatus').innerHTML =
                '<div class="status-message">No hints available right now.</div>';
        }
    }

    findBestHint() {
        // Deterministic hint finding - always returns same hint for same board state
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.playerGrid[row][col] === 0) {
                    // Find cells that can be solved with naked singles
                    const possibleValues = this.getPossibleValues(row, col);
                    if (possibleValues.length === 1) {
                        return {
                            row,
                            col,
                            value: possibleValues[0],
                            technique: 'Naked single'
                        };
                    }
                }
            }
        }

        // If no naked singles, find hidden singles
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.playerGrid[row][col] === 0) {
                    const possibleValues = this.getPossibleValues(row, col);
                    for (let value of possibleValues) {
                        if (this.isHiddenSingle(row, col, value)) {
                            return {
                                row,
                                col,
                                value,
                                technique: 'Hidden single'
                            };
                        }
                    }
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
        if (canPlaceInRow === 1) return true;

        // Check column
        let canPlaceInCol = 0;
        for (let r = 0; r < 9; r++) {
            if (this.playerGrid[r][col] === 0 && this.isValidMove(this.playerGrid, r, col, value)) {
                canPlaceInCol++;
            }
        }
        if (canPlaceInCol === 1) return true;

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
        if (canPlaceInBox === 1) return true;

        return false;
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

            const score = this.calculateFinalScore();

            // Check for theme-specific achievements
            const themeAchievements = this.checkThemeAchievements();

            let statusMessage = `
                <div class="status-message success">
                    Congratulations! Puzzle completed!<br>
                    Final Score: ${score}
            `;

            // Add theme multiplier info if active
            if (window.themeManager) {
                const themeInfo = window.themeManager.getThemeInfo();
                if (themeInfo && themeInfo.multiplier > 1) {
                    statusMessage += `<br><span class="theme-bonus">🎨 ${themeInfo.name} Bonus: ×${themeInfo.multiplier}</span>`;
                }
            }

            statusMessage += `<br>Time: ${this.formatTime(this.timer)} | Hints: ${this.hints} | Errors: ${this.errors}`;

            // Add achievement notifications
            if (themeAchievements.length > 0) {
                statusMessage += `<br><div class="achievements-unlocked">`;
                themeAchievements.forEach(achievement => {
                    statusMessage += `<div class="achievement-unlock">🏆 ${achievement.name}</div>`;
                });
                statusMessage += `</div>`;
            }

            statusMessage += `</div>`;

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
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.timer++;
            document.getElementById('timerDisplay').textContent = this.formatTime(this.timer);
            document.getElementById('currentScore').textContent = this.calculateCurrentScore();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
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
                } else if (this.gameStarted) {
                    this.startTimer();
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

    destroy() {
        // Cleanup when switching pages
        this.stopTimer();
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
}

// Global Sudoku instance
window.sudokuEngine = null;

// Initialize Sudoku when page is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the sudoku page
    if (document.getElementById('sudoku')) {
        const initSudoku = () => {
            if (window.sudokuEngine) {
                window.sudokuEngine.destroy();
            }
            window.sudokuEngine = new SudokuEngine();
            window.sudokuEngine.init();
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
                        setTimeout(initSudoku, 100); // Small delay to ensure DOM is ready
                    } else if (window.sudokuEngine) {
                        window.sudokuEngine.destroy();
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