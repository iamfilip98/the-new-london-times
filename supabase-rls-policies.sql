-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- The New London Times - Sudoku Game
-- =====================================================
-- Run this script in Supabase SQL Editor to secure your tables
--
-- Access Pattern Summary:
-- - Most tables: Public READ (for leaderboards), restricted WRITE
-- - game_states: Private per-player (stores in-progress games)
-- - daily_puzzles/fallback_puzzles: Read-only for users
-- =====================================================

-- =====================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE fallback_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_ratings ENABLE ROW LEVEL SECURITY;

-- Only enable these if the tables exist and are in use:
-- ALTER TABLE sudoku_games ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_completions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: DROP EXISTING POLICIES (if re-running)
-- =====================================================
-- Uncomment these if you need to re-run the script

-- DROP POLICY IF EXISTS "users_public_read" ON users;
-- DROP POLICY IF EXISTS "individual_games_public_read" ON individual_games;
-- DROP POLICY IF EXISTS "individual_games_service_insert" ON individual_games;
-- DROP POLICY IF EXISTS "individual_games_service_update" ON individual_games;
-- ... etc

-- =====================================================
-- STEP 3: CREATE POLICIES
-- =====================================================

-- -----------------------------------------------------
-- USERS TABLE
-- Public read (for leaderboards), no public write
-- -----------------------------------------------------
CREATE POLICY "users_public_read"
  ON users FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies = only service role can write

-- -----------------------------------------------------
-- INDIVIDUAL_GAMES TABLE
-- Public read (leaderboards), service role writes
-- -----------------------------------------------------
CREATE POLICY "individual_games_public_read"
  ON individual_games FOR SELECT
  USING (true);

-- Service role bypass for INSERT/UPDATE (your API routes use service role)
-- No anon INSERT/UPDATE/DELETE = secure

-- -----------------------------------------------------
-- DAILY_PUZZLES TABLE
-- Public read (everyone needs puzzles), service role writes
-- -----------------------------------------------------
CREATE POLICY "daily_puzzles_public_read"
  ON daily_puzzles FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE for anon = only service role can manage puzzles

-- -----------------------------------------------------
-- GAME_STATES TABLE
-- This contains in-progress games - could be semi-private
-- For now: public read (allows viewing others' progress)
-- If you want private: change USING to (player = current_setting('request.jwt.claims')::json->>'username')
-- -----------------------------------------------------
CREATE POLICY "game_states_public_read"
  ON game_states FOR SELECT
  USING (true);

-- Service role handles writes via API routes

-- -----------------------------------------------------
-- FALLBACK_PUZZLES TABLE
-- Public read (emergency puzzles), service role writes
-- -----------------------------------------------------
CREATE POLICY "fallback_puzzles_public_read"
  ON fallback_puzzles FOR SELECT
  USING (true);

-- -----------------------------------------------------
-- ENTRIES TABLE
-- Public read (daily leaderboard data), service role writes
-- -----------------------------------------------------
CREATE POLICY "entries_public_read"
  ON entries FOR SELECT
  USING (true);

-- -----------------------------------------------------
-- ACHIEVEMENTS TABLE
-- Public read (show achievements), service role writes
-- -----------------------------------------------------
CREATE POLICY "achievements_public_read"
  ON achievements FOR SELECT
  USING (true);

-- -----------------------------------------------------
-- STREAKS TABLE
-- Public read (streak leaderboards), service role writes
-- -----------------------------------------------------
CREATE POLICY "streaks_public_read"
  ON streaks FOR SELECT
  USING (true);

-- -----------------------------------------------------
-- CHALLENGES TABLE
-- Public read, service role writes
-- -----------------------------------------------------
CREATE POLICY "challenges_public_read"
  ON challenges FOR SELECT
  USING (true);

-- -----------------------------------------------------
-- PUZZLE_RATINGS TABLE
-- Public read (analytics), service role writes
-- -----------------------------------------------------
CREATE POLICY "puzzle_ratings_public_read"
  ON puzzle_ratings FOR SELECT
  USING (true);

-- =====================================================
-- STEP 4: VERIFY POLICIES
-- =====================================================
-- Run this query to verify RLS is enabled:

-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public';

-- Run this to see all policies:

-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public';

-- =====================================================
-- NOTES
-- =====================================================
--
-- 1. SERVICE ROLE KEY: Your API routes should use the service_role key
--    (SUPABASE_SERVICE_ROLE_KEY) which bypasses RLS entirely.
--    This is correct for server-side operations.
--
-- 2. ANON KEY: Client-side requests using the anon key will only be
--    able to SELECT (read) data, not INSERT/UPDATE/DELETE.
--
-- 3. OPTIONAL STRICTER POLICIES: If you want certain data private
--    (e.g., game_states only visible to the player), you'd need to
--    implement Supabase Auth with JWT claims containing the username.
--
-- 4. LEGACY TABLES: sudoku_games and daily_completions may be unused.
--    Verify before enabling RLS or consider removing them.
--
-- =====================================================
