#!/usr/bin/env node

/**
 * Analyze scoring data since the last scoring update (Oct 7, 2025)
 * Retrieves comprehensive statistics to evaluate scoring system effectiveness
 */

require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_PRISMA_URL,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  },
  max: 2,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 10000,
  maxUses: 100,
  acquireTimeoutMillis: 5000
});

async function analyzeScoring() {
  try {
    console.log('=== SCORING SYSTEM ANALYSIS ===');
    console.log('Data from: October 7, 2025 to present\n');

    // First, identify outliers (likely testing games)
    console.log('🔍 IDENTIFYING OUTLIERS (Testing Games)\n');
    const outliers = await pool.query(`
      SELECT
        difficulty,
        score,
        ROUND(time / 60.0, 1) as minutes,
        hints,
        errors,
        player,
        TO_CHAR(completed_at, 'YYYY-MM-DD') as date,
        CASE
          WHEN hints > 10 THEN 'Excessive hints (>10)'
          WHEN time > CASE
            WHEN difficulty = 'easy' THEN 630
            WHEN difficulty = 'medium' THEN 540
            WHEN difficulty = 'hard' THEN 1305
          END THEN 'Excessive time (>3x target)'
          WHEN hints > 5 AND errors > 2 THEN 'High hints + errors'
        END as outlier_reason
      FROM individual_games
      WHERE completed_at >= '2025-10-07'
        AND (
          hints > 10
          OR time > CASE
            WHEN difficulty = 'easy' THEN 630
            WHEN difficulty = 'medium' THEN 540
            WHEN difficulty = 'hard' THEN 1305
          END
          OR (hints > 5 AND errors > 2)
        )
      ORDER BY hints DESC, time DESC
    `);

    console.table(outliers.rows);
    console.log(`Found ${outliers.rows.length} outlier games to exclude from analysis\n`);

    // Create a common WHERE clause for filtering outliers
    const cleanDataFilter = `
      completed_at >= '2025-10-07'
      AND hints <= 10
      AND time <= CASE
        WHEN difficulty = 'easy' THEN 630
        WHEN difficulty = 'medium' THEN 540
        WHEN difficulty = 'hard' THEN 1305
      END
      AND NOT (hints > 5 AND errors > 2)
    `;

    // 1. Overall statistics by difficulty (CLEAN DATA ONLY)
    console.log('📊 OVERALL STATISTICS BY DIFFICULTY (Clean Data)\n');
    const overallStats = await pool.query(`
      SELECT
        difficulty,
        COUNT(*) as total_games,
        ROUND(AVG(time)) as avg_time_sec,
        ROUND(AVG(time) / 60.0, 1) as avg_time_min,
        ROUND(AVG(score)) as avg_score,
        ROUND(AVG(hints), 2) as avg_hints,
        ROUND(AVG(errors), 2) as avg_errors,
        MIN(time) as fastest_sec,
        MAX(time) as slowest_sec,
        MIN(score) as min_score,
        MAX(score) as max_score,
        ROUND(STDDEV(score)) as score_stddev,
        ROUND(STDDEV(time)) as time_stddev
      FROM individual_games
      WHERE ${cleanDataFilter}
        AND score IS NOT NULL
        AND time IS NOT NULL
      GROUP BY difficulty
      ORDER BY
        CASE difficulty
          WHEN 'easy' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'hard' THEN 3
        END
    `);

    console.table(overallStats.rows);

    // 2. Hint usage breakdown
    console.log('\n💡 HINT USAGE BREAKDOWN (Clean Data)\n');
    const hintStats = await pool.query(`
      SELECT
        difficulty,
        COUNT(*) as games,
        COUNT(*) FILTER (WHERE hints = 0) as zero_hints,
        COUNT(*) FILTER (WHERE hints BETWEEN 1 AND 2) as light_hints,
        COUNT(*) FILTER (WHERE hints BETWEEN 3 AND 5) as moderate_hints,
        COUNT(*) FILTER (WHERE hints > 5) as heavy_hints,
        ROUND(AVG(hints), 2) as avg_hints,
        MAX(hints) as max_hints
      FROM individual_games
      WHERE ${cleanDataFilter}
      GROUP BY difficulty
      ORDER BY
        CASE difficulty
          WHEN 'easy' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'hard' THEN 3
        END
    `);

    console.table(hintStats.rows);

    // 3. Error patterns
    console.log('\n❌ ERROR PATTERNS (Clean Data)\n');
    const errorStats = await pool.query(`
      SELECT
        difficulty,
        COUNT(*) as games,
        COUNT(*) FILTER (WHERE errors = 0) as perfect_games,
        COUNT(*) FILTER (WHERE errors BETWEEN 1 AND 2) as few_errors,
        COUNT(*) FILTER (WHERE errors BETWEEN 3 AND 5) as moderate_errors,
        COUNT(*) FILTER (WHERE errors > 5) as many_errors,
        ROUND(AVG(errors), 2) as avg_errors,
        MAX(errors) as max_errors
      FROM individual_games
      WHERE ${cleanDataFilter}
      GROUP BY difficulty
      ORDER BY
        CASE difficulty
          WHEN 'easy' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'hard' THEN 3
        END
    `);

    console.table(errorStats.rows);

    // 4. Time distribution vs target times
    console.log('\n⏱️  TIME DISTRIBUTION VS TARGETS (Clean Data)\n');
    console.log('Target Times: Easy=3.5min, Medium=3.0min, Hard=7.25min\n');
    const timeDistribution = await pool.query(`
      SELECT
        difficulty,
        COUNT(*) as games,
        COUNT(*) FILTER (
          WHERE time < CASE
            WHEN difficulty = 'easy' THEN 210
            WHEN difficulty = 'medium' THEN 180
            WHEN difficulty = 'hard' THEN 435
          END
        ) as faster_than_target,
        COUNT(*) FILTER (
          WHERE time >= CASE
            WHEN difficulty = 'easy' THEN 210
            WHEN difficulty = 'medium' THEN 180
            WHEN difficulty = 'hard' THEN 435
          END
          AND time < CASE
            WHEN difficulty = 'easy' THEN 420
            WHEN difficulty = 'medium' THEN 360
            WHEN difficulty = 'hard' THEN 870
          END
        ) as within_2x_target,
        COUNT(*) FILTER (
          WHERE time >= CASE
            WHEN difficulty = 'easy' THEN 420
            WHEN difficulty = 'medium' THEN 360
            WHEN difficulty = 'hard' THEN 870
          END
        ) as beyond_2x_target,
        ROUND(AVG(time) / 60.0, 2) as avg_minutes,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time) / 60.0 as median_minutes
      FROM individual_games
      WHERE ${cleanDataFilter}
        AND time IS NOT NULL
      GROUP BY difficulty
      ORDER BY
        CASE difficulty
          WHEN 'easy' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'hard' THEN 3
        END
    `);

    console.table(timeDistribution.rows);

    // 5. Score distribution
    console.log('\n🎯 SCORE DISTRIBUTION (Clean Data)\n');
    const scoreDistribution = await pool.query(`
      SELECT
        difficulty,
        COUNT(*) as games,
        COUNT(*) FILTER (
          WHERE score >= CASE
            WHEN difficulty = 'easy' THEN 1500
            WHEN difficulty = 'medium' THEN 2000
            WHEN difficulty = 'hard' THEN 7000
          END
        ) as high_scores,
        COUNT(*) FILTER (
          WHERE score >= CASE
            WHEN difficulty = 'easy' THEN 1000
            WHEN difficulty = 'medium' THEN 1500
            WHEN difficulty = 'hard' THEN 5000
          END
          AND score < CASE
            WHEN difficulty = 'easy' THEN 1500
            WHEN difficulty = 'medium' THEN 2000
            WHEN difficulty = 'hard' THEN 7000
          END
        ) as medium_scores,
        COUNT(*) FILTER (
          WHERE score < CASE
            WHEN difficulty = 'easy' THEN 1000
            WHEN difficulty = 'medium' THEN 1500
            WHEN difficulty = 'hard' THEN 5000
          END
        ) as low_scores,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY score) as q1_score,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY score) as median_score,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY score) as q3_score
      FROM individual_games
      WHERE ${cleanDataFilter}
        AND score IS NOT NULL
      GROUP BY difficulty
      ORDER BY
        CASE difficulty
          WHEN 'easy' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'hard' THEN 3
        END
    `);

    console.table(scoreDistribution.rows);

    // 6. Correlation between hints/errors and score
    console.log('\n🔗 CORRELATION ANALYSIS (Clean Data)\n');
    const correlationData = await pool.query(`
      SELECT
        difficulty,
        ROUND(CORR(hints, score)::numeric, 3) as hint_score_correlation,
        ROUND(CORR(errors, score)::numeric, 3) as error_score_correlation,
        ROUND(CORR(time, score)::numeric, 3) as time_score_correlation
      FROM individual_games
      WHERE ${cleanDataFilter}
        AND score IS NOT NULL
        AND time IS NOT NULL
      GROUP BY difficulty
      ORDER BY
        CASE difficulty
          WHEN 'easy' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'hard' THEN 3
        END
    `);

    console.table(correlationData.rows);
    console.log('Note: -1 = strong negative correlation, 0 = no correlation, 1 = strong positive correlation\n');

    // 7. Best and worst scores analysis
    console.log('\n🏆 TOP 5 SCORES PER DIFFICULTY (Clean Data)\n');
    const topScores = await pool.query(`
      WITH ranked_scores AS (
        SELECT
          difficulty,
          score,
          ROUND(time / 60.0, 1) as minutes,
          hints,
          errors,
          player,
          TO_CHAR(completed_at, 'YYYY-MM-DD') as date,
          ROW_NUMBER() OVER (PARTITION BY difficulty ORDER BY score DESC) as rank
        FROM individual_games
        WHERE ${cleanDataFilter}
          AND score IS NOT NULL
      )
      SELECT difficulty, score, minutes, hints, errors, player, date
      FROM ranked_scores
      WHERE rank <= 5
      ORDER BY difficulty, rank
    `);

    console.table(topScores.rows);

    // 8. Sample of low scores to understand patterns
    console.log('\n📉 BOTTOM 5 SCORES PER DIFFICULTY (Clean Data)\n');
    const lowScores = await pool.query(`
      WITH ranked_scores AS (
        SELECT
          difficulty,
          score,
          ROUND(time / 60.0, 1) as minutes,
          hints,
          errors,
          player,
          TO_CHAR(completed_at, 'YYYY-MM-DD') as date,
          ROW_NUMBER() OVER (PARTITION BY difficulty ORDER BY score ASC) as rank
        FROM individual_games
        WHERE ${cleanDataFilter}
          AND score IS NOT NULL
      )
      SELECT difficulty, score, minutes, hints, errors, player, date
      FROM ranked_scores
      WHERE rank <= 5
      ORDER BY difficulty, rank
    `);

    console.table(lowScores.rows);

    // 9. Daily patterns
    console.log('\n📅 DAILY AVERAGE SCORES\n');
    const dailyStats = await pool.query(`
      SELECT
        difficulty,
        TO_CHAR(completed_at, 'YYYY-MM-DD') as date,
        COUNT(*) as games,
        ROUND(AVG(score)) as avg_score,
        ROUND(AVG(time) / 60.0, 1) as avg_minutes,
        ROUND(AVG(hints), 2) as avg_hints,
        ROUND(AVG(errors), 2) as avg_errors
      FROM individual_games
      WHERE completed_at >= '2025-10-07'
        AND score IS NOT NULL
      GROUP BY difficulty, TO_CHAR(completed_at, 'YYYY-MM-DD')
      ORDER BY date DESC, difficulty
      LIMIT 30
    `);

    console.table(dailyStats.rows);

  } catch (error) {
    console.error('Error analyzing scoring data:', error);
  } finally {
    await pool.end();
  }
}

analyzeScoring();
