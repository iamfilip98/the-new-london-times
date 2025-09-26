// Browser console script to force refresh all puzzles
// Copy and paste this entire script into your browser console

async function forceRefreshPuzzlesInBrowser() {
    const today = new Date().toISOString().split('T')[0];
    //console.log(`🔄 Force refreshing all puzzles for ${today}...`);

    try {
        // First, delete existing puzzles
        //console.log('📤 Deleting existing puzzles...');
        const deleteResponse = await fetch('/api/puzzles', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date: today })
        });

        if (!deleteResponse.ok) {
            console.warn('Delete failed, trying POST reset method...');
            await fetch('/api/puzzles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'reset', date: today })
            });
        }

        // Then force generate new ones
        //console.log('🎲 Generating fresh puzzles...');
        const generateResponse = await fetch('/api/puzzles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'generate', date: today })
        });

        if (!generateResponse.ok) {
            throw new Error(`Generation failed: ${generateResponse.status}`);
        }

        const result = await generateResponse.json();

        //console.log('✅ Successfully refreshed all puzzles!');
        //console.log(`📊 Easy: ${result.easy.puzzle.flat().filter(x => x === 0).length} empty cells`);
        //console.log(`📊 Medium: ${result.medium.puzzle.flat().filter(x => x === 0).length} empty cells`);
        //console.log(`📊 Hard: ${result.hard.puzzle.flat().filter(x => x === 0).length} empty cells`);

        // Clear localStorage too
        //console.log('🧹 Clearing localStorage...');
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.includes(today) ||
                key.startsWith('sudoku_') ||
                key.startsWith('completed_') ||
                key.includes('partial_entry_')
            )) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        //console.log(`🗑️ Cleared ${keysToRemove.length} localStorage entries`);

        //console.log('🔄 Now refreshing the page to load fresh puzzles...');

        // Auto-refresh the page after a short delay
        setTimeout(() => {
            window.location.reload(true);
        }, 1000);

        return true;
    } catch (error) {
        console.error('❌ Failed to refresh puzzles:', error);
        return false;
    }
}

// Run the function immediately
forceRefreshPuzzlesInBrowser();