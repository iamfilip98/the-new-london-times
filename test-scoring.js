/**
 * Test script for the new scoring system
 */

// Mock the scoring function
function calculateFinalScore(difficulty, timer, errors, hints) {
    const baseScores = {
        easy: 1000,
        medium: 2000,
        hard: 4000
    };

    const targetTimes = {
        easy: 240,    // 4 minutes
        medium: 330,  // 5.5 minutes
        hard: 540     // 9 minutes
    };

    // TIME SCORING (linear scaling)
    const baseScore = baseScores[difficulty];
    const targetTime = targetTimes[difficulty];
    const timeRatio = timer / targetTime;

    let score;
    if (timeRatio <= 1.0) {
        // Faster than target: scale from 2x down to 1x
        score = baseScore * (2 - timeRatio);
    } else if (timeRatio <= 2.0) {
        // Slower than target: scale from 1x down to 0.5x
        score = baseScore * (1.5 - (timeRatio * 0.5));
    } else {
        // Very slow: minimum 0.25x base score
        score = baseScore * 0.25;
    }

    // ERROR PENALTY (harsh - 12% per error, max 60%)
    const errorPenalty = errors * 0.12;
    score *= (1 - Math.min(errorPenalty, 0.60));

    // HINT PENALTY (gentle - encouraging use when stuck)
    let hintPenalty = 0;
    if (hints === 1) hintPenalty = 0.03;      // 3%
    else if (hints === 2) hintPenalty = 0.06; // 6%
    else if (hints === 3) hintPenalty = 0.10; // 10%
    else if (hints === 4) hintPenalty = 0.15; // 15%
    else if (hints >= 5) hintPenalty = 0.20;  // 20% cap

    score *= (1 - hintPenalty);

    return Math.round(score);
}

// Test cases from requirements
console.log("=== Testing Required Test Cases ===\n");

// Test 1: Easy 4:00, 0E, 0H should give exactly 1000 points
const test1 = calculateFinalScore('easy', 240, 0, 0);
console.log(`Test 1 - Easy 4:00, 0E, 0H: ${test1} points (expected: 1000)`);
console.log(`  ${test1 === 1000 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 2: Medium 5:30, 0E, 0H should give exactly 2000 points
const test2 = calculateFinalScore('medium', 330, 0, 0);
console.log(`Test 2 - Medium 5:30, 0E, 0H: ${test2} points (expected: 2000)`);
console.log(`  ${test2 === 2000 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 3: Hard 9:00, 0E, 0H should give exactly 4000 points
const test3 = calculateFinalScore('hard', 540, 0, 0);
console.log(`Test 3 - Hard 9:00, 0E, 0H: ${test3} points (expected: 4000)`);
console.log(`  ${test3 === 4000 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 4: 1 error should reduce score by 12%
const test4 = calculateFinalScore('easy', 240, 1, 0);
const expectedTest4 = Math.round(1000 * 0.88); // 1000 - 12%
console.log(`Test 4 - Easy 4:00, 1E, 0H: ${test4} points (expected: ${expectedTest4})`);
console.log(`  ${test4 === expectedTest4 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 5: 3 hints should reduce score by 10%
const test5 = calculateFinalScore('easy', 240, 0, 3);
const expectedTest5 = Math.round(1000 * 0.90); // 1000 - 10%
console.log(`Test 5 - Easy 4:00, 0E, 3H: ${test5} points (expected: ${expectedTest5})`);
console.log(`  ${test5 === expectedTest5 ? '✓ PASS' : '✗ FAIL'}\n`);

console.log("=== Additional Range Tests ===\n");

// Test fastest possible scores (instant completion)
const fastEasy = calculateFinalScore('easy', 0, 0, 0);
const fastMedium = calculateFinalScore('medium', 0, 0, 0);
const fastHard = calculateFinalScore('hard', 0, 0, 0);
console.log(`Fastest Easy: ${fastEasy} points (expected: 2000)`);
console.log(`Fastest Medium: ${fastMedium} points (expected: 4000)`);
console.log(`Fastest Hard: ${fastHard} points (expected: 8000)\n`);

// Test slowest possible scores (very slow)
const slowEasy = calculateFinalScore('easy', 1000, 0, 0); // Way over target
const slowMedium = calculateFinalScore('medium', 1000, 0, 0);
const slowHard = calculateFinalScore('hard', 1500, 0, 0);
console.log(`Very Slow Easy: ${slowEasy} points (expected: 250 - min 0.25x)`);
console.log(`Very Slow Medium: ${slowMedium} points (expected: 500 - min 0.25x)`);
console.log(`Very Slow Hard: ${slowHard} points (expected: 1000 - min 0.25x)\n`);

// Test maximum penalties
const maxPenalty = calculateFinalScore('easy', 240, 5, 5); // 5 errors (60% max) + 5 hints (20%)
const baseBeforePenalties = 1000;
const afterErrorPenalty = baseBeforePenalties * 0.40; // 60% penalty max
const afterHintPenalty = afterErrorPenalty * 0.80; // 20% hint penalty
console.log(`Max Penalties (Easy 4:00, 5E, 5H): ${maxPenalty} points`);
console.log(`  Expected: ~${Math.round(afterHintPenalty)} (base * 0.4 * 0.8)\n`);

console.log("=== Test Winner Bonus Functions ===\n");

function applyWinnerBonuses(player1Scores, player2Scores) {
    const difficulties = ['easy', 'medium', 'hard'];
    const result1 = { ...player1Scores };
    const result2 = { ...player2Scores };

    difficulties.forEach(diff => {
        if (result1[diff] && result2[diff]) {
            if (result1[diff] > result2[diff]) {
                result1[diff] = Math.round(result1[diff] * 1.3);
            } else if (result2[diff] > result1[diff]) {
                result2[diff] = Math.round(result2[diff] * 1.3);
            }
        }
    });

    return { player1: result1, player2: result2 };
}

function calculateDailyWinner(player1Scores, player2Scores) {
    const bonusedScores = applyWinnerBonuses(player1Scores, player2Scores);
    const p1Total = (bonusedScores.player1.easy || 0) + (bonusedScores.player1.medium || 0) + (bonusedScores.player1.hard || 0);
    const p2Total = (bonusedScores.player2.easy || 0) + (bonusedScores.player2.medium || 0) + (bonusedScores.player2.hard || 0);

    return {
        player1Total: p1Total,
        player2Total: p2Total,
        winner: p1Total > p2Total ? 'player1' : (p2Total > p1Total ? 'player2' : 'tie')
    };
}

// Test winner bonus
const p1 = { easy: 1000, medium: 2000, hard: 3000 };
const p2 = { easy: 900, medium: 2200, hard: 3000 };

const bonused = applyWinnerBonuses(p1, p2);
console.log("Player 1 scores:", p1);
console.log("Player 2 scores:", p2);
console.log("\nAfter 30% winner bonuses:");
console.log("Player 1 bonused:", bonused.player1);
console.log("  Easy: 1000 -> 1300 (won)");
console.log("  Medium: 2000 (lost, no bonus)");
console.log("  Hard: 3000 (tied, no bonus)");
console.log("Player 2 bonused:", bonused.player2);
console.log("  Easy: 900 (lost, no bonus)");
console.log("  Medium: 2200 -> 2860 (won)");
console.log("  Hard: 3000 (tied, no bonus)");

const winner = calculateDailyWinner(p1, p2);
console.log("\nDaily winner calculation:");
console.log(`Player 1 total: ${winner.player1Total}`);
console.log(`Player 2 total: ${winner.player2Total}`);
console.log(`Winner: ${winner.winner}\n`);

console.log("=== All Tests Complete ===");
