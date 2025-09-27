// DELETE ALL ENTRIES - Clear every single entry in the database

(async function() {
    console.log('💥 DELETING ALL ENTRIES FROM DATABASE...');

    try {
        // First, get all entries to see what we're deleting
        const getResponse = await fetch('/api/entries', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (getResponse.ok) {
            const entries = await getResponse.json();
            console.log(`📊 Found ${entries.length} entries to delete`);

            if (entries.length === 0) {
                console.log('✅ No entries to delete');
                return;
            }

            // Delete each entry by date
            for (const entry of entries) {
                console.log(`🗑️ Deleting entry for date: ${entry.date}`);

                try {
                    const deleteResponse = await fetch(`/api/entries?date=${entry.date}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (deleteResponse.ok) {
                        console.log(`✅ Deleted entry for ${entry.date}`);
                    } else {
                        console.log(`❌ Failed to delete entry for ${entry.date}: ${deleteResponse.status}`);
                    }
                } catch (e) {
                    console.log(`❌ Error deleting entry for ${entry.date}:`, e.message);
                }
            }

            console.log('🎉 ALL ENTRIES DELETION COMPLETED');

        } else {
            console.log('❌ Could not fetch entries:', getResponse.status);
        }
    } catch (e) {
        console.log('❌ Error in deletion process:', e.message);
    }

    console.log('🔄 Manually refresh the page to see results');
})();