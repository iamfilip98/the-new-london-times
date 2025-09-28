// Test script to verify deterministic puzzle generation
const fs = require('fs');
const path = require('path');

// Import the puzzles module
const puzzleApi = require('./api/puzzles.js');

async function testDeterministicPuzzles() {
    console.log('🧪 Testing deterministic puzzle generation...\n');

    const testDate = '2025-01-01';

    try {
        // Generate puzzles multiple times for the same date
        console.log(`📅 Testing puzzles for date: ${testDate}\n`);

        // First generation
        console.log('🔄 First generation...');
        const response1 = await new Promise((resolve, reject) => {
            const req = { method: 'POST', body: { action: 'generate', date: testDate } };
            const res = {
                status: (code) => ({ json: (data) => resolve({ status: code, data }) }),
                setHeader: () => {},
                end: () => {}
            };

            puzzleApi(req, res).catch(reject);
        });

        if (response1.status !== 200) {
            throw new Error(`First generation failed with status ${response1.status}`);
        }

        // Second generation
        console.log('🔄 Second generation...');
        const response2 = await new Promise((resolve, reject) => {
            const req = { method: 'POST', body: { action: 'generate', date: testDate } };
            const res = {
                status: (code) => ({ json: (data) => resolve({ status: code, data }) }),
                setHeader: () => {},
                end: () => {}
            };

            puzzleApi(req, res).catch(reject);
        });

        if (response2.status !== 200) {
            throw new Error(`Second generation failed with status ${response2.status}`);
        }

        // Compare results
        const puzzles1 = response1.data;
        const puzzles2 = response2.data;

        console.log('\n📊 Comparing results:');

        // Check if puzzles are identical
        const difficulties = ['easy', 'medium', 'hard'];
        let allMatch = true;

        for (const difficulty of difficulties) {
            const puzzle1 = JSON.stringify(puzzles1[difficulty].puzzle);
            const puzzle2 = JSON.stringify(puzzles2[difficulty].puzzle);
            const solution1 = JSON.stringify(puzzles1[difficulty].solution);
            const solution2 = JSON.stringify(puzzles2[difficulty].solution);

            const puzzleMatch = puzzle1 === puzzle2;
            const solutionMatch = solution1 === solution2;

            console.log(`  ${difficulty.toUpperCase()}:`);
            console.log(`    Puzzle match: ${puzzleMatch ? '✅' : '❌'}`);
            console.log(`    Solution match: ${solutionMatch ? '✅' : '❌'}`);

            if (!puzzleMatch || !solutionMatch) {
                allMatch = false;
            }
        }

        console.log(`\n🎯 Overall result: ${allMatch ? '✅ PASS - Puzzles are deterministic!' : '❌ FAIL - Puzzles are not deterministic!'}`);

        if (allMatch) {
            console.log('\n🎉 Success! Both users will now get identical puzzles for the same date.');
        } else {
            console.log('\n⚠️  Warning: Puzzle generation is still non-deterministic.');
        }

        return allMatch;

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

// Run the test
if (require.main === module) {
    testDeterministicPuzzles()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('Test error:', error);
            process.exit(1);
        });
}

module.exports = { testDeterministicPuzzles };