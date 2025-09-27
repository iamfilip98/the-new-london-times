// CHECK ALL ENTRIES - See what dates have data

(async function() {
    console.log('🔍 CHECKING ALL ENTRIES IN DATABASE...');

    try {
        // Get all entries to see what dates exist
        const response = await fetch('/api/entries', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const entries = await response.json();
            console.log('📊 Total entries found:', entries.length);

            if (entries.length > 0) {
                console.log('📅 Entries by date:');
                entries.forEach((entry, index) => {
                    console.log(`${index + 1}. Date: ${entry.date}`);
                    console.log('   Data:', entry.data);
                    console.log('---');
                });
            } else {
                console.log('✅ No entries found in database');
            }
        } else {
            console.log('❌ Could not fetch entries:', response.status);
        }
    } catch (e) {
        console.log('❌ Error fetching entries:', e.message);
    }

    console.log('🎯 Next step: Delete ALL entries found above');
})();