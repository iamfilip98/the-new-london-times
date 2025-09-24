#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

const https = require('https');

async function forceRefreshAllPuzzles() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`🔄 Force refreshing all puzzles for ${today}...`);

    try {
        // First, delete existing puzzles
        console.log('📤 Deleting existing puzzles...');
        await makeRequest('DELETE', { date: today });

        // Then force generate new ones
        console.log('🎲 Generating fresh puzzles...');
        const result = await makeRequest('POST', { action: 'generate', date: today });

        console.log('✅ Successfully refreshed all puzzles!');
        console.log(`📊 Easy: ${result.easy.puzzle.flat().filter(x => x === 0).length} empty cells`);
        console.log(`📊 Medium: ${result.medium.puzzle.flat().filter(x => x === 0).length} empty cells`);
        console.log(`📊 Hard: ${result.hard.puzzle.flat().filter(x => x === 0).length} empty cells`);

        console.log('\n🌐 Now do a hard refresh in your browser:');
        console.log('   - Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)');
        console.log('   - Or F12 → Right-click refresh → "Empty Cache and Hard Reload"');

        return true;
    } catch (error) {
        console.error('❌ Failed to refresh puzzles:', error.message);
        return false;
    }
}

function makeRequest(method, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);

        const options = {
            hostname: 'the-new-london-times.vercel.app',
            path: '/api/puzzles',
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || responseData}`));
                    }
                } catch (e) {
                    reject(new Error(`Invalid JSON response: ${responseData}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// Run if called directly
if (require.main === module) {
    forceRefreshAllPuzzles()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('❌ Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { forceRefreshAllPuzzles };