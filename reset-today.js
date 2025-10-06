// Reset today's puzzles - run this in the browser console
(async function() {
    const today = (() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    })();

    const players = ['faidao', 'filip'];
    const difficulties = ['easy', 'medium', 'hard'];

    console.log('Resetting all data for ' + today);

    try {
        // Delete completed games from database
        const deleteResponse = await fetch('/api/games?date=' + today, {
            method: 'DELETE'
        });

        if (deleteResponse.ok) {
            console.log('Deleted games from database');
        }

        // Delete all puzzle states for today
        const puzzleDeleteResponse = await fetch('/api/puzzles', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: today })
        });

        if (puzzleDeleteResponse.ok) {
            console.log('Deleted puzzle states from server');
        }

        // Clear localStorage
        players.forEach(player => {
            difficulties.forEach(difficulty => {
                localStorage.removeItem('completed_' + player + '_' + today + '_' + difficulty);
                localStorage.removeItem('sudoku_' + player + '_' + today + '_' + difficulty);
            });
        });
        console.log('Cleared localStorage');

        console.log('Complete reset done! Refreshing page...');
        setTimeout(() => location.reload(), 500);

    } catch (error) {
        console.error('Error during reset:', error);
    }
})();
