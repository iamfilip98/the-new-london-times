// Consolidated admin endpoint for Vercel Hobby plan (max 12 functions)
import { sql } from '@vercel/postgres';
import { generatePuzzle, solvePuzzle } from '../lib/sudoku-generator.js';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Verify admin key
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_KEY;

  if (!adminKey || adminKey !== expectedKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'clear-all':
        await handleClearAll(req, res);
        break;
      case 'clear-old-puzzles':
        await handleClearOldPuzzles(req, res);
        break;
      case 'generate-fallback':
        await handleGenerateFallback(req, res);
        break;
      default:
        res.status(400).json({
          error: 'Invalid action',
          validActions: ['clear-all', 'clear-old-puzzles', 'generate-fallback']
        });
    }
  } catch (error) {
    console.error('Admin action error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Clear all data (from clear-all.js)
async function handleClearAll(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Delete all data
    await sql`DELETE FROM individual_games`;
    await sql`DELETE FROM game_states`;
    await sql`DELETE FROM entries`;
    await sql`DELETE FROM achievements`;
    await sql`DELETE FROM challenges`;

    // Reset streaks
    await sql`UPDATE streaks SET current_streak = 0, updated_at = NOW()`;

    console.log('All data cleared successfully');
    res.status(200).json({
      success: true,
      message: 'All data cleared successfully',
      cleared: ['individual_games', 'game_states', 'entries', 'achievements', 'challenges', 'streaks']
    });
  } catch (error) {
    console.error('Failed to clear data:', error);
    res.status(500).json({ error: 'Failed to clear data', details: error.message });
  }
}

// Clear old puzzles (from clear-old-puzzles.js)
async function handleClearOldPuzzles(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const daysToKeep = parseInt(req.query.days) || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await sql`
      DELETE FROM daily_puzzles
      WHERE date < ${cutoffDate.toISOString().split('T')[0]}
    `;

    console.log(`Cleared puzzles older than ${daysToKeep} days`);
    res.status(200).json({
      success: true,
      message: `Cleared puzzles older than ${daysToKeep} days`,
      deletedCount: result.rowCount
    });
  } catch (error) {
    console.error('Failed to clear old puzzles:', error);
    res.status(500).json({ error: 'Failed to clear old puzzles', details: error.message });
  }
}

// Generate fallback puzzles (from generate-fallback-puzzles.js)
async function handleGenerateFallback(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const count = parseInt(req.query.count) || 10;
    const difficulty = req.query.difficulty || 'all';
    const difficulties = difficulty === 'all' ? ['easy', 'medium', 'hard'] : [difficulty];

    const generated = [];

    for (const diff of difficulties) {
      for (let i = 0; i < count; i++) {
        const seed = Math.random();
        const puzzle = generatePuzzle(diff, seed);
        const solution = solvePuzzle(puzzle);

        if (solution) {
          const qualityScore = calculateQualityScore(puzzle, diff);

          await sql`
            INSERT INTO fallback_puzzles (difficulty, puzzle, solution, quality_score, times_used, last_used)
            VALUES (${diff}, ${JSON.stringify(puzzle)}, ${JSON.stringify(solution)}, ${qualityScore}, 0, NULL)
          `;

          generated.push({ difficulty: diff, quality: qualityScore });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated ${generated.length} fallback puzzles`,
      puzzles: generated
    });
  } catch (error) {
    console.error('Failed to generate fallback puzzles:', error);
    res.status(500).json({ error: 'Failed to generate fallback puzzles', details: error.message });
  }
}

function calculateQualityScore(puzzle, difficulty) {
  let score = 100;
  const filledCells = puzzle.flat().filter(cell => cell !== 0).length;

  const targetClues = { easy: 42, medium: 28, hard: 25 };
  const target = targetClues[difficulty];
  const deviation = Math.abs(filledCells - target);
  score -= deviation * 2;

  return Math.max(0, Math.min(100, score));
}
