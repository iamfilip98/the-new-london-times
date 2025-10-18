#!/bin/bash

# Quick script to clear the database and regenerate puzzles
# Run this after: vercel login && vercel env pull .env.local

echo "═══════════════════════════════════════════════"
echo "CLEARING DATABASE AND REGENERATING PUZZLES"
echo "═══════════════════════════════════════════════"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    echo ""
    echo "Please run these commands first:"
    echo "  1. vercel login"
    echo "  2. vercel env pull .env.local"
    echo ""
    exit 1
fi

echo "✓ Found .env.local"
echo ""
echo "Running database cleanup script..."
echo ""

node direct_reset_puzzles.js

if [ $? -eq 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════"
    echo "✅ SUCCESS!"
    echo "═══════════════════════════════════════════════"
    echo ""
    echo "Next steps:"
    echo "  1. Refresh your browser"
    echo "  2. New solvable puzzles will auto-generate"
    echo "  3. Test the hint button!"
    echo ""
else
    echo ""
    echo "❌ Something went wrong. Check the error above."
    echo ""
fi
