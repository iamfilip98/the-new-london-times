# How to Clear the Database - Quick Guide

## Why You Need to Do This

The old puzzles in your database were generated with a bug that made them unsolvable (multiple solutions or no solutions). The code is now fixed, but old puzzles need to be deleted.

## Option 1: Via Vercel Dashboard (Easiest - 2 minutes)

1. **Go to:** https://vercel.com/dashboard
2. **Click** on your project: `the-new-london-times`
3. **Click** "Storage" tab
4. **Click** on your Postgres database
5. **Click** "Query" or "Data" tab
6. **Run this SQL:**

```sql
-- Clear today's puzzles and data
DELETE FROM daily_puzzles WHERE date = CURRENT_DATE;
DELETE FROM game_states WHERE date = CURRENT_DATE;
DELETE FROM individual_games WHERE date = CURRENT_DATE;
```

7. **Done!** Refresh your app and new solvable puzzles will generate automatically.

### For a Complete Fresh Start

If you want to clear ALL historical puzzles:

```sql
DELETE FROM daily_puzzles;
DELETE FROM game_states;
DELETE FROM individual_games;
```

## Option 2: Via Vercel CLI (5 minutes)

1. Open Terminal in this directory
2. Run these commands:

```bash
# Login to Vercel
vercel login

# Pull environment variables
vercel env pull .env.local

# Run the cleanup script
node direct_reset_puzzles.js
```

## Option 3: Via API Endpoint (30 seconds)

Once your changes are deployed to Vercel:

```bash
# Get your deployment URL from Vercel dashboard
# Replace YOUR_APP_URL with your actual Vercel URL

curl -X POST https://YOUR_APP_URL.vercel.app/api/puzzles \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reset",
    "date": "2025-10-18"
  }'
```

Or use a browser and paste this in the console:

```javascript
fetch('/api/puzzles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'reset',
    date: new Date().toISOString().split('T')[0]
  })
})
.then(r => r.json())
.then(console.log)
```

## Verification

After clearing the database:

1. ✅ Refresh your app
2. ✅ New puzzles will auto-generate (watch the browser console for generation logs)
3. ✅ Click the "Hint" button - it should work now!
4. ✅ Try solving a puzzle - it will be logically solvable!

## What Changed

- **Before:** Puzzles had multiple solutions → unsolvable → hints broken
- **After:** Every puzzle has EXACTLY ONE unique solution → solvable → hints work

## Need Help?

The fix is in commit `7311edd` - the code is already pushed and will auto-deploy on Vercel.

If you have any issues, check:
1. Vercel deployment completed successfully
2. Database was actually cleared (run the SQL again to be sure)
3. Browser cache is cleared (hard refresh: Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
