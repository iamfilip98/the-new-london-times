import { sql } from '@vercel/postgres';

// Database initialization and schema creation
export async function initDatabase() {
  try {
    // Create entries table
    await sql`
      CREATE TABLE IF NOT EXISTS entries (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create achievements table
    await sql`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        achievement_id VARCHAR(255) NOT NULL,
        player VARCHAR(50) NOT NULL,
        unlocked_at TIMESTAMP NOT NULL,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(achievement_id, player, unlocked_at)
      )
    `;

    // Create streaks table
    await sql`
      CREATE TABLE IF NOT EXISTS streaks (
        id SERIAL PRIMARY KEY,
        player VARCHAR(50) UNIQUE NOT NULL,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create challenges table
    await sql`
      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        challenge_id VARCHAR(255) UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Initialize default streak records for both players
    await sql`
      INSERT INTO streaks (player, current_streak, best_streak)
      VALUES ('faidao', 0, 0), ('filip', 0, 0)
      ON CONFLICT (player) DO NOTHING
    `;

    // Create indexes for better query performance
    await sql`CREATE INDEX IF NOT EXISTS idx_entries_date ON entries (date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_challenges_created_at ON challenges (created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_achievements_unlocked_at ON achievements (unlocked_at DESC)`;

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Entries operations
export async function getAllEntries() {
  try {
    const result = await sql`
      SELECT date, data
      FROM entries
      ORDER BY date DESC
    `;

    return result.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      ...row.data
    }));
  } catch (error) {
    console.error('Failed to get entries:', error);
    throw error;
  }
}

export async function saveEntry(date, entryData) {
  try {
    await sql`
      INSERT INTO entries (date, data)
      VALUES (${date}, ${JSON.stringify(entryData)})
      ON CONFLICT (date)
      DO UPDATE SET
        data = ${JSON.stringify(entryData)},
        updated_at = NOW()
    `;

    return true;
  } catch (error) {
    console.error('Failed to save entry:', error);
    throw error;
  }
}

export async function deleteEntry(date) {
  try {
    await sql`DELETE FROM entries WHERE date = ${date}`;
    return true;
  } catch (error) {
    console.error('Failed to delete entry:', error);
    throw error;
  }
}

// Achievements operations
export async function getAllAchievements() {
  try {
    const result = await sql`
      SELECT achievement_id, player, unlocked_at, data
      FROM achievements
      ORDER BY unlocked_at DESC
    `;

    return result.rows.map(row => ({
      id: row.achievement_id,
      player: row.player,
      unlockedAt: row.unlocked_at.toISOString(),
      ...row.data
    }));
  } catch (error) {
    console.error('Failed to get achievements:', error);
    throw error;
  }
}

export async function saveAchievement(achievementId, player, unlockedAt, data = {}) {
  try {
    await sql`
      INSERT INTO achievements (achievement_id, player, unlocked_at, data)
      VALUES (${achievementId}, ${player}, ${unlockedAt}, ${JSON.stringify(data)})
      ON CONFLICT (achievement_id, player, unlocked_at) DO NOTHING
    `;

    return true;
  } catch (error) {
    console.error('Failed to save achievement:', error);
    throw error;
  }
}

// Streaks operations
export async function getStreaks() {
  try {
    const result = await sql`
      SELECT player, current_streak, best_streak
      FROM streaks
    `;

    const streaks = {};
    result.rows.forEach(row => {
      streaks[row.player] = {
        current: row.current_streak,
        best: row.best_streak
      };
    });

    return streaks;
  } catch (error) {
    console.error('Failed to get streaks:', error);
    throw error;
  }
}

export async function updateStreaks(streaksData) {
  try {
    for (const [player, data] of Object.entries(streaksData)) {
      await sql`
        UPDATE streaks
        SET
          current_streak = ${data.current},
          best_streak = ${data.best},
          updated_at = NOW()
        WHERE player = ${player}
      `;
    }

    return true;
  } catch (error) {
    console.error('Failed to update streaks:', error);
    throw error;
  }
}

// Challenges operations
export async function getAllChallenges() {
  try {
    const result = await sql`
      SELECT challenge_id, data
      FROM challenges
      ORDER BY created_at DESC
    `;

    return result.rows.map(row => ({
      id: row.challenge_id,
      ...row.data
    }));
  } catch (error) {
    console.error('Failed to get challenges:', error);
    throw error;
  }
}

export async function saveChallenge(challengeId, challengeData) {
  try {
    await sql`
      INSERT INTO challenges (challenge_id, data)
      VALUES (${challengeId}, ${JSON.stringify(challengeData)})
      ON CONFLICT (challenge_id)
      DO UPDATE SET
        data = ${JSON.stringify(challengeData)},
        updated_at = NOW()
    `;

    return true;
  } catch (error) {
    console.error('Failed to save challenge:', error);
    throw error;
  }
}

// Migration helper - import localStorage data
export async function migrateLocalStorageData(localData) {
  try {
    console.log('Starting data migration...');

    // Migrate entries
    if (localData.entries && localData.entries.length > 0) {
      for (const entry of localData.entries) {
        await saveEntry(entry.date, {
          faidao: entry.faidao,
          filip: entry.filip
        });
      }
      console.log(`Migrated ${localData.entries.length} entries`);
    }

    // Migrate achievements
    if (localData.achievements && localData.achievements.length > 0) {
      for (const achievement of localData.achievements) {
        await saveAchievement(
          achievement.id,
          achievement.player,
          achievement.unlockedAt,
          achievement
        );
      }
      console.log(`Migrated ${localData.achievements.length} achievements`);
    }

    // Migrate streaks
    if (localData.streaks) {
      await updateStreaks(localData.streaks);
      console.log('Migrated streaks data');
    }

    // Migrate challenges
    if (localData.challenges && localData.challenges.length > 0) {
      for (const challenge of localData.challenges) {
        await saveChallenge(challenge.id, challenge);
      }
      console.log(`Migrated ${localData.challenges.length} challenges`);
    }

    console.log('Data migration completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}