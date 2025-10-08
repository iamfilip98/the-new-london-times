require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_PRISMA_URL,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  },
  max: 2,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 10000,
  maxUses: 100,
  acquireTimeoutMillis: 5000
});

// Helper function for SQL queries
async function sql(strings, ...values) {
  let query = '';
  const params = [];
  let paramIndex = 1;

  for (let i = 0; i < strings.length; i++) {
    query += strings[i];
    if (i < values.length) {
      query += `$${paramIndex}`;
      params.push(values[i]);
      paramIndex++;
    }
  }

  const result = await pool.query(query, params);
  return { rows: result.rows };
}

// Initialize database tables for daily puzzles
async function initPuzzleDatabase() {
  try {
    // Create daily_puzzles table
    await sql`
      CREATE TABLE IF NOT EXISTS daily_puzzles (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        easy_puzzle TEXT NOT NULL,
        medium_puzzle TEXT NOT NULL,
        hard_puzzle TEXT NOT NULL,
        easy_solution TEXT NOT NULL,
        medium_solution TEXT NOT NULL,
        hard_solution TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create game_states table for individual player progress
    await sql`
      CREATE TABLE IF NOT EXISTS game_states (
        id SERIAL PRIMARY KEY,
        player VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        difficulty VARCHAR(10) NOT NULL,
        current_state TEXT,
        timer_seconds INTEGER DEFAULT 0,
        hints_used INTEGER DEFAULT 0,
        errors_made INTEGER DEFAULT 0,
        completed_at TIMESTAMP NULL,
        last_updated TIMESTAMP DEFAULT NOW(),
        UNIQUE(player, date, difficulty)
      )
    `;

    return true;
  } catch (error) {
    console.error('Failed to initialize puzzle database:', error);
    throw error;
  }
}

// Generate a complete valid Sudoku solution
function generateCompleteSolution(seed) {
  const grid = Array(9).fill().map(() => Array(9).fill(0));

  // Seeded random number generator for deterministic puzzle generation
  let seedValue = seed || Date.now();
  function seededRandom() {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  }

  function isValid(grid, row, col, num) {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }

    // Check 3x3 box
    const startRow = row - row % 3;
    const startCol = col - col % 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[i + startRow][j + startCol] === num) return false;
      }
    }

    return true;
  }

  function solve(grid) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

          // Shuffle using seeded random for deterministic results
          for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
          }

          for (let num of numbers) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num;

              if (solve(grid)) {
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

  solve(grid);
  return grid;
}

// Technique scoring constants for difficulty calculation
// Simplified scoring: Singles=1pt, Pairs=3pt, Triples=5pt, Quads=8pt
const TECHNIQUE_COSTS = {
  nakedSingle: { first: 1, subsequent: 1 },
  hiddenSingle: { first: 1, subsequent: 1 },
  nakedPair: { first: 3, subsequent: 3 },
  hiddenPair: { first: 3, subsequent: 3 },
  nakedTriple: { first: 5, subsequent: 5 },
  hiddenTriple: { first: 5, subsequent: 5 },
  nakedQuad: { first: 8, subsequent: 8 },
  hiddenQuad: { first: 8, subsequent: 8 },
  pointingPair: { first: 2, subsequent: 2 },
  boxLineReduction: { first: 2, subsequent: 2 },
  xWing: { first: 10, subsequent: 10 },
  yWing: { first: 12, subsequent: 12 },
  xyzWing: { first: 15, subsequent: 15 },
  swordfish: { first: 20, subsequent: 20 },
  simpleColoring: { first: 18, subsequent: 18 }
};

const ADVANCED_TECHNIQUES = new Set(['xWing', 'yWing', 'xyzWing', 'swordfish', 'simpleColoring']);

// Enhanced complexity scoring that accounts for pattern obscurity and cognitive load
function calculateEnhancedComplexityScore(puzzle, solverResult, settings) {
  let score = 0;
  const techniques = solverResult.techniqueUsage || {};

  // Core technique scoring with higher weights for hidden techniques
  score += (techniques.nakedSingle || 0) * 1;
  score += (techniques.hiddenSingle || 0) * 2;  // Hidden slightly harder than naked
  score += (techniques.nakedPair || 0) * 4;
  score += (techniques.hiddenPair || 0) * 6;  // Hidden pairs significantly harder
  score += (techniques.nakedTriple || 0) * 8;
  score += (techniques.hiddenTriple || 0) * 12;  // Hidden triples much harder
  score += (techniques.nakedQuad || 0) * 12;
  score += (techniques.hiddenQuad || 0) * 18;  // Hidden quads very challenging
  score += (techniques.pointingPair || 0) * 3;
  score += (techniques.boxLineReduction || 0) * 3;

  // Penalize early naked singles heavily (makes puzzle too easy)
  let earlyNakedSingles = 0;
  const firstMovesCount = settings.firstMovesCount || 5;
  if (solverResult.solvePath && solverResult.solvePath.length > 0) {
    for (let i = 0; i < Math.min(firstMovesCount, solverResult.solvePath.length); i++) {
      if (solverResult.solvePath[i] === 'nakedSingle') {
        earlyNakedSingles++;
      }
    }
  }
  const maxEarlyNS = settings.maxNakedSinglesInFirstMoves || 3;
  if (earlyNakedSingles > maxEarlyNS) {
    score -= (earlyNakedSingles - maxEarlyNS) * 15;  // Heavy penalty
  }

  // Reward high candidate density (more cognitive load)
  const clueCount = puzzle.flat().filter(cell => cell !== 0).length;
  score += (81 - clueCount) * 1.5;

  // Reward low entry points (fewer obvious starting moves)
  const entryPoints = solverResult.entryPoints || 0;
  if (entryPoints < 3) {
    score += (3 - entryPoints) * 10;
  } else if (entryPoints > 5) {
    score -= (entryPoints - 5) * 8;  // Penalty for too many entry points
  }

  // Reward average dependency score (pattern depth)
  const avgDependency = solverResult.averageDependencyScore || 0;
  if (avgDependency >= settings.minDependencyScore && avgDependency <= settings.maxDependencyScore) {
    score += avgDependency * 5;
  }

  // Detect combination patterns (multiple techniques in same region)
  // This would require deeper analysis, use approximation
  const totalAdvancedTechniques = (techniques.hiddenPair || 0) + (techniques.hiddenTriple || 0) +
                                  (techniques.hiddenQuad || 0) + (techniques.nakedTriple || 0) + (techniques.nakedQuad || 0);
  if (totalAdvancedTechniques >= 4) {
    score += 20;  // Bonus for multiple complex patterns
  }

  // Reward puzzles with starved boxes (creates pattern obscurity)
  if (settings.starveBoxes) {
    const boxClueCounts = getBoxClueCounts(puzzle);
    let starvedBoxCount = 0;
    for (const count of boxClueCounts) {
      if (count <= (settings.maxCluesPerStarvedBox || 2)) {
        starvedBoxCount++;
      }
    }
    if (starvedBoxCount >= (settings.minStarvedBoxes || 2)) {
      score += starvedBoxCount * 8;
    }
  }

  return Math.round(score);
}

// Helper function to count clues per box
function getBoxClueCounts(puzzle) {
  const boxCounts = Array(9).fill(0);
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (puzzle[row][col] !== 0) {
        const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
        boxCounts[boxIndex]++;
      }
    }
  }
  return boxCounts;
}

// Strategic clue removal - prioritize cells that create pattern obscurity
function getStrategicRemovalOrder(solution, seed, settings) {
  const positions = [];

  // Seeded random for determinism
  let seedValue = seed || Date.now();
  function seededRandom() {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  }

  // Get box clue counts to identify which boxes to starve
  const boxClueCounts = getBoxClueCounts(solution);
  const boxPriority = [];
  for (let i = 0; i < 9; i++) {
    boxPriority.push({ boxIndex: i, priority: seededRandom() });
  }
  boxPriority.sort((a, b) => a.priority - b.priority);

  // Identify boxes to starve (lowest priority boxes)
  const starveBoxCount = settings.minStarvedBoxes || 2;
  const boxesToStarve = new Set(boxPriority.slice(0, starveBoxCount).map(b => b.boxIndex));

  // Create position list with priorities
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      let priority = 0;

      // High priority: cells in boxes we want to starve
      if (boxesToStarve.has(boxIndex)) {
        priority += 100;
      }

      // Medium priority: cells at row/col/box intersections (create more candidates)
      const rowClues = solution[row].filter(c => c !== 0).length;
      const colClues = solution.map(r => r[col]).filter(c => c !== 0).length;
      if (rowClues <= 4 || colClues <= 4) {
        priority += 50;
      }

      // Add randomness for variation
      priority += seededRandom() * 20;

      positions.push({ row, col, priority });
    }
  }

  // Sort by priority (highest first)
  positions.sort((a, b) => b.priority - a.priority);

  return positions.map(p => [p.row, p.col]);
}

// Generate puzzle from solution by removing numbers with solvability validation
function generatePuzzle(solution, difficulty, seed) {
  const puzzle = solution.map(row => [...row]);

  // Seeded random number generator for deterministic puzzle generation
  let seedValue = seed || Date.now();
  function seededRandom() {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  }

  // Rigorous difficulty settings - all puzzles must be solvable with logical techniques only
  const difficultySettings = {
    easy: {
      minClues: 35,
      maxClues: 39,
      requireNakedSingles: true,
      allowHiddenSingles: true,
      allowComplexTechniques: false,
      maxIterations: 100,
      requireEvenDistribution: true,
      maxEmptyRegions: 2,
      minEntryPoints: 4,
      targetDifficultyScore: [30, 60],  // Adjusted for new scoring (mostly singles)
      maxConsecutiveAdvanced: 0
    },
    medium: {
      minClues: 23,
      maxClues: 26,
      requireNakedSingles: false,
      allowHiddenSingles: true,
      allowComplexTechniques: true,
      maxIterations: 500,  // More iterations to find better puzzles
      requireEvenDistribution: false,
      maxEmptyRegions: 5,
      allowAdvancedTechniques: false,
      requireHiddenSubsets: true,
      minHiddenSubsets: 3,  // Increased from 2 - require more hidden techniques
      maxHiddenSubsets: 6,
      requireNakedSubsets: true,
      minNakedSubsets: 2,
      maxNakedSubsets: 5,
      minEntryPoints: 1,  // Reduced - fewer obvious starting points
      targetDifficultyScore: [50, 80],  // Much higher score requirement
      maxConsecutiveAdvanced: 0,
      minDependencyScore: 4,  // Higher candidate density
      maxDependencyScore: 7,
      maxNakedSinglesInFirstMoves: 2,  // Limit early naked singles
      firstMovesCount: 5,
      requireCombinationPatterns: true,
      minCombinationPatterns: 1,
      starveBoxes: true,
      minStarvedBoxes: 2,
      maxCluesPerStarvedBox: 2,
      useStrategicRemoval: true,
      candidateCount: 10  // Generate multiple candidates
    },
    hard: {
      minClues: 19,
      maxClues: 22,
      requireNakedSingles: false,
      allowHiddenSingles: true,
      allowComplexTechniques: true,
      maxIterations: 600,  // More iterations for harder puzzles
      requireEvenDistribution: false,
      maxEmptyRegions: 7,
      allowAdvancedTechniques: false,  // Don't require X-Wing, Y-Wing etc
      requireAdvancedSolving: false,
      minAdvancedMoves: 0,
      maxAdvancedMoves: 0,
      allowXWing: false,  // Keep it solvable with known techniques only
      allowSwordfish: false,
      allowYWing: false,
      allowXYZWing: false,
      allowChains: false,
      requireHiddenSubsets: true,
      minHiddenSubsets: 4,  // Increased - more hidden triples/quads required
      maxHiddenSubsets: 8,
      requireNakedSubsets: true,
      minNakedSubsets: 3,
      maxNakedSubsets: 7,
      requireMultipleAdvanced: false,
      minEntryPoints: 1,  // Very few entry points
      targetDifficultyScore: [80, 120],  // Much higher score requirement
      maxConsecutiveAdvanced: 0,
      minDependencyScore: 5,  // Very high candidate density
      maxDependencyScore: 8,
      maxNakedSinglesInFirstMoves: 1,  // Almost no early naked singles
      firstMovesCount: 6,
      requireCombinationPatterns: true,
      minCombinationPatterns: 2,  // Multiple overlapping patterns
      starveBoxes: true,
      minStarvedBoxes: 3,
      maxCluesPerStarvedBox: 2,
      useStrategicRemoval: true,
      candidateCount: 12,  // Generate more candidates to find best
      requireCandidateElimination: true,  // NEW: Force candidate elimination work
      minCandidateEliminationDepth: 80,  // NEW: Require significant candidate work
      requireForcedBottlenecks: true,  // NEW: Force player to get stuck
      minForcedBottlenecks: 2  // NEW: At least 2 bottlenecks where progress stops
    }
  };

  const settings = difficultySettings[difficulty];

  // Use strategic removal for medium/hard, random for easy
  const positions = settings.useStrategicRemoval
    ? getStrategicRemovalOrder(solution, seed, settings)
    : (() => {
        const pos = [];
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            pos.push([i, j]);
          }
        }
        // Shuffle for randomness
        for (let i = pos.length - 1; i > 0; i--) {
          const j = Math.floor(seededRandom() * (i + 1));
          [pos[i], pos[j]] = [pos[j], pos[i]];
        }
        return pos;
      })();

  // For medium/hard: generate multiple candidates and pick best by complexity score
  // For easy: use original approach (fewest clues)
  if (settings.candidateCount && settings.candidateCount > 1) {
    // Multi-candidate generation for medium/hard
    const candidates = [];
    const candidateIterations = settings.candidateCount;

    console.log(`🎲 Generating ${candidateIterations} ${difficulty} puzzle candidates...`);

    for (let candIdx = 0; candIdx < candidateIterations; candIdx++) {
      const testPuzzle = solution.map(row => [...row]);
      let removedCells = 0;

      // Get fresh strategic positions for this candidate (with seed variation)
      const candPositions = settings.useStrategicRemoval
        ? getStrategicRemovalOrder(solution, seed + candIdx * 100, settings)
        : positions;

      // Try to remove cells while maintaining solvability
      for (let [row, col] of candPositions) {
        if (81 - removedCells <= settings.minClues) break;

        const originalValue = testPuzzle[row][col];
        if (originalValue === 0) continue;

        // Remove the cell temporarily
        testPuzzle[row][col] = 0;

        // Check unique solution first (faster check)
        const solutionCount = countSolutions(testPuzzle);
        if (solutionCount !== 1) {
          testPuzzle[row][col] = originalValue;
          continue;
        }

        // Check if puzzle is solvable with logical techniques
        const solverResult = isPuzzleSolvableLogically(testPuzzle, settings, true);
        if (!solverResult.solvable) {
          testPuzzle[row][col] = originalValue;
          continue;
        }

        // Validate quality metrics
        const qualityCheck = validatePuzzleQuality(testPuzzle, solution, settings, solverResult);
        if (qualityCheck.isValid) {
          removedCells++;
        } else {
          testPuzzle[row][col] = originalValue;
        }
      }

      const currentClues = 81 - removedCells;

      // Only accept candidates in the target range
      if (currentClues >= settings.minClues && currentClues <= settings.maxClues) {
        const finalSolverResult = isPuzzleSolvableLogically(testPuzzle, settings, true);
        if (finalSolverResult.solvable) {
          const complexityScore = calculateEnhancedComplexityScore(testPuzzle, finalSolverResult, settings);

          candidates.push({
            puzzle: testPuzzle.map(row => [...row]),
            clues: currentClues,
            score: complexityScore,
            solverResult: finalSolverResult
          });

          console.log(`  Candidate ${candIdx + 1}: ${currentClues} clues, score ${complexityScore}`);
        }
      }
    }

    // Sort candidates by complexity score (highest first)
    candidates.sort((a, b) => b.score - a.score);

    // Select best candidate deterministically (highest scoring that meets requirements)
    if (candidates.length > 0) {
      const best = candidates[0];
      console.log(`✅ Selected best ${difficulty} puzzle: ${best.clues} clues, score ${best.score}`);
      console.log(`   ✓ Entry points: ${best.solverResult.entryPoints}`);
      console.log(`   ✓ Hidden subsets: ${(best.solverResult.techniqueUsage.hiddenPair || 0) + (best.solverResult.techniqueUsage.hiddenTriple || 0) + (best.solverResult.techniqueUsage.hiddenQuad || 0)}`);
      console.log(`   ✓ Avg dependency: ${best.solverResult.averageDependencyScore.toFixed(1)}`);

      return best.puzzle;
    } else {
      console.log(`⚠️ No valid ${difficulty} candidates found, using fallback`);
      return createFallbackPuzzle(solution, difficulty, seed);
    }
  } else {
    // Original approach for easy difficulty
    let iterations = 0;
    let bestPuzzle = null;
    let bestClueCount = 81;

    while (iterations < settings.maxIterations) {
      const testPuzzle = solution.map(row => [...row]);
      let removedCells = 0;
      const shuffledPositions = [...positions];

      // Shuffle again for this iteration
      for (let i = shuffledPositions.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [shuffledPositions[i], shuffledPositions[j]] = [shuffledPositions[j], shuffledPositions[i]];
      }

      // Try to remove cells while maintaining solvability
      for (let [row, col] of shuffledPositions) {
        if (81 - removedCells <= settings.minClues) break;

        const originalValue = testPuzzle[row][col];
        if (originalValue === 0) continue;

        // For Easy difficulty, check distribution constraints
        if (settings.requireEvenDistribution || settings.maxEmptyRegions) {
          const testPuzzleAfterRemoval = testPuzzle.map(row => [...row]);
          testPuzzleAfterRemoval[row][col] = 0;

          // Check if this removal violates distribution rules
          if (!isValidDistribution(testPuzzleAfterRemoval, settings)) {
            continue; // Skip this cell removal
          }
        }

        // Remove the cell temporarily
        testPuzzle[row][col] = 0;

        // Check unique solution first (faster check)
        const solutionCount = countSolutions(testPuzzle);
        if (solutionCount !== 1) {
          testPuzzle[row][col] = originalValue;
          continue;
        }

        // Check if puzzle is solvable with logical techniques and quality criteria
        const solverResult = isPuzzleSolvableLogically(testPuzzle, settings, true);
        if (!solverResult.solvable) {
          testPuzzle[row][col] = originalValue;
          continue;
        }

        // Validate quality metrics
        const qualityCheck = validatePuzzleQuality(testPuzzle, solution, settings, solverResult);
        if (qualityCheck.isValid) {
          removedCells++;
          const currentClues = 81 - removedCells;
          if (currentClues >= settings.minClues && currentClues <= settings.maxClues) {
            if (currentClues < bestClueCount) {
              bestPuzzle = testPuzzle.map(row => [...row]);
              bestClueCount = currentClues;

              console.log(`🎯 Found better ${difficulty} puzzle with ${currentClues} clues`);
              console.log(`   ✓ Difficulty score: ${solverResult.difficultyScore}`);
              console.log(`   ✓ Entry points: ${solverResult.entryPoints}`);
              console.log(`   ✓ Avg dependency: ${solverResult.averageDependencyScore.toFixed(1)}`);
              console.log(`   ✓ Max consecutive advanced: ${solverResult.maxConsecutiveAdvanced}`);
            }
          }
        } else {
          testPuzzle[row][col] = originalValue;
        }
      }

      iterations++;

      // If we found a good puzzle in acceptable range, we can stop early
      if (bestPuzzle && bestClueCount >= settings.minClues && bestClueCount <= settings.maxClues) {
        break;
      }
    }

    // Return best puzzle found, or fallback to a simpler approach if needed
    return bestPuzzle || createFallbackPuzzle(solution, difficulty, seed);
  }
}

// Improved fallback puzzle creation that ensures unique solutions
function createFallbackPuzzle(solution, difficulty, seed) {
  const puzzle = solution.map(row => [...row]);

  // Seeded random number generator for deterministic puzzle generation
  let seedValue = seed || Date.now();
  function seededRandom() {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  }
  const targetClues = {
    easy: 34,
    medium: 26,
    hard: 26
  };

  const positions = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      positions.push([i, j]);
    }
  }

  // Shuffle positions for randomness
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  let currentClues = 81;
  const minClues = targetClues[difficulty];
  let attempts = 0;
  const maxAttempts = difficulty === 'hard' ? 150 : 100; // More attempts for hard puzzles

  // Remove cells one by one while maintaining uniqueness
  for (let [row, col] of positions) {
    if (currentClues <= minClues || attempts >= maxAttempts) break;
    attempts++;

    // Try removing this cell
    const originalValue = puzzle[row][col];
    puzzle[row][col] = 0;

    // Check if puzzle still has unique solution
    const solutionCount = countSolutions(puzzle);

    if (solutionCount === 1) {
      // Good! We can remove this cell
      currentClues--;
    } else {
      // Bad! Restore the cell
      puzzle[row][col] = originalValue;
    }

    // For hard puzzles, be more aggressive - keep trying even if above minimum
    const buffer = difficulty === 'hard' ? 1 : 3;
    if (currentClues <= minClues + buffer && attempts >= maxAttempts / 2) break;
  }

  console.log(`🔧 Fallback puzzle created for ${difficulty} with ${currentClues} clues`);
  return puzzle;
}

// Comprehensive logical Sudoku solver - no guessing allowed
function isPuzzleSolvableLogically(puzzle, settings, returnDetails = false) {
  const testGrid = puzzle.map(row => [...row]);
  const candidates = initializeCandidates(testGrid);
  let changed = true;
  let iterations = 0;
  const maxSolverIterations = 200;

  // Legacy tracking variables
  let advancedTechniquesUsed = 0;
  let hiddenSubsetsUsed = 0;
  let nakedSubsetsUsed = 0;
  let techniquesUsed = new Set();
  let xWingUsed = 0;
  let yWingUsed = 0;
  let swordfishUsed = 0;
  let chainsUsed = 0;

  // New quality tracking variables
  let techniqueUsage = {};
  let techniqueFirstUse = new Set();
  let difficultyScore = 0;
  let consecutiveAdvanced = 0;
  let maxConsecutiveAdvancedCount = 0;
  let dependencyScores = [];
  let entryPointsFound = 0;
  let stepsWithoutProgress = 0;
  let lastTechniqueWasAdvanced = false;
  let solvePath = [];  // Track sequence of techniques used

  while (changed && iterations < maxSolverIterations) {
    changed = false;
    iterations++;

    // Update candidates first
    updateCandidates(testGrid, candidates);

    // Track dependency score
    let totalCandidates = 0;
    let emptyCellCount = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (testGrid[row][col] === 0) {
          emptyCellCount++;
          totalCandidates += candidates[row][col].length;
        }
      }
    }
    if (emptyCellCount > 0) {
      dependencyScores.push(totalCandidates / emptyCellCount);
    }

    // Track entry points on first iteration
    if (iterations === 1) {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (testGrid[row][col] === 0 && candidates[row][col].length === 1) {
            entryPointsFound++;
          }
        }
      }
    }

    // Technique 1: Naked Singles (cells with only one candidate)
    if (applyNakedSingles(testGrid, candidates)) {
      changed = true;
      techniqueUsage.nakedSingle = (techniqueUsage.nakedSingle || 0) + 1;
      solvePath.push('nakedSingle');
      if (!techniqueFirstUse.has('nakedSingle')) {
        techniqueFirstUse.add('nakedSingle');
        difficultyScore += TECHNIQUE_COSTS.nakedSingle.first;
      } else {
        difficultyScore += TECHNIQUE_COSTS.nakedSingle.subsequent;
      }
      consecutiveAdvanced = 0;
      lastTechniqueWasAdvanced = false;
      stepsWithoutProgress = 0;
      continue;
    }

    // Technique 2: Hidden Singles (numbers that can only go in one place)
    if (settings.allowHiddenSingles && applyHiddenSingles(testGrid, candidates)) {
      changed = true;
      techniqueUsage.hiddenSingle = (techniqueUsage.hiddenSingle || 0) + 1;
      solvePath.push('hiddenSingle');
      if (!techniqueFirstUse.has('hiddenSingle')) {
        techniqueFirstUse.add('hiddenSingle');
        difficultyScore += TECHNIQUE_COSTS.hiddenSingle.first;
      } else {
        difficultyScore += TECHNIQUE_COSTS.hiddenSingle.subsequent;
      }
      consecutiveAdvanced = 0;
      lastTechniqueWasAdvanced = false;
      stepsWithoutProgress = 0;
      continue;
    }

    // Technique 3: Naked Pairs, Triples, Quads
    if (settings.allowComplexTechniques && applyNakedSubsets(testGrid, candidates)) {
      changed = true;
      nakedSubsetsUsed++;
      techniquesUsed.add('naked_subsets');
      techniqueUsage.nakedPair = (techniqueUsage.nakedPair || 0) + 1;
      solvePath.push('nakedSubset');
      if (!techniqueFirstUse.has('nakedPair')) {
        techniqueFirstUse.add('nakedPair');
        difficultyScore += TECHNIQUE_COSTS.nakedPair.first;
      } else {
        difficultyScore += TECHNIQUE_COSTS.nakedPair.subsequent;
      }
      consecutiveAdvanced = 0;
      lastTechniqueWasAdvanced = false;
      stepsWithoutProgress = 0;
      continue;
    }

    // Technique 4: Hidden Pairs, Triples, Quads
    if (settings.allowComplexTechniques && applyHiddenSubsets(testGrid, candidates)) {
      changed = true;
      hiddenSubsetsUsed++;
      techniquesUsed.add('hidden_subsets');
      techniqueUsage.hiddenPair = (techniqueUsage.hiddenPair || 0) + 1;
      solvePath.push('hiddenSubset');
      if (!techniqueFirstUse.has('hiddenPair')) {
        techniqueFirstUse.add('hiddenPair');
        difficultyScore += TECHNIQUE_COSTS.hiddenPair.first;
      } else {
        difficultyScore += TECHNIQUE_COSTS.hiddenPair.subsequent;
      }
      consecutiveAdvanced = 0;
      lastTechniqueWasAdvanced = false;
      stepsWithoutProgress = 0;
      continue;
    }

    // Technique 5: Pointing Pairs/Triples (Box/Line Reduction)
    if (settings.allowComplexTechniques && applyPointingPairs(testGrid, candidates)) {
      changed = true;
      techniqueUsage.pointingPair = (techniqueUsage.pointingPair || 0) + 1;
      if (!techniqueFirstUse.has('pointingPair')) {
        techniqueFirstUse.add('pointingPair');
        difficultyScore += TECHNIQUE_COSTS.pointingPair.first;
      } else {
        difficultyScore += TECHNIQUE_COSTS.pointingPair.subsequent;
      }
      consecutiveAdvanced = 0;
      lastTechniqueWasAdvanced = false;
      stepsWithoutProgress = 0;
      continue;
    }

    // Technique 6: Box/Line Reduction
    if (settings.allowComplexTechniques && applyBoxLineReduction(testGrid, candidates)) {
      changed = true;
      techniqueUsage.boxLineReduction = (techniqueUsage.boxLineReduction || 0) + 1;
      if (!techniqueFirstUse.has('boxLineReduction')) {
        techniqueFirstUse.add('boxLineReduction');
        difficultyScore += TECHNIQUE_COSTS.boxLineReduction.first;
      } else {
        difficultyScore += TECHNIQUE_COSTS.boxLineReduction.subsequent;
      }
      consecutiveAdvanced = 0;
      lastTechniqueWasAdvanced = false;
      stepsWithoutProgress = 0;
      continue;
    }

    // Advanced Techniques (only for hard difficulty)
    if (settings.allowAdvancedTechniques) {
      // Technique 7: X-Wing
      if (settings.allowXWing && applyXWing(testGrid, candidates)) {
        changed = true;
        advancedTechniquesUsed++;
        xWingUsed++;
        techniquesUsed.add('xwing');
        techniqueUsage.xWing = (techniqueUsage.xWing || 0) + 1;
        if (!techniqueFirstUse.has('xWing')) {
          techniqueFirstUse.add('xWing');
          difficultyScore += TECHNIQUE_COSTS.xWing.first;
        } else {
          difficultyScore += TECHNIQUE_COSTS.xWing.subsequent;
        }
        if (lastTechniqueWasAdvanced) {
          consecutiveAdvanced++;
        } else {
          consecutiveAdvanced = 1;
        }
        lastTechniqueWasAdvanced = true;
        maxConsecutiveAdvancedCount = Math.max(maxConsecutiveAdvancedCount, consecutiveAdvanced);
        stepsWithoutProgress = 0;
        continue;
      }

      // Technique 8: Y-Wing
      if (settings.allowYWing && applyYWing(testGrid, candidates)) {
        changed = true;
        advancedTechniquesUsed++;
        yWingUsed++;
        techniquesUsed.add('ywing');
        techniqueUsage.yWing = (techniqueUsage.yWing || 0) + 1;
        if (!techniqueFirstUse.has('yWing')) {
          techniqueFirstUse.add('yWing');
          difficultyScore += TECHNIQUE_COSTS.yWing.first;
        } else {
          difficultyScore += TECHNIQUE_COSTS.yWing.subsequent;
        }
        if (lastTechniqueWasAdvanced) {
          consecutiveAdvanced++;
        } else {
          consecutiveAdvanced = 1;
        }
        lastTechniqueWasAdvanced = true;
        maxConsecutiveAdvancedCount = Math.max(maxConsecutiveAdvancedCount, consecutiveAdvanced);
        stepsWithoutProgress = 0;
        continue;
      }

      // Technique 9: XYZ-Wing
      if (settings.allowXYZWing && applyXYZWing(testGrid, candidates)) {
        changed = true;
        advancedTechniquesUsed++;
        techniquesUsed.add('xyzwing');
        techniqueUsage.xyzWing = (techniqueUsage.xyzWing || 0) + 1;
        if (!techniqueFirstUse.has('xyzWing')) {
          techniqueFirstUse.add('xyzWing');
          difficultyScore += TECHNIQUE_COSTS.xyzWing.first;
        } else {
          difficultyScore += TECHNIQUE_COSTS.xyzWing.subsequent;
        }
        if (lastTechniqueWasAdvanced) {
          consecutiveAdvanced++;
        } else {
          consecutiveAdvanced = 1;
        }
        lastTechniqueWasAdvanced = true;
        maxConsecutiveAdvancedCount = Math.max(maxConsecutiveAdvancedCount, consecutiveAdvanced);
        stepsWithoutProgress = 0;
        continue;
      }

      // Technique 10: Swordfish (3x3 version of X-Wing)
      if (settings.allowSwordfish && applySwordfish(testGrid, candidates)) {
        changed = true;
        advancedTechniquesUsed++;
        swordfishUsed++;
        techniquesUsed.add('swordfish');
        techniqueUsage.swordfish = (techniqueUsage.swordfish || 0) + 1;
        if (!techniqueFirstUse.has('swordfish')) {
          techniqueFirstUse.add('swordfish');
          difficultyScore += TECHNIQUE_COSTS.swordfish.first;
        } else {
          difficultyScore += TECHNIQUE_COSTS.swordfish.subsequent;
        }
        if (lastTechniqueWasAdvanced) {
          consecutiveAdvanced++;
        } else {
          consecutiveAdvanced = 1;
        }
        lastTechniqueWasAdvanced = true;
        maxConsecutiveAdvancedCount = Math.max(maxConsecutiveAdvancedCount, consecutiveAdvanced);
        stepsWithoutProgress = 0;
        continue;
      }

      // Technique 11: Simple Coloring/Chains
      if (settings.allowChains && applySimpleColoring(testGrid, candidates)) {
        changed = true;
        advancedTechniquesUsed++;
        chainsUsed++;
        techniquesUsed.add('chains');
        techniqueUsage.simpleColoring = (techniqueUsage.simpleColoring || 0) + 1;
        if (!techniqueFirstUse.has('simpleColoring')) {
          techniqueFirstUse.add('simpleColoring');
          difficultyScore += TECHNIQUE_COSTS.simpleColoring.first;
        } else {
          difficultyScore += TECHNIQUE_COSTS.simpleColoring.subsequent;
        }
        if (lastTechniqueWasAdvanced) {
          consecutiveAdvanced++;
        } else {
          consecutiveAdvanced = 1;
        }
        lastTechniqueWasAdvanced = true;
        maxConsecutiveAdvancedCount = Math.max(maxConsecutiveAdvancedCount, consecutiveAdvanced);
        stepsWithoutProgress = 0;
        continue;
      }
    }

    // If we reach here, no technique worked
    stepsWithoutProgress++;

    // Check if puzzle is completely solved
    let emptyCells = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (testGrid[row][col] === 0) emptyCells++;
      }
    }

    if (emptyCells === 0) {
      // Check if hard puzzles require advanced techniques
      let meetsAllRequirements = true;

      if (settings.requireAdvancedSolving && settings.minAdvancedMoves) {
        if (advancedTechniquesUsed < settings.minAdvancedMoves) {
          meetsAllRequirements = false;
        }
      }

      // Check max advanced moves
      if (settings.maxAdvancedMoves && advancedTechniquesUsed > settings.maxAdvancedMoves) {
        meetsAllRequirements = false;
      }

      // Check if puzzles require hidden subsets (min and max)
      if (settings.requireHiddenSubsets && settings.minHiddenSubsets) {
        if (hiddenSubsetsUsed < settings.minHiddenSubsets) {
          meetsAllRequirements = false;
        }
      }
      if (settings.maxHiddenSubsets) {
        if (hiddenSubsetsUsed > settings.maxHiddenSubsets) {
          meetsAllRequirements = false;
        }
      }

      // Check if puzzles require naked subsets (min and max)
      if (settings.requireNakedSubsets && settings.minNakedSubsets) {
        if (nakedSubsetsUsed < settings.minNakedSubsets) {
          meetsAllRequirements = false;
        }
      }
      if (settings.maxNakedSubsets) {
        if (nakedSubsetsUsed > settings.maxNakedSubsets) {
          meetsAllRequirements = false;
        }
      }

      // Check if hard puzzles require multiple advanced techniques
      if (settings.requireMultipleAdvanced && settings.minTechniqueVariety) {
        const advancedTechniques = ['xwing', 'ywing', 'xyzwing', 'swordfish', 'chains'];
        const usedAdvanced = advancedTechniques.filter(tech => techniquesUsed.has(tech));
        if (usedAdvanced.length < settings.minTechniqueVariety) {
          meetsAllRequirements = false;
        }
      }

      // Return enhanced result if details requested
      if (returnDetails) {
        return {
          solvable: meetsAllRequirements,
          difficultyScore: difficultyScore,
          techniqueUsage: techniqueUsage,
          maxConsecutiveAdvanced: maxConsecutiveAdvancedCount,
          averageDependencyScore: dependencyScores.length > 0 ?
            dependencyScores.reduce((a, b) => a + b, 0) / dependencyScores.length : 0,
          entryPoints: entryPointsFound,
          requiresGuessing: false,
          solvePath: solvePath
        };
      }

      return meetsAllRequirements;
    }

    // Check for invalid state (cell with no candidates)
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (testGrid[row][col] === 0 && candidates[row][col].length === 0) {
          if (returnDetails) {
            return {
              solvable: false,
              difficultyScore: difficultyScore,
              techniqueUsage: techniqueUsage,
              maxConsecutiveAdvanced: maxConsecutiveAdvancedCount,
              averageDependencyScore: dependencyScores.length > 0 ?
                dependencyScores.reduce((a, b) => a + b, 0) / dependencyScores.length : 0,
              entryPoints: entryPointsFound,
              requiresGuessing: true,
              solvePath: solvePath
            };
          }
          return false;
        }
      }
    }
  }

  // If we stopped making progress, puzzle requires guessing
  if (returnDetails) {
    return {
      solvable: false,
      difficultyScore: difficultyScore,
      techniqueUsage: techniqueUsage,
      maxConsecutiveAdvanced: maxConsecutiveAdvancedCount,
      averageDependencyScore: dependencyScores.length > 0 ?
        dependencyScores.reduce((a, b) => a + b, 0) / dependencyScores.length : 0,
      entryPoints: entryPointsFound,
      requiresGuessing: stepsWithoutProgress > 5,
      solvePath: solvePath
    };
  }
  return false;
}

// Helper functions for solvability checking
function getPossibleValues(grid, row, col) {
  const possible = [];
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(grid, row, col, num)) {
      possible.push(num);
    }
  }
  return possible;
}

function isValidPlacement(grid, row, col, num) {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === num) return false;
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === num) return false;
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (r !== row && c !== col && grid[r][c] === num) return false;
    }
  }

  return true;
}

function isNumberInRow(grid, row, num) {
  for (let col = 0; col < 9; col++) {
    if (grid[row][col] === num) return true;
  }
  return false;
}

function isNumberInColumn(grid, col, num) {
  for (let row = 0; row < 9; row++) {
    if (grid[row][col] === num) return true;
  }
  return false;
}

function isNumberInBox(grid, startRow, startCol, num) {
  const boxRow = Math.floor(startRow / 3) * 3;
  const boxCol = Math.floor(startCol / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] === num) return true;
    }
  }
  return false;
}

// Helper function to count clues in a 3x3 region
function countRegionClues(grid, row, col) {
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

// Helper function to validate clue distribution for better placement
function isValidDistribution(grid, settings) {
  if (!settings.requireEvenDistribution && !settings.maxEmptyRegions) {
    return true;
  }

  // Count clues in each 3x3 region
  const regionCounts = [];
  let emptyRegions = 0;

  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const count = countRegionClues(grid, boxRow * 3, boxCol * 3);
      regionCounts.push(count);

      if (count === 0) {
        emptyRegions++;
      }
    }
  }

  // Check empty regions constraint
  if (settings.maxEmptyRegions && emptyRegions > settings.maxEmptyRegions) {
    return false;
  }

  // For easy puzzles, ensure more even distribution
  if (settings.requireEvenDistribution) {
    const minCluesPerRegion = Math.floor(settings.minClues / 9);
    const maxCluesPerRegion = Math.ceil(settings.maxClues / 9) + 2; // Allow some flexibility

    // Each region should have at least minCluesPerRegion clues (unless empty)
    // and not exceed maxCluesPerRegion
    for (let count of regionCounts) {
      if (count > 0 && count < minCluesPerRegion) {
        return false; // Region has too few clues
      }
      if (count > maxCluesPerRegion) {
        return false; // Region has too many clues
      }
    }

    // Check that clues aren't all bunched in just a few regions
    const occupiedRegions = regionCounts.filter(count => count > 0).length;
    if (occupiedRegions < 6) { // Require at least 6 of 9 regions to have clues
      return false;
    }
  }

  return true;
}

// ========= COMPREHENSIVE LOGICAL SOLVING TECHNIQUES =========

// Initialize candidate arrays for all empty cells
function initializeCandidates(grid) {
  const candidates = Array(9).fill().map(() => Array(9).fill().map(() => []));

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        candidates[row][col] = getPossibleValues(grid, row, col);
      }
    }
  }

  return candidates;
}

// Update all candidate lists based on current grid state
function updateCandidates(grid, candidates) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        candidates[row][col] = getPossibleValues(grid, row, col);
      } else {
        candidates[row][col] = [];
      }
    }
  }
}

// Technique 1: Naked Singles - cells with only one candidate
function applyNakedSingles(grid, candidates) {
  let changed = false;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0 && candidates[row][col].length === 1) {
        grid[row][col] = candidates[row][col][0];
        candidates[row][col] = [];
        changed = true;
      }
    }
  }

  return changed;
}

// Technique 2: Hidden Singles - numbers that can only go in one place in a unit
function applyHiddenSingles(grid, candidates) {
  let changed = false;

  // Check rows
  for (let row = 0; row < 9; row++) {
    for (let num = 1; num <= 9; num++) {
      if (!isNumberInRow(grid, row, num)) {
        const possibleCols = [];
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            possibleCols.push(col);
          }
        }
        if (possibleCols.length === 1) {
          const col = possibleCols[0];
          grid[row][col] = num;
          candidates[row][col] = [];
          changed = true;
        }
      }
    }
  }

  // Check columns
  for (let col = 0; col < 9; col++) {
    for (let num = 1; num <= 9; num++) {
      if (!isNumberInColumn(grid, col, num)) {
        const possibleRows = [];
        for (let row = 0; row < 9; row++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            possibleRows.push(row);
          }
        }
        if (possibleRows.length === 1) {
          const row = possibleRows[0];
          grid[row][col] = num;
          candidates[row][col] = [];
          changed = true;
        }
      }
    }
  }

  // Check boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      for (let num = 1; num <= 9; num++) {
        if (!isNumberInBox(grid, boxRow * 3, boxCol * 3, num)) {
          const possiblePositions = [];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const row = boxRow * 3 + r;
              const col = boxCol * 3 + c;
              if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
                possiblePositions.push([row, col]);
              }
            }
          }
          if (possiblePositions.length === 1) {
            const [row, col] = possiblePositions[0];
            grid[row][col] = num;
            candidates[row][col] = [];
            changed = true;
          }
        }
      }
    }
  }

  return changed;
}

// Technique 3: Naked Pairs/Triples/Quads - eliminate candidates from peers
function applyNakedSubsets(grid, candidates) {
  let changed = false;

  // Check for naked pairs, triples, and quads in rows
  for (let row = 0; row < 9; row++) {
    if (applyNakedSubsetsInRow(grid, candidates, row)) changed = true;
  }

  // Check for naked pairs, triples, and quads in columns
  for (let col = 0; col < 9; col++) {
    if (applyNakedSubsetsInColumn(grid, candidates, col)) changed = true;
  }

  // Check for naked pairs, triples, and quads in boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      if (applyNakedSubsetsInBox(grid, candidates, boxRow, boxCol)) changed = true;
    }
  }

  return changed;
}

// Apply naked subsets in a row
function applyNakedSubsetsInRow(grid, candidates, row) {
  let changed = false;
  const cells = [];

  for (let col = 0; col < 9; col++) {
    if (grid[row][col] === 0 && candidates[row][col].length > 0 && candidates[row][col].length <= 4) {
      cells.push({ row, col, candidates: [...candidates[row][col]] });
    }
  }

  // Look for naked pairs, triples, and quads
  for (let subsetSize = 2; subsetSize <= 4; subsetSize++) {
    // Get all combinations of cells of size subsetSize
    const combinations = getCombinations(cells, subsetSize);

    for (const combo of combinations) {
      // Get union of all candidates in this combination
      const unionCandidates = [...new Set(combo.flatMap(cell => cell.candidates))];

      // If union has exactly subsetSize candidates, it's a naked subset
      if (unionCandidates.length === subsetSize) {
        // Remove these candidates from other cells in the row
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0 && !combo.some(c => c.col === col)) {
            const oldLength = candidates[row][col].length;
            candidates[row][col] = candidates[row][col].filter(num =>
              !unionCandidates.includes(num));
            if (candidates[row][col].length < oldLength) changed = true;
          }
        }
      }
    }
  }

  return changed;
}

// Apply naked subsets in a column
function applyNakedSubsetsInColumn(grid, candidates, col) {
  let changed = false;
  const cells = [];

  for (let row = 0; row < 9; row++) {
    if (grid[row][col] === 0 && candidates[row][col].length > 0 && candidates[row][col].length <= 4) {
      cells.push({ row, col, candidates: [...candidates[row][col]] });
    }
  }

  // Look for naked pairs, triples, and quads
  for (let subsetSize = 2; subsetSize <= 4; subsetSize++) {
    // Get all combinations of cells of size subsetSize
    const combinations = getCombinations(cells, subsetSize);

    for (const combo of combinations) {
      // Get union of all candidates in this combination
      const unionCandidates = [...new Set(combo.flatMap(cell => cell.candidates))];

      // If union has exactly subsetSize candidates, it's a naked subset
      if (unionCandidates.length === subsetSize) {
        // Remove these candidates from other cells in the column
        for (let row = 0; row < 9; row++) {
          if (grid[row][col] === 0 && !combo.some(c => c.row === row)) {
            const oldLength = candidates[row][col].length;
            candidates[row][col] = candidates[row][col].filter(num =>
              !unionCandidates.includes(num));
            if (candidates[row][col].length < oldLength) changed = true;
          }
        }
      }
    }
  }

  return changed;
}

// Apply naked subsets in a box
function applyNakedSubsetsInBox(grid, candidates, boxRow, boxCol) {
  let changed = false;
  const cells = [];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const row = boxRow * 3 + r;
      const col = boxCol * 3 + c;
      if (grid[row][col] === 0 && candidates[row][col].length > 0 && candidates[row][col].length <= 4) {
        cells.push({ row, col, candidates: [...candidates[row][col]] });
      }
    }
  }

  // Look for naked pairs, triples, and quads
  for (let subsetSize = 2; subsetSize <= 4; subsetSize++) {
    // Get all combinations of cells of size subsetSize
    const combinations = getCombinations(cells, subsetSize);

    for (const combo of combinations) {
      // Get union of all candidates in this combination
      const unionCandidates = [...new Set(combo.flatMap(cell => cell.candidates))];

      // If union has exactly subsetSize candidates, it's a naked subset
      if (unionCandidates.length === subsetSize) {
        // Remove these candidates from other cells in the box
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const row = boxRow * 3 + r;
            const col = boxCol * 3 + c;
            if (grid[row][col] === 0 && !combo.some(cell => cell.row === row && cell.col === col)) {
              const oldLength = candidates[row][col].length;
              candidates[row][col] = candidates[row][col].filter(num =>
                !unionCandidates.includes(num));
              if (candidates[row][col].length < oldLength) changed = true;
            }
          }
        }
      }
    }
  }

  return changed;
}

// Technique 4: Hidden Pairs/Triples/Quads
function applyHiddenSubsets(grid, candidates) {
  let changed = false;

  // Check for hidden pairs, triples, and quads in rows
  for (let row = 0; row < 9; row++) {
    if (applyHiddenSubsetsInRow(grid, candidates, row)) changed = true;
  }

  // Check for hidden pairs, triples, and quads in columns
  for (let col = 0; col < 9; col++) {
    if (applyHiddenSubsetsInColumn(grid, candidates, col)) changed = true;
  }

  // Check for hidden pairs, triples, and quads in boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      if (applyHiddenSubsetsInBox(grid, candidates, boxRow, boxCol)) changed = true;
    }
  }

  return changed;
}

// Apply hidden pairs in a row
function applyHiddenSubsetsInRow(grid, candidates, row) {
  let changed = false;

  // Check for hidden pairs
  for (let num1 = 1; num1 <= 8; num1++) {
    for (let num2 = num1 + 1; num2 <= 9; num2++) {
      if (!isNumberInRow(grid, row, num1) && !isNumberInRow(grid, row, num2)) {
        const positions1 = [];
        const positions2 = [];

        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0) {
            if (candidates[row][col].includes(num1)) positions1.push(col);
            if (candidates[row][col].includes(num2)) positions2.push(col);
          }
        }

        // Check if both numbers appear in exactly the same 2 positions (hidden pair)
        if (positions1.length === 2 && positions2.length === 2 &&
            positions1[0] === positions2[0] && positions1[1] === positions2[1]) {

          // Remove all other candidates from these two positions
          for (let col of positions1) {
            const oldLength = candidates[row][col].length;
            candidates[row][col] = candidates[row][col].filter(n => n === num1 || n === num2);
            if (candidates[row][col].length < oldLength) changed = true;
          }
        }
      }
    }
  }

  // Check for hidden triples
  for (let num1 = 1; num1 <= 7; num1++) {
    for (let num2 = num1 + 1; num2 <= 8; num2++) {
      for (let num3 = num2 + 1; num3 <= 9; num3++) {
        if (!isNumberInRow(grid, row, num1) && !isNumberInRow(grid, row, num2) && !isNumberInRow(grid, row, num3)) {
          const positions1 = [], positions2 = [], positions3 = [];

          for (let col = 0; col < 9; col++) {
            if (grid[row][col] === 0) {
              if (candidates[row][col].includes(num1)) positions1.push(col);
              if (candidates[row][col].includes(num2)) positions2.push(col);
              if (candidates[row][col].includes(num3)) positions3.push(col);
            }
          }

          // Find union of positions
          const allPositions = [...new Set([...positions1, ...positions2, ...positions3])];

          // Check if exactly 3 positions contain all three numbers
          if (allPositions.length === 3 &&
              allPositions.every(col =>
                candidates[row][col].includes(num1) ||
                candidates[row][col].includes(num2) ||
                candidates[row][col].includes(num3))) {

            // Remove all other candidates from these positions
            for (let col of allPositions) {
              const oldLength = candidates[row][col].length;
              candidates[row][col] = candidates[row][col].filter(n => n === num1 || n === num2 || n === num3);
              if (candidates[row][col].length < oldLength) changed = true;
            }
          }
        }
      }
    }
  }

  // Check for hidden quads
  for (let num1 = 1; num1 <= 6; num1++) {
    for (let num2 = num1 + 1; num2 <= 7; num2++) {
      for (let num3 = num2 + 1; num3 <= 8; num3++) {
        for (let num4 = num3 + 1; num4 <= 9; num4++) {
          if (!isNumberInRow(grid, row, num1) && !isNumberInRow(grid, row, num2) &&
              !isNumberInRow(grid, row, num3) && !isNumberInRow(grid, row, num4)) {
            const positions1 = [], positions2 = [], positions3 = [], positions4 = [];

            for (let col = 0; col < 9; col++) {
              if (grid[row][col] === 0) {
                if (candidates[row][col].includes(num1)) positions1.push(col);
                if (candidates[row][col].includes(num2)) positions2.push(col);
                if (candidates[row][col].includes(num3)) positions3.push(col);
                if (candidates[row][col].includes(num4)) positions4.push(col);
              }
            }

            // Find union of positions
            const allPositions = [...new Set([...positions1, ...positions2, ...positions3, ...positions4])];

            // Check if exactly 4 positions contain all four numbers
            if (allPositions.length === 4 &&
                allPositions.every(col =>
                  candidates[row][col].includes(num1) ||
                  candidates[row][col].includes(num2) ||
                  candidates[row][col].includes(num3) ||
                  candidates[row][col].includes(num4))) {

              // Remove all other candidates from these positions
              for (let col of allPositions) {
                const oldLength = candidates[row][col].length;
                candidates[row][col] = candidates[row][col].filter(n =>
                  n === num1 || n === num2 || n === num3 || n === num4);
                if (candidates[row][col].length < oldLength) changed = true;
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

// Apply hidden subsets in a column (similar to row logic)
function applyHiddenSubsetsInColumn(grid, candidates, col) {
  let changed = false;

  // Check for hidden pairs
  for (let num1 = 1; num1 <= 8; num1++) {
    for (let num2 = num1 + 1; num2 <= 9; num2++) {
      if (!isNumberInColumn(grid, col, num1) && !isNumberInColumn(grid, col, num2)) {
        const positions1 = [];
        const positions2 = [];

        for (let row = 0; row < 9; row++) {
          if (grid[row][col] === 0) {
            if (candidates[row][col].includes(num1)) positions1.push(row);
            if (candidates[row][col].includes(num2)) positions2.push(row);
          }
        }

        if (positions1.length === 2 && positions2.length === 2 &&
            positions1[0] === positions2[0] && positions1[1] === positions2[1]) {

          for (let row of positions1) {
            const oldLength = candidates[row][col].length;
            candidates[row][col] = candidates[row][col].filter(n => n === num1 || n === num2);
            if (candidates[row][col].length < oldLength) changed = true;
          }
        }
      }
    }
  }

  // Check for hidden triples
  for (let num1 = 1; num1 <= 7; num1++) {
    for (let num2 = num1 + 1; num2 <= 8; num2++) {
      for (let num3 = num2 + 1; num3 <= 9; num3++) {
        if (!isNumberInColumn(grid, col, num1) && !isNumberInColumn(grid, col, num2) && !isNumberInColumn(grid, col, num3)) {
          const positions1 = [], positions2 = [], positions3 = [];

          for (let row = 0; row < 9; row++) {
            if (grid[row][col] === 0) {
              if (candidates[row][col].includes(num1)) positions1.push(row);
              if (candidates[row][col].includes(num2)) positions2.push(row);
              if (candidates[row][col].includes(num3)) positions3.push(row);
            }
          }

          const allPositions = [...new Set([...positions1, ...positions2, ...positions3])];

          if (allPositions.length === 3) {
            for (let row of allPositions) {
              const oldLength = candidates[row][col].length;
              candidates[row][col] = candidates[row][col].filter(n => n === num1 || n === num2 || n === num3);
              if (candidates[row][col].length < oldLength) changed = true;
            }
          }
        }
      }
    }
  }

  // Check for hidden quads
  for (let num1 = 1; num1 <= 6; num1++) {
    for (let num2 = num1 + 1; num2 <= 7; num2++) {
      for (let num3 = num2 + 1; num3 <= 8; num3++) {
        for (let num4 = num3 + 1; num4 <= 9; num4++) {
          if (!isNumberInColumn(grid, col, num1) && !isNumberInColumn(grid, col, num2) &&
              !isNumberInColumn(grid, col, num3) && !isNumberInColumn(grid, col, num4)) {
            const positions1 = [], positions2 = [], positions3 = [], positions4 = [];

            for (let row = 0; row < 9; row++) {
              if (grid[row][col] === 0) {
                if (candidates[row][col].includes(num1)) positions1.push(row);
                if (candidates[row][col].includes(num2)) positions2.push(row);
                if (candidates[row][col].includes(num3)) positions3.push(row);
                if (candidates[row][col].includes(num4)) positions4.push(row);
              }
            }

            const allPositions = [...new Set([...positions1, ...positions2, ...positions3, ...positions4])];

            if (allPositions.length === 4 &&
                allPositions.every(row =>
                  candidates[row][col].includes(num1) ||
                  candidates[row][col].includes(num2) ||
                  candidates[row][col].includes(num3) ||
                  candidates[row][col].includes(num4))) {

              for (let row of allPositions) {
                const oldLength = candidates[row][col].length;
                candidates[row][col] = candidates[row][col].filter(n =>
                  n === num1 || n === num2 || n === num3 || n === num4);
                if (candidates[row][col].length < oldLength) changed = true;
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

// Apply hidden subsets in a box
function applyHiddenSubsetsInBox(grid, candidates, boxRow, boxCol) {
  let changed = false;

  // Check for hidden pairs
  for (let num1 = 1; num1 <= 8; num1++) {
    for (let num2 = num1 + 1; num2 <= 9; num2++) {
      if (!isNumberInBox(grid, boxRow * 3, boxCol * 3, num1) &&
          !isNumberInBox(grid, boxRow * 3, boxCol * 3, num2)) {

        const positions1 = [];
        const positions2 = [];

        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const row = boxRow * 3 + r;
            const col = boxCol * 3 + c;
            if (grid[row][col] === 0) {
              if (candidates[row][col].includes(num1)) positions1.push([row, col]);
              if (candidates[row][col].includes(num2)) positions2.push([row, col]);
            }
          }
        }

        if (positions1.length === 2 && positions2.length === 2 &&
            positions1[0][0] === positions2[0][0] && positions1[0][1] === positions2[0][1] &&
            positions1[1][0] === positions2[1][0] && positions1[1][1] === positions2[1][1]) {

          for (let [row, col] of positions1) {
            const oldLength = candidates[row][col].length;
            candidates[row][col] = candidates[row][col].filter(n => n === num1 || n === num2);
            if (candidates[row][col].length < oldLength) changed = true;
          }
        }
      }
    }
  }

  // Check for hidden triples
  for (let num1 = 1; num1 <= 7; num1++) {
    for (let num2 = num1 + 1; num2 <= 8; num2++) {
      for (let num3 = num2 + 1; num3 <= 9; num3++) {
        if (!isNumberInBox(grid, boxRow * 3, boxCol * 3, num1) &&
            !isNumberInBox(grid, boxRow * 3, boxCol * 3, num2) &&
            !isNumberInBox(grid, boxRow * 3, boxCol * 3, num3)) {

          const positions1 = [], positions2 = [], positions3 = [];

          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const row = boxRow * 3 + r;
              const col = boxCol * 3 + c;
              if (grid[row][col] === 0) {
                if (candidates[row][col].includes(num1)) positions1.push([row, col]);
                if (candidates[row][col].includes(num2)) positions2.push([row, col]);
                if (candidates[row][col].includes(num3)) positions3.push([row, col]);
              }
            }
          }

          const allPositions = [...new Set(positions1.concat(positions2, positions3).map(p => `${p[0]},${p[1]}`))].map(s => s.split(',').map(Number));

          if (allPositions.length === 3) {
            for (let [row, col] of allPositions) {
              const oldLength = candidates[row][col].length;
              candidates[row][col] = candidates[row][col].filter(n => n === num1 || n === num2 || n === num3);
              if (candidates[row][col].length < oldLength) changed = true;
            }
          }
        }
      }
    }
  }

  // Check for hidden quads
  for (let num1 = 1; num1 <= 6; num1++) {
    for (let num2 = num1 + 1; num2 <= 7; num2++) {
      for (let num3 = num2 + 1; num3 <= 8; num3++) {
        for (let num4 = num3 + 1; num4 <= 9; num4++) {
          if (!isNumberInBox(grid, boxRow * 3, boxCol * 3, num1) &&
              !isNumberInBox(grid, boxRow * 3, boxCol * 3, num2) &&
              !isNumberInBox(grid, boxRow * 3, boxCol * 3, num3) &&
              !isNumberInBox(grid, boxRow * 3, boxCol * 3, num4)) {

            const positions1 = [], positions2 = [], positions3 = [], positions4 = [];

            for (let r = 0; r < 3; r++) {
              for (let c = 0; c < 3; c++) {
                const row = boxRow * 3 + r;
                const col = boxCol * 3 + c;
                if (grid[row][col] === 0) {
                  if (candidates[row][col].includes(num1)) positions1.push([row, col]);
                  if (candidates[row][col].includes(num2)) positions2.push([row, col]);
                  if (candidates[row][col].includes(num3)) positions3.push([row, col]);
                  if (candidates[row][col].includes(num4)) positions4.push([row, col]);
                }
              }
            }

            const allPositions = [...new Set(positions1.concat(positions2, positions3, positions4).map(p => `${p[0]},${p[1]}`))].map(s => s.split(',').map(Number));

            if (allPositions.length === 4) {
              for (let [row, col] of allPositions) {
                const oldLength = candidates[row][col].length;
                candidates[row][col] = candidates[row][col].filter(n => n === num1 || n === num2 || n === num3 || n === num4);
                if (candidates[row][col].length < oldLength) changed = true;
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

// Technique 5: Pointing Pairs/Triples
function applyPointingPairs(grid, candidates) {
  let changed = false;

  // Check each box for pointing pairs/triples
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      for (let num = 1; num <= 9; num++) {
        if (!isNumberInBox(grid, boxRow * 3, boxCol * 3, num)) {
          // Find all positions in this box where num can go
          const positions = [];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const row = boxRow * 3 + r;
              const col = boxCol * 3 + c;
              if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
                positions.push([row, col]);
              }
            }
          }

          // Check if all positions are in the same row
          if (positions.length > 1) {
            const sameRow = positions.every(([row, col]) => row === positions[0][0]);
            if (sameRow) {
              // Remove num from other cells in this row (outside the box)
              const row = positions[0][0];
              for (let col = 0; col < 9; col++) {
                const inBox = Math.floor(col / 3) === boxCol;
                if (!inBox && grid[row][col] === 0) {
                  const oldLength = candidates[row][col].length;
                  candidates[row][col] = candidates[row][col].filter(n => n !== num);
                  if (candidates[row][col].length < oldLength) changed = true;
                }
              }
            }

            // Check if all positions are in the same column
            const sameCol = positions.every(([row, col]) => col === positions[0][1]);
            if (sameCol) {
              // Remove num from other cells in this column (outside the box)
              const col = positions[0][1];
              for (let row = 0; row < 9; row++) {
                const inBox = Math.floor(row / 3) === boxRow;
                if (!inBox && grid[row][col] === 0) {
                  const oldLength = candidates[row][col].length;
                  candidates[row][col] = candidates[row][col].filter(n => n !== num);
                  if (candidates[row][col].length < oldLength) changed = true;
                }
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

// Technique 6: Box/Line Reduction
function applyBoxLineReduction(grid, candidates) {
  let changed = false;

  // For each row, check if a number can only appear in one box
  for (let row = 0; row < 9; row++) {
    for (let num = 1; num <= 9; num++) {
      if (!isNumberInRow(grid, row, num)) {
        const positions = [];
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            positions.push([row, col]);
          }
        }

        // Check if all positions are in the same box
        if (positions.length > 1) {
          const boxes = positions.map(([r, c]) => Math.floor(c / 3));
          const sameBox = boxes.every(box => box === boxes[0]);

          if (sameBox) {
            // Remove num from other cells in this box (outside the row)
            const boxCol = boxes[0];
            const boxRowStart = Math.floor(row / 3) * 3;

            for (let r = boxRowStart; r < boxRowStart + 3; r++) {
              if (r !== row) {
                for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
                  if (grid[r][c] === 0) {
                    const oldLength = candidates[r][c].length;
                    candidates[r][c] = candidates[r][c].filter(n => n !== num);
                    if (candidates[r][c].length < oldLength) changed = true;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // For each column, check if a number can only appear in one box
  for (let col = 0; col < 9; col++) {
    for (let num = 1; num <= 9; num++) {
      if (!isNumberInColumn(grid, col, num)) {
        const positions = [];
        for (let row = 0; row < 9; row++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            positions.push([row, col]);
          }
        }

        // Check if all positions are in the same box
        if (positions.length > 1) {
          const boxes = positions.map(([r, c]) => Math.floor(r / 3));
          const sameBox = boxes.every(box => box === boxes[0]);

          if (sameBox) {
            // Remove num from other cells in this box (outside the column)
            const boxRow = boxes[0];
            const boxColStart = Math.floor(col / 3) * 3;

            for (let c = boxColStart; c < boxColStart + 3; c++) {
              if (c !== col) {
                for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
                  if (grid[r][c] === 0) {
                    const oldLength = candidates[r][c].length;
                    candidates[r][c] = candidates[r][c].filter(n => n !== num);
                    if (candidates[r][c].length < oldLength) changed = true;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

// Helper function to compare arrays
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return sorted1.every((val, i) => val === sorted2[i]);
}

// Helper function to get all combinations of k elements from array
function getCombinations(arr, k) {
  if (k === 1) return arr.map(item => [item]);
  if (k === arr.length) return [arr];
  if (k > arr.length) return [];

  const result = [];
  for (let i = 0; i <= arr.length - k; i++) {
    const first = arr[i];
    const rest = arr.slice(i + 1);
    const combos = getCombinations(rest, k - 1);
    for (const combo of combos) {
      result.push([first, ...combo]);
    }
  }
  return result;
}

// Convert grid to 81-character string
function gridToString(grid) {
  return grid.flat().join('');
}

// Convert 81-character string to grid
function stringToGrid(str) {
  const grid = [];
  for (let i = 0; i < 9; i++) {
    grid.push(str.slice(i * 9, (i + 1) * 9).split('').map(Number));
  }
  return grid;
}

// Generate daily puzzles for a specific date with validation
async function generateDailyPuzzles(date) {
  try {
    let attempts = 0;
    const maxAttempts = 5;
    let validPuzzles = null;
    let finalSolution = null;

    // Create deterministic seed from date to ensure same puzzles for all users
    const dateSeed = new Date(date).getTime();

    // Try multiple times to generate valid puzzles
    while (attempts < maxAttempts && !validPuzzles) {
      attempts++;
      console.log(`🎲 Generating puzzle attempt ${attempts} for ${date}`);

      const solution = generateCompleteSolution(dateSeed + attempts);

      const puzzles = {
        easy: generatePuzzle(solution, 'easy', dateSeed + attempts * 3 + 1),
        medium: generatePuzzle(solution, 'medium', dateSeed + attempts * 3 + 2),
        hard: generatePuzzle(solution, 'hard', dateSeed + attempts * 3 + 3)
      };

      // Simplified validation - just check basic requirements
      const validationResults = {
        easy: validatePuzzleSimple(puzzles.easy, solution),
        medium: validatePuzzleSimple(puzzles.medium, solution),
        hard: validatePuzzleSimple(puzzles.hard, solution)
      };

      console.log(`Validation results for attempt ${attempts}:`, validationResults);

      // Check if all puzzles meet basic requirements
      if (validationResults.easy.isValid && validationResults.medium.isValid && validationResults.hard.isValid) {
        validPuzzles = puzzles;
        finalSolution = solution;
        console.log(`✅ Successfully generated valid puzzles for ${date} on attempt ${attempts}`);
        console.log(`Clue counts - Easy: ${validationResults.easy.clueCount}, Medium: ${validationResults.medium.clueCount}, Hard: ${validationResults.hard.clueCount}`);
      } else {
        console.log(`❌ Attempt ${attempts} failed validation:`);
        if (!validationResults.easy.isValid) console.log(`  Easy: ${validationResults.easy.reason}`);
        if (!validationResults.medium.isValid) console.log(`  Medium: ${validationResults.medium.reason}`);
        if (!validationResults.hard.isValid) console.log(`  Hard: ${validationResults.hard.reason}`);
      }
    }

    // If we couldn't generate valid puzzles, use fallback
    if (!validPuzzles) {
      console.log(`⚠️ Using fallback puzzles for ${date} after ${maxAttempts} attempts`);
      finalSolution = generateCompleteSolution(dateSeed + 999);
      validPuzzles = {
        easy: createFallbackPuzzle(finalSolution, 'easy', dateSeed + 1001),
        medium: createFallbackPuzzle(finalSolution, 'medium', dateSeed + 1002),
        hard: createFallbackPuzzle(finalSolution, 'hard', dateSeed + 1003)
      };
    }

    // Store in database
    await sql`
      INSERT INTO daily_puzzles (
        date,
        easy_puzzle, medium_puzzle, hard_puzzle,
        easy_solution, medium_solution, hard_solution
      )
      VALUES (
        ${date},
        ${gridToString(validPuzzles.easy)},
        ${gridToString(validPuzzles.medium)},
        ${gridToString(validPuzzles.hard)},
        ${gridToString(finalSolution)},
        ${gridToString(finalSolution)},
        ${gridToString(finalSolution)}
      )
      ON CONFLICT (date) DO UPDATE SET
        easy_puzzle = ${gridToString(validPuzzles.easy)},
        medium_puzzle = ${gridToString(validPuzzles.medium)},
        hard_puzzle = ${gridToString(validPuzzles.hard)},
        easy_solution = ${gridToString(finalSolution)},
        medium_solution = ${gridToString(finalSolution)},
        hard_solution = ${gridToString(finalSolution)}
    `;

    return {
      easy: { puzzle: validPuzzles.easy, solution: finalSolution },
      medium: { puzzle: validPuzzles.medium, solution: finalSolution },
      hard: { puzzle: validPuzzles.hard, solution: finalSolution }
    };

  } catch (error) {
    console.error('Failed to generate daily puzzles:', error);
    throw error;
  }
}

// Calculate how much candidate elimination work is required to solve the puzzle
function calculateCandidateEliminationDepth(puzzle) {
  let depth = 0;
  let workingGrid = puzzle.map(row => [...row]);
  let iterations = 0;
  const maxIterations = 50;

  while (iterations < maxIterations) {
    iterations++;
    let madeProgress = false;

    // Initialize candidates for current state
    const candidates = initializeCandidates(workingGrid);

    // Try to find ANY placement using logical techniques
    let foundPlacement = false;

    // First try naked singles
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (workingGrid[row][col] === 0 && candidates[row][col].length === 1) {
          // Found a placement - count candidates that had to be considered
          depth += candidates[row][col].length;
          workingGrid[row][col] = candidates[row][col][0];
          foundPlacement = true;
          madeProgress = true;
          break;
        }
      }
      if (foundPlacement) break;
    }

    // Then try hidden singles
    if (!foundPlacement) {
      // Check rows
      for (let row = 0; row < 9; row++) {
        for (let num = 1; num <= 9; num++) {
          if (!isNumberInRow(workingGrid, row, num)) {
            const possibleCols = [];
            for (let col = 0; col < 9; col++) {
              if (workingGrid[row][col] === 0 && candidates[row][col].includes(num)) {
                possibleCols.push(col);
              }
            }
            if (possibleCols.length === 1) {
              const col = possibleCols[0];
              depth += candidates[row][col].length;
              workingGrid[row][col] = num;
              foundPlacement = true;
              madeProgress = true;
              break;
            }
          }
        }
        if (foundPlacement) break;
      }
    }

    // Check columns for hidden singles
    if (!foundPlacement) {
      for (let col = 0; col < 9; col++) {
        for (let num = 1; num <= 9; num++) {
          if (!isNumberInColumn(workingGrid, col, num)) {
            const possibleRows = [];
            for (let row = 0; row < 9; row++) {
              if (workingGrid[row][col] === 0 && candidates[row][col].includes(num)) {
                possibleRows.push(row);
              }
            }
            if (possibleRows.length === 1) {
              const row = possibleRows[0];
              depth += candidates[row][col].length;
              workingGrid[row][col] = num;
              foundPlacement = true;
              madeProgress = true;
              break;
            }
          }
        }
        if (foundPlacement) break;
      }
    }

    // Check boxes for hidden singles
    if (!foundPlacement) {
      for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
          for (let num = 1; num <= 9; num++) {
            const startRow = boxRow * 3;
            const startCol = boxCol * 3;
            if (!isNumberInBox(workingGrid, startRow, startCol, num)) {
              const possiblePositions = [];
              for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                  const row = startRow + r;
                  const col = startCol + c;
                  if (workingGrid[row][col] === 0 && candidates[row][col].includes(num)) {
                    possiblePositions.push({ row, col });
                  }
                }
              }
              if (possiblePositions.length === 1) {
                const { row, col } = possiblePositions[0];
                depth += candidates[row][col].length;
                workingGrid[row][col] = num;
                foundPlacement = true;
                madeProgress = true;
                break;
              }
            }
          }
          if (foundPlacement) break;
        }
        if (foundPlacement) break;
      }
    }

    if (!madeProgress) break;

    // Check if puzzle is complete
    let complete = true;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (workingGrid[row][col] === 0) {
          complete = false;
          break;
        }
      }
      if (!complete) break;
    }
    if (complete) break;
  }

  return depth;
}

// Count how many times the solver gets "stuck" and needs advanced techniques
function countForcedBottlenecks(puzzle) {
  let bottlenecks = 0;
  let workingGrid = puzzle.map(row => [...row]);
  let iterations = 0;
  const maxIterations = 50;

  while (iterations < maxIterations) {
    iterations++;
    let foundSimpleMove = false;

    // Try only simple techniques (naked/hidden singles)
    const candidates = initializeCandidates(workingGrid);

    // Try naked singles
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (workingGrid[row][col] === 0 && candidates[row][col].length === 1) {
          workingGrid[row][col] = candidates[row][col][0];
          foundSimpleMove = true;
          break;
        }
      }
      if (foundSimpleMove) break;
    }

    // Try hidden singles if no naked single found
    if (!foundSimpleMove) {
      // Try rows
      for (let row = 0; row < 9; row++) {
        for (let num = 1; num <= 9; num++) {
          if (!isNumberInRow(workingGrid, row, num)) {
            const possibleCols = [];
            for (let col = 0; col < 9; col++) {
              if (workingGrid[row][col] === 0 && candidates[row][col].includes(num)) {
                possibleCols.push(col);
              }
            }
            if (possibleCols.length === 1) {
              workingGrid[row][possibleCols[0]] = num;
              foundSimpleMove = true;
              break;
            }
          }
        }
        if (foundSimpleMove) break;
      }
    }

    // Try columns
    if (!foundSimpleMove) {
      for (let col = 0; col < 9; col++) {
        for (let num = 1; num <= 9; num++) {
          if (!isNumberInColumn(workingGrid, col, num)) {
            const possibleRows = [];
            for (let row = 0; row < 9; row++) {
              if (workingGrid[row][col] === 0 && candidates[row][col].includes(num)) {
                possibleRows.push(row);
              }
            }
            if (possibleRows.length === 1) {
              workingGrid[possibleRows[0]][col] = num;
              foundSimpleMove = true;
              break;
            }
          }
        }
        if (foundSimpleMove) break;
      }
    }

    // Try boxes
    if (!foundSimpleMove) {
      for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
          for (let num = 1; num <= 9; num++) {
            const startRow = boxRow * 3;
            const startCol = boxCol * 3;
            if (!isNumberInBox(workingGrid, startRow, startCol, num)) {
              const possiblePositions = [];
              for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                  const row = startRow + r;
                  const col = startCol + c;
                  if (workingGrid[row][col] === 0 && candidates[row][col].includes(num)) {
                    possiblePositions.push({ row, col });
                  }
                }
              }
              if (possiblePositions.length === 1) {
                const { row, col } = possiblePositions[0];
                workingGrid[row][col] = num;
                foundSimpleMove = true;
                break;
              }
            }
          }
          if (foundSimpleMove) break;
        }
        if (foundSimpleMove) break;
      }
    }

    if (foundSimpleMove) {
      continue; // Keep trying simple moves
    }

    // No simple move found - this is a bottleneck!
    bottlenecks++;

    // Try to break through with advanced technique (naked/hidden pairs)
    let foundAdvancedMove = false;

    // Try applying naked pairs/triples to eliminate candidates
    const beforeCandidates = JSON.stringify(candidates);
    applyNakedSubsets(workingGrid, candidates);
    applyHiddenSubsets(workingGrid, candidates);
    const afterCandidates = JSON.stringify(candidates);

    if (beforeCandidates !== afterCandidates) {
      foundAdvancedMove = true;
    }

    if (!foundAdvancedMove) {
      // Can't progress further
      break;
    }
  }

  return bottlenecks;
}

// Validate puzzle quality based on difficulty settings and solver results
function validatePuzzleQuality(puzzle, expectedSolution, settings, solverResult) {
  if (settings.targetDifficultyScore) {
    const [min, max] = settings.targetDifficultyScore;
    if (solverResult.difficultyScore < min || solverResult.difficultyScore > max) {
      return { isValid: false, reason: `Score ${solverResult.difficultyScore} outside [${min}, ${max}]` };
    }
  }

  if (settings.minEntryPoints && solverResult.entryPoints < settings.minEntryPoints) {
    return { isValid: false, reason: `Only ${solverResult.entryPoints} entry points, need ${settings.minEntryPoints}` };
  }

  if (settings.maxConsecutiveAdvanced !== undefined &&
      solverResult.maxConsecutiveAdvanced > settings.maxConsecutiveAdvanced) {
    return { isValid: false, reason: `${solverResult.maxConsecutiveAdvanced} consecutive advanced exceeds ${settings.maxConsecutiveAdvanced}` };
  }

  if (settings.minDependencyScore && solverResult.averageDependencyScore < settings.minDependencyScore) {
    return { isValid: false, reason: `Dependency ${solverResult.averageDependencyScore.toFixed(1)} too low` };
  }

  if (solverResult.requiresGuessing) {
    return { isValid: false, reason: `Requires guessing` };
  }

  // NEW: Hard difficulty validation for candidate elimination depth
  if (settings.requireCandidateElimination) {
    const eliminationDepth = calculateCandidateEliminationDepth(puzzle);
    const minDepth = settings.minCandidateEliminationDepth || 80;

    if (eliminationDepth < minDepth) {
      return { isValid: false, reason: `Elimination depth ${eliminationDepth} < ${minDepth} (not enough candidate work)` };
    }
  }

  // NEW: Hard difficulty validation for forced bottlenecks
  if (settings.requireForcedBottlenecks) {
    const bottlenecks = countForcedBottlenecks(puzzle);
    const minBottlenecks = settings.minForcedBottlenecks || 2;

    if (bottlenecks < minBottlenecks) {
      return { isValid: false, reason: `Only ${bottlenecks} bottlenecks, need ${minBottlenecks}` };
    }
  }

  return { isValid: true, solverResult };
}

// Critical function: Count the number of solutions to verify uniqueness
function countSolutions(puzzle, maxSolutions = 2) {
  // First check if the puzzle has any immediate conflicts
  if (!isValidPuzzleState(puzzle)) {
    return 0; // Invalid puzzle
  }

  const solutions = [];
  const testGrid = puzzle.map(row => [...row]);

  function isValidForSolver(grid, row, col, num) {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }

    // Check 3x3 box
    const startRow = row - row % 3;
    const startCol = col - col % 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[i + startRow][j + startCol] === num) return false;
      }
    }

    return true;
  }

  function solveAndCount(grid) {
    if (solutions.length >= maxSolutions) return; // Stop if we found enough solutions

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          let foundValid = false;
          for (let num = 1; num <= 9; num++) {
            if (isValidForSolver(grid, row, col, num)) {
              foundValid = true;
              grid[row][col] = num;
              solveAndCount(grid);
              grid[row][col] = 0;

              // Early exit if we found enough solutions
              if (solutions.length >= maxSolutions) return;
            }
          }
          if (!foundValid) return; // No valid numbers for this cell
          return; // Processed this empty cell
        }
      }
    }

    // Grid is complete - found a solution
    solutions.push(grid.map(row => [...row]));
  }

  solveAndCount(testGrid);
  return solutions.length;
}

// Helper function to check if puzzle has any immediate conflicts
function isValidPuzzleState(puzzle) {
  // Check rows for duplicates
  for (let row = 0; row < 9; row++) {
    const seen = new Set();
    for (let col = 0; col < 9; col++) {
      const num = puzzle[row][col];
      if (num !== 0) {
        if (seen.has(num)) return false; // Duplicate in row
        seen.add(num);
      }
    }
  }

  // Check columns for duplicates
  for (let col = 0; col < 9; col++) {
    const seen = new Set();
    for (let row = 0; row < 9; row++) {
      const num = puzzle[row][col];
      if (num !== 0) {
        if (seen.has(num)) return false; // Duplicate in column
        seen.add(num);
      }
    }
  }

  // Check 3x3 boxes for duplicates
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const num = puzzle[boxRow * 3 + r][boxCol * 3 + c];
          if (num !== 0) {
            if (seen.has(num)) return false; // Duplicate in box
            seen.add(num);
          }
        }
      }
    }
  }

  return true; // No conflicts found
}

// Enhanced validation that includes uniqueness check
function validatePuzzleSimple(puzzle, expectedSolution) {
  // Count clues
  let clueCount = 0;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (puzzle[row][col] !== 0) clueCount++;
    }
  }

  // Minimum clue check
  if (clueCount < 17) {
    return { isValid: false, reason: `Too few clues (${clueCount})`, clueCount };
  }

  // Maximum clue check (too many clues make it too easy)
  if (clueCount > 45) {
    return { isValid: false, reason: `Too many clues (${clueCount})`, clueCount };
  }

  // Basic validity check - ensure no immediate conflicts
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const num = puzzle[row][col];
      if (num !== 0) {
        // Temporarily remove the number and check if it's valid
        const original = puzzle[row][col];
        puzzle[row][col] = 0;
        if (!isValidPlacement(puzzle, row, col, num)) {
          puzzle[row][col] = original; // restore
          return { isValid: false, reason: `Invalid clue at R${row+1}C${col+1}`, clueCount };
        }
        puzzle[row][col] = original; // restore
      }
    }
  }

  // Verify all given clues match the expected solution
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (puzzle[row][col] !== 0 && puzzle[row][col] !== expectedSolution[row][col]) {
        return { isValid: false, reason: `Clue mismatch at R${row+1}C${col+1}`, clueCount };
      }
    }
  }

  // CRITICAL: Check for unique solution
  const solutionCount = countSolutions(puzzle);
  if (solutionCount === 0) {
    return { isValid: false, reason: `No solutions found`, clueCount };
  } else if (solutionCount > 1) {
    return { isValid: false, reason: `Multiple solutions (${solutionCount}+) - not logically solvable`, clueCount };
  }

  return { isValid: true, reason: 'Valid puzzle with unique solution', clueCount };
}

// Keep the original validation function for reference
function validatePuzzle(puzzle, expectedSolution) {
  return validatePuzzleSimple(puzzle, expectedSolution);
}

// Get daily puzzles for a specific date
async function getDailyPuzzles(date) {
  try {
    const result = await sql`
      SELECT * FROM daily_puzzles WHERE date = ${date}
    `;

    if (result.rows.length === 0) {
      // Generate puzzles if they don't exist
      return await generateDailyPuzzles(date);
    }

    const row = result.rows[0];
    return {
      easy: {
        puzzle: stringToGrid(row.easy_puzzle),
        solution: stringToGrid(row.easy_solution)
      },
      medium: {
        puzzle: stringToGrid(row.medium_puzzle),
        solution: stringToGrid(row.medium_solution)
      },
      hard: {
        puzzle: stringToGrid(row.hard_puzzle),
        solution: stringToGrid(row.hard_solution)
      }
    };

  } catch (error) {
    console.error('Failed to get daily puzzles:', error);
    throw error;
  }
}

// Save/load game state
async function saveGameState(player, date, difficulty, state) {
  try {
    await sql`
      INSERT INTO game_states (
        player, date, difficulty, current_state,
        timer_seconds, hints_used, errors_made, last_updated
      )
      VALUES (
        ${player}, ${date}, ${difficulty}, ${JSON.stringify(state)},
        ${state.timer || 0}, ${state.hints || 0}, ${state.errors || 0}, NOW()
      )
      ON CONFLICT (player, date, difficulty) DO UPDATE SET
        current_state = ${JSON.stringify(state)},
        timer_seconds = ${state.timer || 0},
        hints_used = ${state.hints || 0},
        errors_made = ${state.errors || 0},
        last_updated = NOW()
    `;

    return true;
  } catch (error) {
    console.error('Failed to save game state:', error);
    throw error;
  }
}

async function getGameState(player, date, difficulty) {
  try {
    const result = await sql`
      SELECT * FROM game_states
      WHERE player = ${player} AND date = ${date} AND difficulty = ${difficulty}
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...JSON.parse(row.current_state),
      timer: row.timer_seconds,
      hints: row.hints_used,
      errors: row.errors_made,
      lastUpdated: row.last_updated
    };

  } catch (error) {
    console.error('Failed to get game state:', error);
    return null;
  }
}

// ========= ADVANCED SOLVING TECHNIQUES =========

// X-Wing technique: When a number appears in only two rows/columns in exactly two positions,
// and those positions form a rectangle, eliminate that number from other positions in those columns/rows
function applyXWing(grid, candidates) {
  let changed = false;

  // Check rows for X-Wing patterns
  for (let num = 1; num <= 9; num++) {
    const rowsWithNum = [];

    // Find rows where this number has exactly 2 possible positions
    for (let row = 0; row < 9; row++) {
      if (!isNumberInRow(grid, row, num)) {
        const positions = [];
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            positions.push(col);
          }
        }
        if (positions.length === 2) {
          rowsWithNum.push({ row, cols: positions });
        }
      }
    }

    // Look for X-Wing patterns
    for (let i = 0; i < rowsWithNum.length - 1; i++) {
      for (let j = i + 1; j < rowsWithNum.length; j++) {
        const row1 = rowsWithNum[i];
        const row2 = rowsWithNum[j];

        // Check if they form an X-Wing (same column positions)
        if (row1.cols[0] === row2.cols[0] && row1.cols[1] === row2.cols[1]) {
          // Eliminate num from these columns in all other rows
          for (let row = 0; row < 9; row++) {
            if (row !== row1.row && row !== row2.row) {
              for (let col of row1.cols) {
                if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
                  candidates[row][col] = candidates[row][col].filter(n => n !== num);
                  changed = true;
                }
              }
            }
          }
        }
      }
    }
  }

  // Check columns for X-Wing patterns (similar logic)
  for (let num = 1; num <= 9; num++) {
    const colsWithNum = [];

    for (let col = 0; col < 9; col++) {
      if (!isNumberInColumn(grid, col, num)) {
        const positions = [];
        for (let row = 0; row < 9; row++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            positions.push(row);
          }
        }
        if (positions.length === 2) {
          colsWithNum.push({ col, rows: positions });
        }
      }
    }

    for (let i = 0; i < colsWithNum.length - 1; i++) {
      for (let j = i + 1; j < colsWithNum.length; j++) {
        const col1 = colsWithNum[i];
        const col2 = colsWithNum[j];

        if (col1.rows[0] === col2.rows[0] && col1.rows[1] === col2.rows[1]) {
          for (let col = 0; col < 9; col++) {
            if (col !== col1.col && col !== col2.col) {
              for (let row of col1.rows) {
                if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
                  candidates[row][col] = candidates[row][col].filter(n => n !== num);
                  changed = true;
                }
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

// Y-Wing technique: A chain of three cells forming a Y pattern
function applyYWing(grid, candidates) {
  let changed = false;

  // Find cells with exactly 2 candidates (potential pivots and pincers)
  const biValueCells = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0 && candidates[row][col].length === 2) {
        biValueCells.push({ row, col, candidates: [...candidates[row][col]] });
      }
    }
  }

  // Look for Y-Wing patterns
  for (let pivot of biValueCells) {
    for (let pincer1 of biValueCells) {
      for (let pincer2 of biValueCells) {
        if (pivot === pincer1 || pivot === pincer2 || pincer1 === pincer2) continue;

        // Check if they form a Y-Wing pattern
        const [pivotA, pivotB] = pivot.candidates;
        const [p1A, p1B] = pincer1.candidates;
        const [p2A, p2B] = pincer2.candidates;

        // Pivot should share one candidate with each pincer, and pincers should share the remaining candidate
        let sharedWithP1, sharedWithP2, targetNum;

        if (pivotA === p1A || pivotA === p1B) {
          sharedWithP1 = pivotA;
          sharedWithP2 = pivotB;
        } else if (pivotB === p1A || pivotB === p1B) {
          sharedWithP1 = pivotB;
          sharedWithP2 = pivotA;
        } else {
          continue;
        }

        if (!(sharedWithP2 === p2A || sharedWithP2 === p2B)) continue;

        // Find the common candidate between the two pincers
        if ((p1A === p2A || p1A === p2B) && p1A !== sharedWithP1) {
          targetNum = p1A;
        } else if ((p1B === p2A || p1B === p2B) && p1B !== sharedWithP1) {
          targetNum = p1B;
        } else {
          continue;
        }

        // Check if pivot sees both pincers
        const pivotSeesPincer1 = seesCell(pivot, pincer1);
        const pivotSeesPincer2 = seesCell(pivot, pincer2);

        if (pivotSeesPincer1 && pivotSeesPincer2) {
          // Find cells that see both pincers and eliminate targetNum
          for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
              if (grid[row][col] === 0 && candidates[row][col].includes(targetNum)) {
                const cell = { row, col };
                if (seesCell(cell, pincer1) && seesCell(cell, pincer2) &&
                    !(cell.row === pincer1.row && cell.col === pincer1.col) &&
                    !(cell.row === pincer2.row && cell.col === pincer2.col)) {
                  candidates[row][col] = candidates[row][col].filter(n => n !== targetNum);
                  changed = true;
                }
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

// XYZ-Wing technique: Extension of Y-Wing with three candidates
function applyXYZWing(grid, candidates) {
  let changed = false;

  // Find cells with exactly 2 or 3 candidates
  const candidateCells = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0 && (candidates[row][col].length === 2 || candidates[row][col].length === 3)) {
        candidateCells.push({ row, col, candidates: [...candidates[row][col]] });
      }
    }
  }

  // Look for XYZ-Wing patterns (simplified implementation)
  for (let pivot of candidateCells.filter(c => c.candidates.length === 3)) {
    for (let wing1 of candidateCells.filter(c => c.candidates.length === 2)) {
      for (let wing2 of candidateCells.filter(c => c.candidates.length === 2)) {
        if (pivot === wing1 || pivot === wing2 || wing1 === wing2) continue;

        // Check if wings share exactly one candidate with pivot and have one common candidate
        const commonCands = pivot.candidates.filter(c =>
          wing1.candidates.includes(c) || wing2.candidates.includes(c)
        );

        if (commonCands.length === 2) {
          const sharedBetweenWings = wing1.candidates.find(c => wing2.candidates.includes(c));
          if (sharedBetweenWings && pivot.candidates.includes(sharedBetweenWings)) {
            // Apply elimination
            if (seesCell(pivot, wing1) && seesCell(pivot, wing2)) {
              for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                  if (grid[row][col] === 0 && candidates[row][col].includes(sharedBetweenWings)) {
                    const cell = { row, col };
                    if (seesCell(cell, pivot) && seesCell(cell, wing1) && seesCell(cell, wing2) &&
                        !(cell.row === pivot.row && cell.col === pivot.col) &&
                        !(cell.row === wing1.row && cell.col === wing1.col) &&
                        !(cell.row === wing2.row && cell.col === wing2.col)) {
                      candidates[row][col] = candidates[row][col].filter(n => n !== sharedBetweenWings);
                      changed = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

// Swordfish technique: 3x3 version of X-Wing
function applySwordfish(grid, candidates) {
  let changed = false;

  // Simplified Swordfish implementation - look for 3x3 patterns
  for (let num = 1; num <= 9; num++) {
    // Check rows for Swordfish
    const rowsWithNum = [];

    for (let row = 0; row < 9; row++) {
      if (!isNumberInRow(grid, row, num)) {
        const positions = [];
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            positions.push(col);
          }
        }
        if (positions.length >= 2 && positions.length <= 3) {
          rowsWithNum.push({ row, cols: positions });
        }
      }
    }

    // Look for 3-row Swordfish patterns
    if (rowsWithNum.length >= 3) {
      for (let i = 0; i < rowsWithNum.length - 2; i++) {
        for (let j = i + 1; j < rowsWithNum.length - 1; j++) {
          for (let k = j + 1; k < rowsWithNum.length; k++) {
            const allCols = [...new Set([
              ...rowsWithNum[i].cols,
              ...rowsWithNum[j].cols,
              ...rowsWithNum[k].cols
            ])];

            // If exactly 3 columns are involved, it's a Swordfish
            if (allCols.length === 3) {
              // Eliminate from these columns in other rows
              for (let row = 0; row < 9; row++) {
                if (row !== rowsWithNum[i].row &&
                    row !== rowsWithNum[j].row &&
                    row !== rowsWithNum[k].row) {
                  for (let col of allCols) {
                    if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
                      candidates[row][col] = candidates[row][col].filter(n => n !== num);
                      changed = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

// Simple Coloring/Chains technique (basic implementation)
function applySimpleColoring(grid, candidates) {
  let changed = false;

  // Look for strong links (cells where a number can only go in 2 places in a unit)
  for (let num = 1; num <= 9; num++) {
    const strongLinks = [];

    // Find strong links in rows
    for (let row = 0; row < 9; row++) {
      if (!isNumberInRow(grid, row, num)) {
        const positions = [];
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            positions.push({ row, col });
          }
        }
        if (positions.length === 2) {
          strongLinks.push({ type: 'row', positions, unit: row });
        }
      }
    }

    // Find strong links in columns
    for (let col = 0; col < 9; col++) {
      if (!isNumberInColumn(grid, col, num)) {
        const positions = [];
        for (let row = 0; row < 9; row++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            positions.push({ row, col });
          }
        }
        if (positions.length === 2) {
          strongLinks.push({ type: 'col', positions, unit: col });
        }
      }
    }

    // Basic coloring elimination (simplified)
    for (let link of strongLinks) {
      const [pos1, pos2] = link.positions;

      // If both positions in the link can see the same cell, eliminate from that cell
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0 && candidates[row][col].includes(num)) {
            const cell = { row, col };
            if (seesCell(cell, pos1) && seesCell(cell, pos2) &&
                !(cell.row === pos1.row && cell.col === pos1.col) &&
                !(cell.row === pos2.row && cell.col === pos2.col)) {
              candidates[row][col] = candidates[row][col].filter(n => n !== num);
              changed = true;
            }
          }
        }
      }
    }
  }

  return changed;
}

// Helper function to check if two cells can "see" each other (same row, column, or box)
function seesCell(cell1, cell2) {
  // Same row
  if (cell1.row === cell2.row) return true;

  // Same column
  if (cell1.col === cell2.col) return true;

  // Same box
  const box1Row = Math.floor(cell1.row / 3);
  const box1Col = Math.floor(cell1.col / 3);
  const box2Row = Math.floor(cell2.row / 3);
  const box2Col = Math.floor(cell2.col / 3);

  return box1Row === box2Row && box1Col === box2Col;
}

module.exports = async function handler(req, res) {
  // Initialize database on first request
  try {
    await initPuzzleDatabase();
  } catch (error) {
    console.error('Puzzle database initialization failed:', error);
    return res.status(500).json({ error: 'Database initialization failed' });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { date, player, difficulty } = req.query;

        if (player && date && difficulty) {
          // Get specific game state
          const gameState = await getGameState(player, date, difficulty);
          return res.status(200).json(gameState);
        } else if (date) {
          // Get daily puzzles
          const puzzles = await getDailyPuzzles(date);
          return res.status(200).json(puzzles);
        } else {
          // Get today's puzzles
          const today = new Date().toISOString().split('T')[0];
          const puzzles = await getDailyPuzzles(today);
          return res.status(200).json(puzzles);
        }
      }

      case 'POST': {
        const { action, player, date, difficulty, state } = req.body;

        if (action === 'generate' && date) {
          // Generate new puzzles for specific date
          const puzzles = await generateDailyPuzzles(date);
          return res.status(200).json(puzzles);
        } else if (action === 'save' && player && date && difficulty && state) {
          // Save game state
          await saveGameState(player, date, difficulty, state);
          return res.status(200).json({ success: true });
        } else if (action === 'reset' && date) {
          // Reset puzzles, game states, and completion times for specific date
          await sql`DELETE FROM daily_puzzles WHERE date = ${date}`;
          await sql`DELETE FROM game_states WHERE date = ${date}`;
          await sql`DELETE FROM individual_games WHERE date = ${date}`;
          return res.status(200).json({
            success: true,
            message: `Reset completed for ${date} (puzzles, game states, and times cleared)`
          });
        } else {
          return res.status(400).json({ error: 'Invalid request parameters' });
        }
      }

      case 'DELETE': {
        const { date } = req.body;

        if (date) {
          // Delete puzzles, game states, and completion times for specific date
          await sql`DELETE FROM daily_puzzles WHERE date = ${date}`;
          await sql`DELETE FROM game_states WHERE date = ${date}`;
          await sql`DELETE FROM individual_games WHERE date = ${date}`;
          return res.status(200).json({
            success: true,
            message: `Deleted all data for ${date}`
          });
        } else {
          return res.status(400).json({ error: 'Date parameter required' });
        }
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Puzzle API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};