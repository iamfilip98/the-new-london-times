# 🚀 The New London Times - Global Transformation Plan
### From 2-Player Arena to 1M+ User Gaming Platform

**Target**: Become the #1 Sudoku platform globally
**Vision**: "Everything Sudoku Under One Roof"
**Model**: Free-to-Play with Ads + Premium Subscription + Microtransactions
**Timeline**: 6-12 months phased rollout
**Scale Target**: 1M+ users, $1M+ ARR

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Infrastructure Revolution](#infrastructure-revolution)
4. [Database Architecture Evolution](#database-architecture-evolution)
5. [Feature Expansion Masterplan](#feature-expansion-masterplan)
6. [Monetization Strategy](#monetization-strategy)
7. [Social & Competitive Systems](#social--competitive-systems)
8. [Educational Content Platform](#educational-content-platform)
9. [Analytics & Data Surveillance](#analytics--data-surveillance)
10. [Phased Rollout Roadmap](#phased-rollout-roadmap)
11. [Implementation Details](#implementation-details)
12. [Cost Analysis & Scaling](#cost-analysis--scaling)

---

## 🎯 Executive Summary

### What We're Building

Transform a 2-player competitive Sudoku site into **the definitive global Sudoku platform** combining:

- **Gaming Platform**: Duolingo-style progression system with achievements, leagues, events
- **Educational Hub**: From beginner to expert with practice puzzles teaching specific techniques
- **Social Network**: Friends, leagues, leaderboards, sharing, competition
- **F2P Game Economy**: Ads, subscriptions, microtransactions (themes, tokens, cosmetics)
- **Content Paradise**: Unlimited puzzles, variants (Killer, Samurai, etc.), seasonal events
- **Engagement Machine**: Daily challenges, FOMO-driven limited events, streak systems

### Key Success Factors

✅ **Built for Scale**: Modular architecture supporting 1M+ concurrent users
✅ **Free-to-Start**: Keep existing features free, monetize premium content
✅ **Community-Driven**: Follow F2P best practices from Candy Crush, Fortnite, Duolingo
✅ **Data-Obsessed**: Track everything for optimization and marketing
✅ **Mobile-First**: Equal priority desktop + mobile (both 10/10)
✅ **Gamified AF**: Achievements, events, FOMO, unlockables, themes

### Current Strengths to Preserve

- ⚡ **Lightning-fast puzzle engine** (already optimized, 10-40x faster with indexes)
- 🎯 **120+ achievement system** (excellent foundation to expand)
- 📊 **Advanced analytics** (already tracking performance metrics)
- 🏗️ **Clean vanilla JS architecture** (easy to maintain and extend)
- ✅ **Comprehensive testing** (Playwright tests across 12+ devices)
- 🎨 **Premium UI/UX** (glassmorphism, animations, responsive)

---

## 🔍 Current State Analysis

### Tech Stack Audit

| Component | Current | Status | Needs Upgrade? |
|-----------|---------|--------|----------------|
| **Frontend** | Vanilla JS | ✅ Excellent | No - keep modular |
| **Backend** | Vercel Serverless | ✅ Perfect for scale | No - scales automatically |
| **Database** | PostgreSQL (Vercel) | ⚠️ Good but limited | **YES** - Move to Neon |
| **Auth** | Hardcoded 2 users | ❌ Not scalable | **YES** - Implement Clerk |
| **Storage** | None | ❌ Missing | **YES** - Add Vercel Blob |
| **Cache** | None | ❌ Missing | **YES** - Add Vercel KV (Redis) |
| **Payments** | None | ❌ Missing | **YES** - Add Stripe |
| **Analytics** | Basic tracking | ⚠️ Insufficient | **YES** - Add PostHog |
| **Email** | None | ❌ Missing | **YES** - Add Resend |

### Database Schema (Current)

```sql
-- Current tables (production-ready foundation)
users             -- 2 hardcoded users, needs expansion
entries           -- Daily competition results
achievements      -- 120+ achievements tracking
streaks           -- Win streak tracking
daily_puzzles     -- Pre-generated puzzles (11 PM system)
fallback_puzzles  -- Emergency backup puzzles
game_states       -- Individual game progress
individual_games  -- Game completions
stats             -- Flexible JSON storage
```

### File Structure (42 source files)

```
Current:
- 7 HTML files (index, auth, faq, etc.)
- 11 API endpoints (puzzles, games, entries, achievements, auth, etc.)
- 6 JS modules (app, sudoku, achievements, analytics, challenges, themes)
- 2 CSS files (main 4000+ lines, enhancements 330+ lines)
- Comprehensive test suite (100+ tests, 12+ devices)

Total: ~22,000 lines of production code
```

### What Works (Don't Touch)

1. ✅ Puzzle generation algorithm (industry best practices, validated)
2. ✅ Scoring system (linear time scaling, harsh error penalties)
3. ✅ Achievement detection (smart, real-time, categorized)
4. ✅ Game state management (auto-save, sessionStorage, clean)
5. ✅ Analytics charts (Chart.js, interactive, beautiful)
6. ✅ Pre-generation system (11 PM daily, fallback system)
7. ✅ Testing infrastructure (Playwright, CI/CD, comprehensive)

### What Needs Complete Rebuild

1. ❌ Authentication system (2 users → millions)
2. ❌ User profiles (basic display name → rich profiles with inventory)
3. ❌ Social features (none → friends, leagues, sharing)
4. ❌ Monetization (none → ads + subscriptions + microtransactions)
5. ❌ Content variety (3 difficulties → unlimited + variants)
6. ❌ Educational content (none → comprehensive tutorial system)
7. ❌ Event system (none → daily/weekly/seasonal events)

---

## 🏗️ Infrastructure Revolution

### Migration Strategy: Free-Tier Stack → Production Scale

#### Phase 0: Free Tier (Launch - 10K Users)

**Database: Neon** (Serverless Postgres)
- **Why**: Better than current Vercel Postgres, 10GB free, auto-scaling, branching
- **Cost**: $0/month (10GB limit)
- **Migration**: Direct Postgres → Postgres migration (schemas compatible)
- **Dev Experience**: Git-like branches for dev/staging/prod

**Caching: Vercel KV** (Redis)
- **Why**: Built into Vercel, perfect integration
- **Cost**: $0/month (30,000 commands/day free)
- **Use Cases**:
  - Real-time leaderboards (ZADD, ZRANGE)
  - Session management
  - Rate limiting (anti-spam, anti-cheat)
  - Daily active user tracking
  - Hot data caching

**Storage: Vercel Blob**
- **Why**: Built-in, 100GB bandwidth/month free
- **Cost**: $0/month initially
- **Use Cases**:
  - User avatars
  - Theme images/CSS
  - Achievement badges
  - Educational content images

**Authentication: Clerk**
- **Why**: Best UX, 10,000 MAUs free, social auth built-in
- **Cost**: $0/month (up to 10K users)
- **Features**:
  - Email + password
  - Google, Facebook, Apple sign-in
  - User management dashboard
  - Embeddable UI components
  - Webhooks for user events

**Payments: Stripe**
- **Why**: Industry standard, no monthly fee
- **Cost**: 2.9% + $0.30 per transaction (no fixed costs)
- **Features**:
  - Subscriptions (monthly/annual)
  - One-time purchases (tokens, themes)
  - Global payment methods
  - Fraud prevention
  - Dunning management

**Analytics: PostHog**
- **Why**: 1M events/month free, comprehensive platform
- **Cost**: $0/month (1M events limit)
- **Features**:
  - User tracking (every click, every page)
  - Session replay (watch user behavior)
  - Feature flags (A/B testing)
  - Funnel analysis
  - Retention cohorts
  - Heatmaps

**Email: Resend**
- **Why**: Modern, 3,000 emails/month free
- **Cost**: $0/month
- **Use Cases**:
  - Welcome emails
  - Daily streak reminders
  - Achievement notifications
  - Event announcements
  - Password resets

**Ads: Google AdSense**
- **Why**: Highest fill rates, easy integration
- **Revenue**: **Generates money** (not a cost!)
- **Expected**: $1-5 CPM (depends on audience)

**Total Monthly Cost (0-10K users): $0**

---

#### Phase 1: Growth Tier (10K-100K Users)

**Upgrades Needed:**

1. **Neon Database**: $19/month (unlimited, better performance)
2. **Clerk Auth**: $25/month (up to 50K MAUs)
3. **Vercel Pro**: $20/month (better bandwidth, analytics)
4. **PostHog**: $0 still (1M events covers ~100K users with moderate tracking)
5. **CDN: Cloudflare** (free tier sufficient)

**Total Monthly Cost: ~$64/month**

**Revenue at 100K users** (conservative):
- 10% conversion to premium ($5/month) = 10,000 paid users × $5 = **$50,000/month**
- Ad revenue (90K free users) = 90K × 10 pageviews/day × $1.50 CPM = **$4,050/month**
- Microtransactions (5% buy stuff) = 5,000 users × $3/month avg = **$15,000/month**

**Total Revenue: ~$69,000/month**
**Profit Margin: 99.9%** 🚀

---

#### Phase 2: Scale Tier (100K-1M Users)

**Upgrades Needed:**

1. **Neon**: $69/month (scale plan)
2. **Clerk**: $99/month (up to 500K MAUs)
3. **Vercel Enterprise**: $400/month (custom limits)
4. **PostHog**: $450/month (10M events)
5. **CDN: Cloudflare Pro**: $20/month
6. **Redis: Upstash** (if outgrow Vercel KV): $30/month

**Total Monthly Cost: ~$1,068/month**

**Revenue at 1M users**:
- 8% conversion (800K premium @ $5/mo) = **$4M/month**
- Ad revenue (200K free @ 10 pageviews × $1.50 CPM) = **$90K/month**
- Microtransactions (50K users × $5/mo avg) = **$250K/month**

**Total Revenue: ~$4.34M/month ($52M/year ARR)**
**Profit Margin: 99.98%**

---

### Infrastructure Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER DEVICES                             │
│          (Mobile Web, Desktop, PWA)                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  CLOUDFLARE CDN                              │
│       (Global Edge, DDoS Protection, Caching)               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  VERCEL EDGE NETWORK                         │
│              (Serverless Functions, Static Assets)          │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  NEON DB     │  │ VERCEL KV    │  │ VERCEL BLOB  │
│  (Postgres)  │  │  (Redis)     │  │  (Storage)   │
│              │  │              │  │              │
│ • Users      │  │ • Sessions   │  │ • Avatars    │
│ • Games      │  │ • Leaderboard│  │ • Themes     │
│ • Achievements│ │ • Cache      │  │ • Images     │
│ • Leagues    │  │ • Rate Limit │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   CLERK      │  │   STRIPE     │  │   POSTHOG    │
│   (Auth)     │  │  (Payments)  │  │  (Analytics) │
│              │  │              │  │              │
│ • Social Login│ │ • Subs      │  │ • Events     │
│ • User Mgmt  │  │ • Tokens    │  │ • Funnels    │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🗄️ Database Architecture Evolution

### New Schema (Additional Tables)

```sql
-- ============================================
-- USER MANAGEMENT & PROFILES
-- ============================================

-- Extended users table (keep existing, add columns)
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  email VARCHAR(255) UNIQUE,
  email_verified BOOLEAN DEFAULT false,
  clerk_id VARCHAR(255) UNIQUE,  -- Clerk user ID
  subscription_tier VARCHAR(50) DEFAULT 'free',  -- free, premium, ultra
  subscription_expires_at TIMESTAMP,
  tokens INTEGER DEFAULT 0,  -- Premium currency
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  bio TEXT,
  country VARCHAR(3),  -- ISO 3166-1 alpha-3
  timezone VARCHAR(50),
  theme_id VARCHAR(50) DEFAULT 'default',
  preferences JSONB DEFAULT '{}',  -- UI settings, notifications
  is_banned BOOLEAN DEFAULT false,
  last_active_at TIMESTAMP,
  total_puzzles_solved INTEGER DEFAULT 0,
  perfect_games INTEGER DEFAULT 0
;

-- User inventory (owned themes, badges, etc.)
CREATE TABLE user_inventory (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL,  -- theme, badge, avatar_frame, etc.
  item_id VARCHAR(100) NOT NULL,
  purchased_at TIMESTAMP DEFAULT NOW(),
  equipped BOOLEAN DEFAULT false,
  UNIQUE(user_id, item_type, item_id)
);
CREATE INDEX idx_user_inventory_user ON user_inventory(user_id);
CREATE INDEX idx_user_inventory_equipped ON user_inventory(user_id, equipped) WHERE equipped = true;

-- ============================================
-- SOCIAL FEATURES
-- ============================================

-- Friendships
CREATE TABLE friendships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, blocked
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);
CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_status ON friendships(user_id, status);

-- Leagues (both official and custom)
CREATE TABLE leagues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL,  -- official, custom, seasonal
  tier VARCHAR(20),  -- bronze, silver, gold, platinum, diamond, legend
  creator_id INTEGER REFERENCES users(id),
  icon_url TEXT,
  is_public BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 100,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  settings JSONB DEFAULT '{}'
);
CREATE INDEX idx_leagues_type ON leagues(type);
CREATE INDEX idx_leagues_tier ON leagues(tier);

-- League memberships
CREATE TABLE league_members (
  id SERIAL PRIMARY KEY,
  league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  rank INTEGER,
  points INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  UNIQUE(league_id, user_id)
);
CREATE INDEX idx_league_members_league ON league_members(league_id);
CREATE INDEX idx_league_members_user ON league_members(user_id);
CREATE INDEX idx_league_members_rank ON league_members(league_id, rank);

-- ============================================
-- CONTENT & PUZZLES
-- ============================================

-- Puzzle variants (Killer, Samurai, etc.)
CREATE TABLE puzzle_variants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  rules TEXT,
  difficulty_levels JSONB,  -- available difficulties
  is_premium BOOLEAN DEFAULT false,
  icon_url TEXT,
  enabled BOOLEAN DEFAULT true
);

-- Puzzle library (unlimited on-demand puzzles)
CREATE TABLE puzzles (
  id SERIAL PRIMARY KEY,
  variant_id INTEGER REFERENCES puzzle_variants(id),
  difficulty VARCHAR(20),
  puzzle TEXT NOT NULL,
  solution TEXT NOT NULL,
  quality_score FLOAT,
  tags JSONB,  -- techniques required, etc.
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_puzzles_variant ON puzzles(variant_id, difficulty);
CREATE INDEX idx_puzzles_featured ON puzzles(is_featured) WHERE is_featured = true;

-- User puzzle progress (for unlimited play)
CREATE TABLE user_puzzle_completions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  puzzle_id INTEGER REFERENCES puzzles(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT NOW(),
  time_seconds INTEGER,
  errors INTEGER,
  hints_used INTEGER,
  score INTEGER,
  UNIQUE(user_id, puzzle_id)
);
CREATE INDEX idx_user_puzzles_user ON user_puzzle_completions(user_id);

-- ============================================
-- EDUCATIONAL CONTENT
-- ============================================

-- Tutorial courses
CREATE TABLE tutorial_courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20),  -- beginner, intermediate, advanced
  is_premium BOOLEAN DEFAULT false,
  order_index INTEGER,
  estimated_minutes INTEGER,
  icon_url TEXT
);

-- Tutorial lessons
CREATE TABLE tutorial_lessons (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES tutorial_courses(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  content TEXT,  -- Markdown content
  video_url TEXT,
  technique VARCHAR(50),  -- naked_single, hidden_pair, etc.
  practice_puzzle_id INTEGER REFERENCES puzzles(id),
  order_index INTEGER,
  is_premium BOOLEAN DEFAULT false
);
CREATE INDEX idx_lessons_course ON tutorial_lessons(course_id, order_index);

-- User tutorial progress
CREATE TABLE user_tutorial_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER REFERENCES tutorial_lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP,
  practice_score INTEGER,
  UNIQUE(user_id, lesson_id)
);
CREATE INDEX idx_user_tutorials ON user_tutorial_progress(user_id);

-- ============================================
-- EVENTS & CHALLENGES
-- ============================================

-- Seasonal/limited events
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20),  -- daily, weekly, seasonal, special
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  rewards JSONB,  -- tokens, themes, badges
  requirements JSONB,  -- completion criteria
  is_premium BOOLEAN DEFAULT false,
  banner_url TEXT
);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_events_active ON events(start_date, end_date)
  WHERE end_date > NOW();

-- Event participation
CREATE TABLE event_participations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  progress JSONB DEFAULT '{}',
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  rewards_claimed BOOLEAN DEFAULT false,
  UNIQUE(event_id, user_id)
);
CREATE INDEX idx_event_parts_event ON event_participations(event_id);
CREATE INDEX idx_event_parts_user ON event_participations(user_id);

-- ============================================
-- MONETIZATION
-- ============================================

-- Store items (themes, badges, etc.)
CREATE TABLE store_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  item_type VARCHAR(50),  -- theme, badge, avatar_frame, token_pack
  price_usd DECIMAL(10,2),
  price_tokens INTEGER,
  preview_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  limited_quantity INTEGER,  -- NULL = unlimited
  remaining_quantity INTEGER,
  available_until TIMESTAMP
);
CREATE INDEX idx_store_featured ON store_items(is_featured) WHERE is_featured = true;
CREATE INDEX idx_store_type ON store_items(item_type, is_available);

-- Purchase history
CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES store_items(id),
  purchase_type VARCHAR(20),  -- usd, tokens, reward
  amount_paid DECIMAL(10,2),
  tokens_paid INTEGER,
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_created ON purchases(created_at);

-- Subscription history
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(50),  -- premium, ultra
  status VARCHAR(20),  -- active, cancelled, expired, paused
  stripe_subscription_id VARCHAR(255),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_subs_user ON subscriptions(user_id);
CREATE INDEX idx_subs_stripe ON subscriptions(stripe_subscription_id);

-- ============================================
-- ANALYTICS & TRACKING
-- ============================================

-- Daily active users (for quick metrics)
CREATE TABLE daily_active_users (
  date DATE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  sessions INTEGER DEFAULT 1,
  puzzles_played INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  PRIMARY KEY (date, user_id)
);
CREATE INDEX idx_dau_date ON daily_active_users(date);

-- Page views & events (supplement PostHog)
CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_type ON analytics_events(event_type, created_at);
CREATE INDEX idx_analytics_user ON analytics_events(user_id, created_at);

-- A/B test tracking
CREATE TABLE ab_tests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  variants JSONB,  -- {a: {...}, b: {...}}
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE ab_test_assignments (
  id SERIAL PRIMARY KEY,
  test_id INTEGER REFERENCES ab_tests(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  variant VARCHAR(10),  -- 'a', 'b', etc.
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(test_id, user_id)
);

-- ============================================
-- LEADERBOARDS (Redis Cache + DB Backup)
-- ============================================

-- Global leaderboards (permanent records)
CREATE TABLE leaderboards (
  id SERIAL PRIMARY KEY,
  period VARCHAR(20),  -- daily, weekly, monthly, all_time
  period_start DATE,
  period_end DATE,
  user_id INTEGER REFERENCES users(id),
  rank INTEGER,
  score INTEGER,
  puzzles_solved INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(period, period_start, user_id)
);
CREATE INDEX idx_leaderboards_period ON leaderboards(period, period_start, rank);
CREATE INDEX idx_leaderboards_user ON leaderboards(user_id);
```

---

## 🎮 Feature Expansion Masterplan

### 1. Achievement System Evolution (120 → 500+ Achievements)

**Current**: 120 achievements across 14 categories
**Target**: 500+ achievements with progressive unlocks

**New Achievement Categories**:

```javascript
// Social Achievements
{
  category: 'social',
  achievements: [
    { id: 'friend_collector_10', name: 'Friend Collector', desc: 'Add 10 friends', rarity: 'common' },
    { id: 'friend_collector_50', name: 'Popular', desc: 'Add 50 friends', rarity: 'rare' },
    { id: 'league_champion', name: 'League Champion', desc: 'Win a custom league', rarity: 'epic' },
    { id: 'league_dominator', name: 'League Dominator', desc: 'Win 10 leagues', rarity: 'legendary' },
    // ... 50 more
  ]
}

// Educational Achievements
{
  category: 'education',
  achievements: [
    { id: 'tutorial_complete_beginner', name: 'Sudoku Student', desc: 'Complete beginner course', rarity: 'common' },
    { id: 'tutorial_complete_advanced', name: 'Sudoku Master', desc: 'Complete advanced course', rarity: 'epic' },
    { id: 'technique_naked_pair', name: 'Naked Pair Pro', desc: 'Use naked pair technique 50 times', rarity: 'rare' },
    // ... 40 more
  ]
}

// Variant Achievements (per variant)
{
  category: 'variants',
  achievements: [
    { id: 'killer_sudoku_first', name: 'Killer Initiate', desc: 'Complete first Killer Sudoku', rarity: 'common' },
    { id: 'samurai_sudoku_master', name: 'Samurai Master', desc: 'Complete 100 Samurai Sudoku', rarity: 'legendary' },
    // ... 60 more (15 variants × 4 tiers)
  ]
}

// Collection Achievements
{
  category: 'collections',
  achievements: [
    { id: 'theme_collector_5', name: 'Style Explorer', desc: 'Own 5 themes', rarity: 'common' },
    { id: 'theme_collector_all', name: 'Fashionista', desc: 'Own all themes', rarity: 'legendary' },
    { id: 'badge_collector_50', name: 'Badge Hunter', desc: 'Earn 50 unique badges', rarity: 'epic' },
    // ... 30 more
  ]
}

// Event Achievements
{
  category: 'events',
  achievements: [
    { id: 'event_participate_first', name: 'Event Virgin', desc: 'Join your first event', rarity: 'common' },
    { id: 'event_win_seasonal', name: 'Seasonal Victor', desc: 'Win a seasonal event', rarity: 'legendary' },
    { id: 'event_completionist', name: 'FOMO Master', desc: 'Participate in 50 events', rarity: 'legendary' },
    // ... 40 more
  ]
}

// Spending Achievements (encourage purchases)
{
  category: 'monetization',
  achievements: [
    { id: 'first_purchase', name: 'Supporter', desc: 'Make your first purchase', rarity: 'common', reward: { tokens: 100 } },
    { id: 'premium_sub', name: 'Premium Member', desc: 'Subscribe to Premium', rarity: 'rare', reward: { badge: 'premium_crown' } },
    { id: 'whale_1000', name: 'Generous Whale', desc: 'Spend $1000', rarity: 'legendary', reward: { theme: 'golden_exclusive' } },
    // ... 20 more
  ]
}
```

**Total New Achievements**: 240 + existing 120 = **360 achievements**
**Expansion Room**: Easily add more with events, new variants, milestones

---

### 2. Puzzle Variants System

**15 Planned Variants** (following community standards):

| Variant | Description | Difficulty Levels | Premium? |
|---------|-------------|-------------------|----------|
| **Classic** | Standard 9×9 Sudoku | Easy, Medium, Hard | ❌ Free |
| **Killer Sudoku** | Cages with sum constraints | Easy, Medium, Hard | ✅ Premium |
| **Samurai Sudoku** | 5 overlapping 9×9 grids | Medium, Hard | ✅ Premium |
| **X-Sudoku** | Diagonals also contain 1-9 | Easy, Medium, Hard | ❌ Free |
| **Hyper Sudoku** | Extra 3×3 regions | Medium, Hard | ✅ Premium |
| **Jigsaw Sudoku** | Irregular regions | Easy, Medium, Hard | ✅ Premium |
| **Mini Sudoku** | 6×6 or 4×4 | Easy, Medium | ❌ Free |
| **Mega Sudoku** | 16×16 grid | Medium, Hard, Expert | ✅ Premium |
| **Consecutive Sudoku** | Adjacent cells differ by ≠1 | Medium, Hard | ✅ Premium |
| **Anti-Knight** | Chess knight move constraint | Medium, Hard | ✅ Premium |
| **Thermo Sudoku** | Thermometer constraints | Medium, Hard | ✅ Premium |
| **Arrow Sudoku** | Arrow sum constraints | Medium, Hard | ✅ Premium |
| **Even-Odd Sudoku** | Even/odd cell markers | Easy, Medium | ❌ Free |
| **Greater Than Sudoku** | Comparison operators | Medium, Hard | ✅ Premium |
| **Sudoku XV** | X=10, V=5 sum markers | Medium, Hard | ✅ Premium |

**Implementation**:
- Each variant gets its own generator algorithm (can start with libraries, then customize)
- Variant-specific validation rules
- Dedicated leaderboards per variant
- Variant-specific achievements (60+ total)
- Daily variant challenges (premium feature)

---

### 3. Educational Content System

**Structure**: Courses → Lessons → Practice Puzzles

#### Beginner Course (FREE)
```
Course: "Sudoku Basics"
├── Lesson 1: Rules of Sudoku
│   ├── Video: 3min explanation
│   ├── Content: Interactive grid showing rules
│   └── Practice: 5 super easy puzzles (pre-filled 60+ cells)
│
├── Lesson 2: Naked Singles
│   ├── Content: What are naked singles?
│   ├── Interactive: Highlight naked singles in example
│   └── Practice: 10 puzzles designed with obvious naked singles
│
├── Lesson 3: Hidden Singles
│   ├── Content: How to spot hidden singles
│   ├── Interactive: Step-by-step example
│   └── Practice: 10 puzzles focusing on hidden singles
│
├── Lesson 4: Basic Strategies Combined
│   └── Practice: 15 easy puzzles requiring both techniques
│
└── Final Test
    └── 5 puzzles to prove competency
```

#### Intermediate Course (FREE + PREMIUM mix)
```
Course: "Intermediate Techniques"
├── Lesson 1: Naked Pairs (FREE)
├── Lesson 2: Hidden Pairs (FREE)
├── Lesson 3: Pointing Pairs (PREMIUM)
├── Lesson 4: Box/Line Reduction (PREMIUM)
├── Lesson 5: Naked Triples (PREMIUM)
└── Lesson 6: X-Wing Basics (PREMIUM)
```

#### Advanced Course (PREMIUM)
```
Course: "Expert Mastery"
├── Lesson 1: Swordfish
├── Lesson 2: XY-Wing
├── Lesson 3: XYZ-Wing
├── Lesson 4: Unique Rectangles
├── Lesson 5: Advanced Coloring
├── Lesson 6: Forcing Chains
└── Lesson 7: Nishio & Bowman's Bingo
```

**Practice Puzzle Generation**:
- Puzzles specifically designed to teach each technique
- Pre-filled to point where technique is needed
- Hints system guides to use specific technique
- Score based on: time + whether technique was used correctly

**Gamification**:
- XP for completing lessons (100 XP per lesson)
- Achievements for completing courses
- Badges displayed on profile
- Leaderboard for "Most Educated Player"

---

### 4. Unlimited Puzzle System

**Current**: Daily puzzles only (3 per day)
**New**: Unlimited on-demand puzzles

**Free Tier**:
- 3 daily puzzles (Easy, Medium, Hard Classic)
- Access to completed daily puzzles from past 7 days
- Practice puzzles from free tutorials

**Premium Tier**:
- **Unlimited Classic Sudoku** (Easy, Medium, Hard, Expert)
- **All 15 variants** with unlimited plays
- **Daily variant challenges** (1 per variant, 15 total)
- **Historical dailies** (access all past daily puzzles)
- **Token system**: Missed a daily? Spend 10 tokens to unlock it

**Implementation**:
```javascript
// Puzzle request flow
async function requestPuzzle(userId, variant, difficulty) {
  // 1. Check user tier
  const user = await getUserTier(userId);

  // 2. Check daily limit (if free tier)
  if (user.tier === 'free') {
    const todayCount = await getPuzzlesPlayedToday(userId);
    if (todayCount >= 3) {
      return { error: 'Daily limit reached', upsell: 'premium' };
    }
  }

  // 3. Check variant access
  if (variant !== 'classic' && user.tier === 'free') {
    return { error: 'Premium variant', upsell: 'premium' };
  }

  // 4. Generate or fetch puzzle
  const puzzle = await getOrGeneratePuzzle(variant, difficulty);

  // 5. Track play
  await trackPuzzlePlay(userId, puzzle.id);

  return puzzle;
}
```

**Puzzle Library**:
- Pre-generate 1,000 puzzles per (variant × difficulty) combo
- Generate more in background as inventory depletes
- Quality scoring: track completion rates, average times, user ratings
- Retire low-quality puzzles automatically

---

## 💰 Monetization Strategy

### Three-Tier Model (F2P Best Practices)

#### FREE Tier
**Goal**: Hook users, show value, create FOMO

**Access**:
- ✅ 3 daily Classic Sudoku (Easy, Medium, Hard)
- ✅ Basic achievements (200/500)
- ✅ Basic analytics (charts, stats)
- ✅ Friends system (max 20 friends)
- ✅ Join public leagues
- ✅ 2 free themes (Default + 1 earned)
- ✅ Beginner tutorial course
- ✅ 7-day historical dailies
- ❌ Ads (non-intrusive: banner + occasional interstitial)

**Limitations**:
- ❌ Only Classic Sudoku
- ❌ Only 3 puzzles per day
- ❌ Can't create custom leagues
- ❌ Limited friend slots (20 max)
- ❌ No premium analytics
- ❌ Ads present
- ❌ No tokens earned (only from purchases/events)

**Conversion Strategy**:
- Show "Premium badge" on premium users in leaderboards
- Tease locked variants (grayed out, "Unlock with Premium")
- "Daily puzzle limit reached" → Show Premium benefits
- Limited-time offers (first month 50% off)

---

#### PREMIUM Tier ($4.99/month or $39.99/year)
**Goal**: Core serious players who love Sudoku

**Access**:
- ✅ **Ad-free experience**
- ✅ **Unlimited Classic Sudoku** (all difficulties including Expert)
- ✅ **All 15 puzzle variants** (unlimited plays)
- ✅ **Daily variant challenges** (15 per day)
- ✅ **All achievements** (500+)
- ✅ **Premium analytics** (advanced charts, technique tracking, heat maps)
- ✅ **Unlimited friends**
- ✅ **Create custom leagues** (up to 10 leagues)
- ✅ **All tutorial courses** (Beginner → Advanced)
- ✅ **Historical dailies** (all past puzzles)
- ✅ **Priority support**
- ✅ **Token earnings** (50 tokens/week for daily login streak)
- ✅ **5 free themes** (choose from library)
- ✅ **Premium badge** on profile

**Price Optimization**:
- Monthly: $4.99 (industry standard for puzzle apps)
- Annual: $39.99 (20% savings, $3.33/month)
- Trial: 7-day free trial (requires payment method, auto-renews)

**Retention Mechanics**:
- Streaks (lose if you cancel)
- Earned tokens (lose if you cancel)
- Custom leagues (deleted if you downgrade)
- Unlock animations: "You've unlocked Killer Sudoku!"

---

#### ULTRA Tier ($9.99/month or $79.99/year) [Optional - Future]
**Goal**: Ultra-engaged players, completionists, whales

**Everything in Premium PLUS**:
- ✅ **2x token earnings** (100 tokens/week)
- ✅ **Exclusive themes** (20+ ultra-only themes)
- ✅ **Exclusive badges**
- ✅ **Custom profile customization** (backgrounds, animations)
- ✅ **Early access** to new features/variants
- ✅ **Unlimited custom leagues**
- ✅ **Advanced statistics** (AI-powered insights, improvement suggestions)
- ✅ **Priority leaderboard placement** (Ultra badge)
- ✅ **Monthly exclusive events**

**Justification**: Chess.com has $14.99/month tier, we can go $9.99

---

### Microtransactions (Token Economy)

**Token System**:
- Premium currency: **Tokens** 💎
- Earn tokens: Premium subscription, events, achievements
- Spend tokens: Themes, badges, unlock missed dailies, custom features

**Token Pricing** (Stripe):
```javascript
const tokenPacks = [
  { tokens: 100, price: 0.99, bonus: 0 },      // Starter
  { tokens: 500, price: 3.99, bonus: 50 },     // Popular (10% bonus)
  { tokens: 1200, price: 7.99, bonus: 200 },   // Best Value (17% bonus)
  { tokens: 2500, price: 14.99, bonus: 500 },  // Mega (20% bonus)
  { tokens: 5000, price: 24.99, bonus: 1500 }, // Whale (30% bonus)
];
```

**Token Store**:

| Item | Token Cost | USD Equivalent |
|------|-----------|----------------|
| **Themes** ||||
| Basic Theme | 200 tokens | ~$1.50 |
| Premium Theme | 500 tokens | ~$3.50 |
| Animated Theme | 1000 tokens | ~$6.50 |
| Legendary Theme | 2500 tokens | ~$14.99 |
| **Unlocks** ||||
| Unlock Missed Daily | 10 tokens | ~$0.10 |
| Unlock Past Week | 50 tokens | ~$0.50 |
| **Customization** ||||
| Avatar Frame | 300 tokens | ~$2.00 |
| Profile Background | 500 tokens | ~$3.50 |
| Custom Badge | 800 tokens | ~$5.50 |
| **Boosts** ||||
| 2x XP (24h) | 100 tokens | ~$0.99 |
| 2x XP (7 days) | 500 tokens | ~$3.99 |

**Revenue Projections**:

**At 100,000 users**:
- 10% convert to Premium ($4.99/mo) = 10,000 × $4.99 = **$49,900/month**
- 2% buy Ultra ($9.99/mo) = 2,000 × $9.99 = **$19,980/month**
- 5% buy tokens ($5 avg/user/mo) = 5,000 × $5 = **$25,000/month**
- **Total subscription revenue**: **$94,880/month**

**Ad Revenue** (88,000 free users):
- 88,000 users × 10 pageviews/day × 30 days = 26.4M impressions/mo
- $1.50 CPM = **$39,600/month**

**Total Monthly Revenue at 100K users: $134,480 (~$1.61M/year ARR)**

**At 1,000,000 users**:
- Scale above by ~10x with better conversion (8% premium, 3% ultra):
- **~$15M/year ARR** (conservative estimate)

---

### Ad Strategy (Free Tier)

**Google AdSense Implementation**:

**Placement** (non-intrusive, following best practices):
1. **Dashboard**: 1 banner ad (top or sidebar)
2. **Between puzzles**: 1 interstitial ad (every 3rd puzzle completion)
3. **Leaderboard page**: 1 banner ad (bottom)
4. **Analytics page**: 1 sidebar ad

**User Experience Principles**:
- ❌ NO ads during active gameplay (ruins experience)
- ❌ NO ads blocking UI (must be dismissible)
- ✅ Ads clearly labeled ("Advertisement")
- ✅ Skippable after 5 seconds (interstitials)
- ✅ Frequency capping (max 1 interstitial per 10 minutes)

**Ad Optimization**:
- Use AdSense Auto Ads (AI-optimized placement)
- A/B test ad placements (PostHog experiments)
- Track ad revenue per user (optimize for ARPDAU)
- Exclude competitors' ads (Chess.com, NYT, etc.)

**Expected CPM**: $1-5 depending on audience (puzzle players are valuable demographic)

---

## 🏆 Social & Competitive Systems

### 1. Friends System

**Features**:
- Add friends by username or email
- Accept/reject friend requests
- See friends' activity feed (puzzle completions, achievements)
- Challenge friends to specific puzzles
- Compare stats with friends
- Friend leaderboards

**Database**:
```sql
-- Already designed above
friendships table + friend activity feed
```

**UI Flow**:
```
Profile → Friends Tab
├── Friend Requests (3 pending)
├── Friend List (25 friends)
│   ├── Alice (🟢 Online, just completed Hard Sudoku)
│   ├── Bob (🟠 Active 2h ago)
│   └── Charlie (⚫ Offline)
└── Add Friend [+ button]
    ├── Search by username
    ├── Search by email
    └── Share your friend code
```

---

### 2. League System

**Three Types of Leagues**:

#### A. Official Leagues (Competitive Ladder)
- **Tiers**: Bronze → Silver → Gold → Platinum → Diamond → Legend
- **Promotion/Demotion**: Weekly based on points
- **Points**: Earned by solving puzzles (score = points)
- **Top 20% promoted**, **Bottom 20% demoted**
- **Rewards**: Tokens, badges, exclusive themes per tier

**Tier Progression**:
```
Legend (Top 1000 globally)
   ↕
Diamond (Top 10%)
   ↕
Platinum (Top 25%)
   ↕
Gold (Top 50%)
   ↕
Silver (Top 75%)
   ↕
Bronze (Everyone starts here)
```

**League Season**: 4 weeks (monthly reset)

---

#### B. Custom Leagues (User-Created)
- **Free users**: Can join, can't create
- **Premium users**: Create up to 10 leagues
- **Ultra users**: Unlimited leagues

**League Settings**:
- Name, description, icon
- Public or invite-only
- Max members (10-100)
- Scoring rules (custom: time-based, accuracy-based, etc.)
- Duration (1 week, 1 month, ongoing)
- Prizes (tokens, bragging rights)

**Use Cases**:
- "Family Sudoku League" (10 members, friendly)
- "Office Lunch Break League" (20 members, weekly)
- "Speedrun Challenge" (time-based scoring)

---

#### C. Seasonal Leagues (Event-Based)
- Tied to seasonal events (Christmas, Summer, Halloween)
- Limited duration (2-4 weeks)
- Exclusive rewards (seasonal themes, badges)
- Special rules (variant-only, specific techniques)

---

### 3. Leaderboard System

**Global Leaderboards** (cached in Redis):

| Leaderboard | Scope | Metric | Reset |
|-------------|-------|--------|-------|
| Daily | Global | Total score today | Midnight UTC |
| Weekly | Global | Total score this week | Monday 00:00 UTC |
| Monthly | Global | Total score this month | 1st of month |
| All-Time | Global | Total puzzles solved | Never |
| Speed Legends | Global | Fastest average time | Weekly |
| Perfect Players | Global | Most perfect games | Monthly |
| **Per Variant** ||||
| Killer Sudoku Kings | Global | Killer Sudoku score | Monthly |
| Samurai Masters | Global | Samurai Sudoku score | Monthly |
| ... | ... | ... | ... |

**League-Specific Leaderboards**:
- Every league has its own leaderboard
- Updates in real-time (Redis)

**Friend Leaderboards**:
- Compare against friends only
- All metrics available

**Implementation** (Redis + PostgreSQL):

```javascript
// Redis for real-time leaderboard (fast reads)
async function updateLeaderboard(userId, score, leaderboardKey) {
  await redis.zadd(leaderboardKey, score, userId);
  await redis.expire(leaderboardKey, 86400 * 30); // 30 days TTL
}

// Get top 100
async function getLeaderboard(leaderboardKey, limit = 100) {
  const results = await redis.zrevrange(leaderboardKey, 0, limit - 1, 'WITHSCORES');
  return formatLeaderboard(results);
}

// Get user rank
async function getUserRank(userId, leaderboardKey) {
  const rank = await redis.zrevrank(leaderboardKey, userId);
  const score = await redis.zscore(leaderboardKey, userId);
  return { rank: rank + 1, score };
}

// Persist to PostgreSQL daily (for historical data)
async function snapshotLeaderboard(leaderboardKey, period) {
  const leaderboard = await redis.zrevrange(leaderboardKey, 0, 1000, 'WITHSCORES');
  await db.query(`
    INSERT INTO leaderboards (period, period_start, user_id, rank, score)
    VALUES ...
  `);
}
```

---

### 4. Social Sharing

**Share achievements**:
- "I just completed a Hard Sudoku in 3:42! Can you beat it? [Play Now]"
- Auto-generate image cards (Open Graph)
- Share to: Twitter, Facebook, Discord, WhatsApp

**Share results**:
```
🎮 Daily Sudoku Results - Dec 15, 2025
✅ Easy: 2:15 (950 pts)
✅ Medium: 4:32 (1,820 pts)
✅ Hard: 8:01 (3,200 pts)
🏆 Total: 5,970 pts (#47 globally!)

Play now: [link]
```

**Referral System** (future):
- Share invite link
- Friend signs up → both get 100 tokens
- Viral loop for growth

---

## 📚 Educational Content Platform

### Content Structure

**3 Course Levels**:
1. **Beginner** (FREE) - 6 lessons, ~2 hours
2. **Intermediate** (3 free + 5 premium) - 8 lessons, ~4 hours
3. **Advanced** (PREMIUM) - 10 lessons, ~6 hours

**24 Total Lessons**, each with:
- Text content (Markdown)
- Interactive examples (playable grids)
- Video tutorial (optional, YouTube embeds)
- 5-10 practice puzzles per lesson
- Quiz (check understanding)

---

### Lesson Example: "Naked Pairs"

**Structure**:
```markdown
# Lesson 4: Naked Pairs

## What are Naked Pairs?

A **naked pair** is when two cells in the same unit (row, column, or box)
both have exactly the same two candidates.

Example:
- Cell R1C1 has candidates {4, 7}
- Cell R1C5 has candidates {4, 7}
- These are a naked pair!

## Why It Matters

If two cells in a row can ONLY be 4 or 7, then:
- One must be 4 and the other must be 7
- No other cell in that row can be 4 or 7!

## Interactive Example

[Interactive Grid Here - shows naked pair, highlights elimination]

## Practice Time

Complete these 10 puzzles. Each has at least one naked pair to find!

[Practice Puzzles 1-10]

## Quiz

1. How many candidates must each cell in a naked pair have?
   a) Exactly 2 ✅
   b) At least 2
   c) Any number

2. If you find a naked pair {3,8} in column 5, what can you eliminate?
   a) All 3s and 8s from column 5 ✅
   b) All 3s and 8s from the grid
   c) Nothing

[Complete Quiz to Continue]
```

---

### Gamification

**XP System**:
- Complete lesson: +100 XP
- Complete practice puzzle: +20 XP
- Perfect practice (0 errors): +50 XP bonus
- Complete course: +500 XP

**Levels** (XP-based):
- Level 1: 0 XP (Novice)
- Level 10: 5,000 XP (Intermediate)
- Level 25: 25,000 XP (Advanced)
- Level 50: 100,000 XP (Expert)
- Level 100: 500,000 XP (Grandmaster)

**Level Benefits**:
- Every 5 levels: +50 tokens
- Every 10 levels: Exclusive badge
- Level 50: Exclusive theme
- Level 100: Legendary avatar frame

---

### Practice Puzzle Generation

**Technique-Specific Puzzles**:
- Pre-generate puzzles requiring specific technique
- Use puzzle validators to confirm technique is necessary
- Tag puzzles: `{ techniques: ['naked_pair', 'hidden_single'] }`

**Adaptive Difficulty**:
- Track user success rate per technique
- If struggling (< 60% success): Show easier examples
- If mastering (> 90% success): Challenge with harder puzzles

---

## 📊 Analytics & Data Surveillance

### Tracking Everything (PostHog + Custom)

**User Events to Track**:

```javascript
// Page Views
track('page_view', { page: 'dashboard', referrer: '...' });

// User Actions
track('puzzle_started', { difficulty: 'hard', variant: 'classic' });
track('puzzle_completed', {
  difficulty: 'hard',
  time: 487,
  errors: 2,
  hints: 1,
  score: 2850,
  techniques_used: ['naked_single', 'hidden_pair']
});
track('puzzle_abandoned', { progress: 0.65, time: 320 });

// Social
track('friend_added', { friend_id: 12345 });
track('league_joined', { league_id: 67, league_type: 'custom' });
track('achievement_unlocked', { achievement_id: 'speed_demon', rarity: 'epic' });

// Monetization
track('premium_upsell_shown', { context: 'daily_limit_reached' });
track('premium_upsell_clicked', { context: 'daily_limit_reached' });
track('subscription_started', { tier: 'premium', billing: 'monthly' });
track('purchase_completed', { item: 'theme_neon', price_usd: 2.99, price_tokens: 500 });
track('ad_impression', { placement: 'dashboard_banner', ad_unit: 'xyz' });
track('ad_clicked', { placement: 'dashboard_banner' });

// Educational
track('tutorial_started', { course: 'intermediate' });
track('tutorial_lesson_completed', { lesson_id: 'naked_pairs' });
track('tutorial_quiz_passed', { lesson_id: 'naked_pairs', score: 0.9 });

// Engagement
track('daily_login', { streak: 7 });
track('session_duration', { duration: 1845 }); // seconds
```

---

### Key Metrics Dashboard (Admin)

**User Metrics**:
- DAU (Daily Active Users)
- WAU, MAU
- Retention (D1, D7, D30)
- Churn rate
- LTV (Lifetime Value) per cohort

**Engagement Metrics**:
- Average session duration
- Puzzles per session
- Puzzle completion rate
- Technique usage distribution
- Tutorial completion rate

**Monetization Metrics**:
- ARPDAU (Average Revenue Per Daily Active User)
- Conversion rate (free → premium)
- Subscription churn
- Token purchase frequency
- Whale identification (top 1% spenders)

**Acquisition Metrics**:
- Traffic sources (organic, paid, social, referral)
- Signup conversion rate
- First-day retention
- Viral coefficient (referrals per user)

**Product Metrics**:
- Most popular variants
- Most completed tutorials
- Most unlocked achievements
- Most played puzzle difficulties
- Ad viewability rate

---

### A/B Testing Framework

**Test Ideas**:

```javascript
// Test: Premium pricing
{
  name: 'premium_pricing_test',
  variants: {
    a: { monthly: 4.99, annual: 39.99 },  // Control
    b: { monthly: 3.99, annual: 29.99 },  // Lower price
  },
  metric: 'conversion_rate',
  duration: '2_weeks'
}

// Test: Daily puzzle limit
{
  name: 'daily_limit_test',
  variants: {
    a: { limit: 3 },  // Current
    b: { limit: 5 },  // More generous
  },
  metric: 'free_to_premium_conversion',
  hypothesis: 'Higher limit reduces conversion'
}

// Test: Achievement notifications
{
  name: 'achievement_notification_style',
  variants: {
    a: 'toast',     // Small toast
    b: 'modal',     // Full modal with animation
  },
  metric: 'achievement_engagement'
}
```

**Implementation** (PostHog Feature Flags):
```javascript
const variant = await posthog.getFeatureFlag('premium_pricing_test', userId);
const pricing = getPricing(variant);
```

---

### Heatmaps & Session Replay

**PostHog Session Replay**:
- Record user sessions (with consent)
- Watch how users interact with UI
- Identify UX pain points
- Replay rage clicks, dead clicks
- Filter by: new users, churned users, converters

**Heatmaps**:
- Click heatmaps (where users click)
- Scroll heatmaps (how far they scroll)
- Time heatmaps (where they spend time)

**Use Cases**:
- Why aren't users clicking "Upgrade to Premium"? (UX issue? positioning?)
- Why do users abandon puzzles at 65% completion? (too hard? too long?)
- Which tutorial lessons do users skip? (too boring? too hard?)

---

## 🗓️ Phased Rollout Roadmap

### Phase 0: Foundation (Months 1-2) 🏗️
**Goal**: Prepare infrastructure for scale without changing user experience

**Tasks**:
- [ ] Migrate database from Vercel Postgres to Neon
- [ ] Set up Vercel KV (Redis) for caching
- [ ] Set up Vercel Blob for assets
- [ ] Implement PostHog analytics (comprehensive event tracking)
- [ ] Set up Clerk authentication (keep existing 2 users during transition)
- [ ] Refactor codebase for modularity:
  - [ ] Separate API layer (reusable services)
  - [ ] Create shared utilities (auth middleware, validation)
  - [ ] Environment-based config (dev/staging/prod)
- [ ] Set up development/staging environments (Neon branches)
- [ ] Implement feature flags (PostHog)
- [ ] Update CLAUDE.md with new architecture guidelines

**Deliverables**:
- ✅ Infrastructure migrated to scalable stack
- ✅ Analytics tracking everything
- ✅ Dev/staging/prod environments
- ✅ Zero user-facing changes (still works for 2 users)

**Testing**:
- [ ] Load test API endpoints (simulate 1000 concurrent users)
- [ ] Verify Redis caching improves performance
- [ ] Confirm analytics events are being tracked

---

### Phase 1: User System (Month 3) 👤
**Goal**: Enable public signups, user profiles, basic social

**Tasks**:
- [ ] **Authentication**:
  - [ ] Implement Clerk sign-up flow (email + password)
  - [ ] Add social auth (Google, Facebook, Apple)
  - [ ] Migrate existing 2 users to new system
  - [ ] Anonymous play (session-based, prompt to save progress)
- [ ] **User Profiles**:
  - [ ] Create profile page (avatar, bio, stats, badges)
  - [ ] Avatar upload (Vercel Blob)
  - [ ] Username uniqueness validation
  - [ ] Profile editing
- [ ] **Friends System**:
  - [ ] Friend requests (send/accept/reject)
  - [ ] Friend list page
  - [ ] Friend activity feed
- [ ] **Database**:
  - [ ] Expand users table (profile fields)
  - [ ] Create friendships table
  - [ ] Migrate existing data
- [ ] **UI Updates**:
  - [ ] Login/signup pages (Clerk components)
  - [ ] Profile page
  - [ ] Friends page

**Deliverables**:
- ✅ Public can sign up and create accounts
- ✅ User profiles with customization
- ✅ Friends system functional
- ✅ Anonymous play available (with upsell)

**Testing**:
- [ ] User registration flow (happy path + edge cases)
- [ ] Profile creation and editing
- [ ] Friend request workflow
- [ ] Anonymous → registered user conversion

---

### Phase 2: Monetization (Month 4) 💰
**Goal**: Implement ads, subscriptions, token economy

**Tasks**:
- [ ] **Ads (Free Tier)**:
  - [ ] Integrate Google AdSense
  - [ ] Implement ad placements (banner, interstitial)
  - [ ] Frequency capping logic
  - [ ] Ad-free experience for premium users
- [ ] **Stripe Integration**:
  - [ ] Set up Stripe account
  - [ ] Implement subscription checkout (Premium, Ultra)
  - [ ] Implement one-time purchases (token packs)
  - [ ] Webhook handling (subscription updates)
- [ ] **Subscription Management**:
  - [ ] Create subscriptions table
  - [ ] Subscription status checking middleware
  - [ ] Billing portal (Stripe Customer Portal)
  - [ ] Subscription benefits enforcement
- [ ] **Token Economy**:
  - [ ] Add tokens column to users table
  - [ ] Token earning logic (Premium users get 50/week)
  - [ ] Token spending API
  - [ ] Create purchases table
- [ ] **UI Updates**:
  - [ ] Pricing page
  - [ ] Subscription management page
  - [ ] Token balance display
  - [ ] Upsell modals (daily limit, variant locked)

**Deliverables**:
- ✅ Free users see ads
- ✅ Premium subscriptions available ($4.99/mo)
- ✅ Token packs purchasable
- ✅ Subscription benefits enforced

**Testing**:
- [ ] Subscription checkout flow (monthly, annual)
- [ ] Token purchase flow
- [ ] Subscription renewal (webhook testing)
- [ ] Free tier limitations (daily limit)
- [ ] Premium tier benefits (ad-free, unlimited)

---

### Phase 3: Content Expansion (Months 5-6) 🎮
**Goal**: Add unlimited puzzles, variants, store

**Tasks**:
- [ ] **Unlimited Puzzle System**:
  - [ ] Create puzzles table (library of 15K+ puzzles)
  - [ ] Pre-generate 1000 puzzles per difficulty (Classic)
  - [ ] On-demand puzzle API (check tier, serve puzzle)
  - [ ] Track user puzzle completions
  - [ ] Puzzle rating system (track quality)
- [ ] **Puzzle Variants** (Start with 5):
  - [ ] Implement X-Sudoku generator + validator
  - [ ] Implement Mini Sudoku (6×6, 4×4)
  - [ ] Implement Killer Sudoku (premium)
  - [ ] Implement Jigsaw Sudoku (premium)
  - [ ] Implement Mega Sudoku 16×16 (premium)
  - [ ] UI for variant selection
  - [ ] Variant-specific rules display
- [ ] **Store System**:
  - [ ] Create store_items table
  - [ ] Design 10 themes (Default, Dark, Neon, Pastel, etc.)
  - [ ] Implement theme switching (CSS variables)
  - [ ] Store UI (browse, purchase with tokens/USD)
  - [ ] Inventory management (user_inventory table)
- [ ] **Achievement Expansion**:
  - [ ] Add 100 new achievements (variants, social, collection)
  - [ ] Variant-specific achievements
  - [ ] Store purchase achievements ("First Purchase", etc.)

**Deliverables**:
- ✅ Free users: 3 daily Classic
- ✅ Premium users: Unlimited Classic + 5 variants
- ✅ 10 purchasable themes
- ✅ 220+ total achievements

**Testing**:
- [ ] Puzzle generation quality (all variants)
- [ ] Puzzle request flow (free limit, premium unlimited)
- [ ] Variant validation (rules enforced correctly)
- [ ] Theme switching (persistence, visual correctness)
- [ ] Store purchase flow (tokens, USD)

---

### Phase 4: Social & Leagues (Month 7) 🏆
**Goal**: Launch leagues, leaderboards, events

**Tasks**:
- [ ] **League System**:
  - [ ] Create leagues table + league_members table
  - [ ] Official league tiers (Bronze → Legend)
  - [ ] Weekly promotion/demotion logic
  - [ ] Custom league creation (Premium feature)
  - [ ] League leaderboards (Redis + DB)
- [ ] **Global Leaderboards**:
  - [ ] Implement Redis leaderboards (daily, weekly, monthly)
  - [ ] Leaderboard UI (top 100, your rank)
  - [ ] Friend leaderboards
  - [ ] Variant-specific leaderboards
- [ ] **Events System** (Start Simple):
  - [ ] Create events table
  - [ ] Weekly challenge event (specific variant/difficulty)
  - [ ] Event participation tracking
  - [ ] Event rewards (tokens, badges)
  - [ ] Event UI (event calendar, current events)
- [ ] **Social Features**:
  - [ ] Friend activity feed
  - [ ] Challenge friend to puzzle
  - [ ] Social sharing (Twitter, Facebook)

**Deliverables**:
- ✅ Official competitive leagues live
- ✅ Custom leagues (Premium)
- ✅ Global leaderboards (daily, weekly, monthly, all-time)
- ✅ Weekly challenge events
- ✅ Social sharing functional

**Testing**:
- [ ] League promotion/demotion logic
- [ ] Leaderboard accuracy (Redis vs DB)
- [ ] Event reward distribution
- [ ] Social sharing (Open Graph cards)

---

### Phase 5: Education (Month 8) 📚
**Goal**: Launch tutorial system, technique practice

**Tasks**:
- [ ] **Tutorial System**:
  - [ ] Create tutorial_courses, tutorial_lessons tables
  - [ ] Write content for Beginner course (6 lessons)
  - [ ] Write content for Intermediate course (8 lessons)
  - [ ] Write content for Advanced course (10 lessons, Premium)
  - [ ] Interactive examples (embedded Sudoku grids)
  - [ ] Practice puzzle generation (technique-specific)
- [ ] **XP & Leveling**:
  - [ ] Add XP, level columns to users table
  - [ ] XP earning logic (lessons, practice, puzzles)
  - [ ] Level-up rewards (tokens, badges)
  - [ ] XP display in UI
- [ ] **Tutorial UI**:
  - [ ] Course browser page
  - [ ] Lesson viewer (Markdown renderer)
  - [ ] Practice puzzle interface
  - [ ] Progress tracking

**Deliverables**:
- ✅ Beginner course (6 lessons, FREE)
- ✅ Intermediate course (3 free + 5 premium)
- ✅ Advanced course (10 lessons, PREMIUM)
- ✅ XP & leveling system
- ✅ 200+ technique-specific practice puzzles

**Testing**:
- [ ] Tutorial content quality (proofread, test examples)
- [ ] Practice puzzle difficulty (technique required)
- [ ] XP earning (correct amounts, no exploits)
- [ ] Tutorial progress persistence

---

### Phase 6: Polish & Optimization (Month 9) ✨
**Goal**: Refine UX, optimize performance, prepare for marketing

**Tasks**:
- [ ] **Performance Optimization**:
  - [ ] Implement aggressive caching (Redis)
  - [ ] Optimize database queries (add indexes)
  - [ ] CDN for static assets (Cloudflare)
  - [ ] Image optimization (avatars, themes)
  - [ ] Code splitting (reduce bundle size)
- [ ] **UX Improvements**:
  - [ ] Onboarding flow for new users (tutorial, prompts)
  - [ ] Tooltips for first-time features
  - [ ] Improved mobile UI (gestures, responsive)
  - [ ] Loading states, error handling
  - [ ] Accessibility improvements (ARIA, keyboard nav)
- [ ] **Admin Panel**:
  - [ ] Dashboard for analytics (PostHog embed)
  - [ ] User management (ban, grant tokens)
  - [ ] Event creation UI
  - [ ] Content management (puzzles, lessons)
- [ ] **SEO**:
  - [ ] Meta tags (Open Graph, Twitter Cards)
  - [ ] Sitemap generation
  - [ ] Schema.org markup (GameApplication)
  - [ ] Blog (SEO content: "How to solve Sudoku", etc.)

**Deliverables**:
- ✅ Sub-2s page load globally
- ✅ Smooth onboarding for new users
- ✅ Admin panel for management
- ✅ SEO-optimized (ready for Google ranking)

**Testing**:
- [ ] Lighthouse scores (Performance, SEO, Accessibility)
- [ ] Load testing (1000+ concurrent users)
- [ ] Mobile testing (iOS, Android)
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)

---

### Phase 7: Soft Launch (Month 10) 🚀
**Goal**: Invite-only beta, gather feedback, iterate

**Tasks**:
- [ ] **Beta Program**:
  - [ ] Invite 100-500 beta users (Reddit, social media)
  - [ ] Collect feedback (surveys, interviews)
  - [ ] Monitor analytics closely (funnels, retention)
  - [ ] Fix critical bugs
  - [ ] A/B test pricing, upsells
- [ ] **Marketing Prep**:
  - [ ] Create marketing site (landing page)
  - [ ] Write launch blog post
  - [ ] Prepare social media content
  - [ ] Reach out to influencers (puzzle YouTubers)
- [ ] **Community Building**:
  - [ ] Create Discord server
  - [ ] Active engagement (respond to feedback)
  - [ ] Showcase user achievements
  - [ ] Build hype for public launch

**Deliverables**:
- ✅ 100-500 active beta users
- ✅ Feedback incorporated (UX improvements)
- ✅ Marketing materials ready
- ✅ Community started (Discord)

**Success Metrics**:
- D1 retention > 40%
- D7 retention > 20%
- Free → Premium conversion > 5%
- Average session duration > 15 minutes
- NPS score > 40

---

### Phase 8: Public Launch (Month 11) 🎉
**Goal**: Open to public, execute marketing plan

**Tasks**:
- [ ] **Launch**:
  - [ ] Remove invite-only restriction
  - [ ] Launch blog post (Medium, dev.to)
  - [ ] Post on Reddit (r/sudoku, r/puzzles, r/webdev)
  - [ ] Post on Hacker News
  - [ ] Post on Product Hunt
  - [ ] Social media campaign (Twitter, Facebook, Instagram)
- [ ] **PR**:
  - [ ] Submit to puzzle blogs/sites
  - [ ] Reach out to YouTubers (CTC, Cracking the Cryptic)
  - [ ] Press release (if budget allows)
- [ ] **Paid Ads** (if budget):
  - [ ] Google Ads (search: "play sudoku online")
  - [ ] Facebook Ads (target: puzzle game players)
  - [ ] Reddit Ads (r/sudoku)

**Deliverables**:
- ✅ Public launch complete
- ✅ Initial marketing wave executed
- ✅ Monitoring scaled infrastructure

**Success Metrics** (First 30 days):
- 10,000+ registered users
- 1,000+ daily active users
- 5%+ conversion to Premium
- $5,000+ MRR

---

### Phase 9: Growth & Iteration (Month 12+) 📈
**Goal**: Optimize, expand features, scale

**Ongoing Tasks**:
- [ ] **Content Expansion**:
  - [ ] Add remaining 10 puzzle variants
  - [ ] Weekly new themes (drip content)
  - [ ] Monthly new courses/lessons
  - [ ] Seasonal events (Valentine's, Halloween, Christmas)
- [ ] **Feature Iteration**:
  - [ ] Analyze data (what's working, what's not)
  - [ ] A/B test everything (pricing, UI, features)
  - [ ] Implement top user requests
  - [ ] Refine monetization (optimize conversions)
- [ ] **Marketing**:
  - [ ] SEO content (blog posts, guides)
  - [ ] Influencer partnerships
  - [ ] Referral program (viral growth)
  - [ ] App store submission (PWA → native apps?)
- [ ] **Scale**:
  - [ ] Upgrade infrastructure as needed
  - [ ] Add CDN for global performance
  - [ ] Consider multi-region database (CockroachDB?)
  - [ ] Hire support team (if growing fast)

**Long-Term Goals**:
- 100,000 users (Month 18)
- 1,000,000 users (Month 24-36)
- $1M+ ARR
- #1 Sudoku site globally

---

## 🛠️ Implementation Details

### File Structure (Evolved)

```
the-new-london-times/
├── public/
│   ├── index.html
│   ├── auth.html
│   ├── profile.html          [NEW]
│   ├── friends.html           [NEW]
│   ├── leagues.html           [NEW]
│   ├── store.html             [NEW]
│   ├── tutorials.html         [NEW]
│   ├── events.html            [NEW]
│   └── pricing.html           [NEW]
│
├── css/
│   ├── main.css               (existing)
│   ├── themes/                [NEW]
│   │   ├── default.css
│   │   ├── dark.css
│   │   ├── neon.css
│   │   └── ... (10 themes)
│   └── components/            [NEW]
│       ├── modal.css
│       ├── card.css
│       └── ...
│
├── js/
│   ├── core/                  [REFACTORED]
│   │   ├── app.js
│   │   ├── sudoku.js
│   │   ├── auth.js            [NEW]
│   │   └── config.js          [NEW]
│   ├── features/              [NEW]
│   │   ├── achievements.js
│   │   ├── analytics.js
│   │   ├── leagues.js         [NEW]
│   │   ├── store.js           [NEW]
│   │   ├── tutorials.js       [NEW]
│   │   ├── events.js          [NEW]
│   │   └── social.js          [NEW]
│   ├── ui/                    [NEW]
│   │   ├── modal.js
│   │   ├── toast.js
│   │   └── components.js
│   └── utils/                 [NEW]
│       ├── api.js
│       ├── storage.js
│       └── helpers.js
│
├── api/
│   ├── auth/                  [NEW]
│   │   ├── signup.js
│   │   ├── login.js
│   │   └── webhook.js         (Clerk webhooks)
│   ├── users/                 [NEW]
│   │   ├── profile.js
│   │   ├── friends.js
│   │   └── inventory.js
│   ├── puzzles/
│   │   ├── daily.js           (existing, refactored)
│   │   ├── library.js         [NEW]
│   │   ├── variants.js        [NEW]
│   │   └── generate.js        [NEW]
│   ├── leagues/               [NEW]
│   │   ├── official.js
│   │   ├── custom.js
│   │   └── leaderboards.js
│   ├── store/                 [NEW]
│   │   ├── items.js
│   │   ├── purchase.js
│   │   └── tokens.js
│   ├── tutorials/             [NEW]
│   │   ├── courses.js
│   │   ├── progress.js
│   │   └── practice.js
│   ├── events/                [NEW]
│   │   ├── active.js
│   │   └── participate.js
│   ├── payments/              [NEW]
│   │   ├── checkout.js
│   │   ├── webhook.js         (Stripe)
│   │   └── subscriptions.js
│   ├── analytics/             [NEW]
│   │   ├── track.js
│   │   └── admin.js
│   └── _shared/               [NEW]
│       ├── middleware.js      (auth, rate limiting)
│       ├── validation.js
│       └── db.js
│
├── lib/                       [NEW]
│   ├── generators/
│   │   ├── classic.js
│   │   ├── killer.js
│   │   ├── samurai.js
│   │   └── ... (15 variants)
│   ├── solvers/
│   │   ├── classic.js
│   │   └── ... (variant-specific)
│   └── validators/
│       └── ... (variant-specific)
│
├── migrations/                [NEW]
│   ├── 001_initial.sql
│   ├── 002_social.sql
│   ├── 003_monetization.sql
│   └── ...
│
├── tests/
│   ├── api/                   (existing, expand)
│   ├── e2e/                   (existing, expand)
│   ├── unit/                  [NEW]
│   │   ├── generators/
│   │   ├── solvers/
│   │   └── ...
│   └── integration/           [NEW]
│
├── docs/                      [NEW]
│   ├── API.md                 (API documentation)
│   ├── ARCHITECTURE.md        (system architecture)
│   ├── MONETIZATION.md        (monetization strategy)
│   └── CONTRIBUTING.md
│
├── .env.local
├── .env.example
├── package.json
├── vercel.json
├── CLAUDE.md                  (updated with new rules)
├── README.md                  (updated)
├── TRANSFORMATION_PLAN.md     (this file)
└── SECURITY.md

Total files: ~150 (from 42)
Total lines of code: ~100,000 (from 22,000)
```

---

### Key Technical Decisions

#### 1. Why Vanilla JS (No React/Vue/Svelte)?
**Reasons to KEEP vanilla JS**:
- ✅ **Zero dependencies** (faster load times)
- ✅ **Full control** (no framework constraints)
- ✅ **Easy to maintain** (no breaking changes from framework updates)
- ✅ **Perfect for Vercel** (static files + serverless)
- ✅ **Already proven** (current codebase is clean, fast)

**When to consider framework** (future):
- If team grows (React more common knowledge)
- If UI becomes extremely complex (state management nightmare)
- If you want React Native mobile apps (code sharing)

**Verdict**: Stick with vanilla JS for now. Re-evaluate at 100K users.

---

#### 2. Database: PostgreSQL vs Others?
**PostgreSQL (Neon) is PERFECT because**:
- ✅ Relational data (users, friends, leagues, etc.)
- ✅ ACID compliance (critical for payments)
- ✅ JSON support (flexible for preferences, event data)
- ✅ Full-text search (puzzle tags, user search)
- ✅ Mature ecosystem (tooling, ORMs)

**Alternatives considered**:
- **Firebase**: Too expensive at scale, vendor lock-in
- **MongoDB**: Doesn't fit relational data well (friends, leagues)
- **Supabase**: You mentioned it's limiting (Neon is better)

**Verdict**: PostgreSQL on Neon. Perfect fit.

---

#### 3. Caching Strategy
**Redis (Vercel KV) for**:
- Leaderboards (ZADD/ZRANGE = O(log n))
- Session data (fast reads)
- Rate limiting (INCR with TTL)
- Hot data (trending puzzles, active leagues)

**PostgreSQL for**:
- Source of truth (all data)
- Historical data (past leaderboards)
- Complex queries (analytics, reports)

**Pattern**:
```
User requests leaderboard
  ↓
Check Redis (cache hit? return)
  ↓
Cache miss → Query PostgreSQL
  ↓
Store in Redis (TTL 5 minutes)
  ↓
Return to user
```

---

#### 4. Authentication: Why Clerk?
**Clerk over Auth0, Firebase, custom**:
- ✅ Best UX (embeddable components, beautiful UI)
- ✅ Free tier (10K MAUs = plenty for start)
- ✅ Social auth built-in (Google, Facebook, Apple)
- ✅ User management dashboard (view/ban users)
- ✅ Webhooks (sync to our DB automatically)
- ✅ Modern DX (great docs, support)

**Implementation**:
```javascript
// Frontend: Clerk React components (if using React) or Vanilla JS SDK
<SignIn routing="path" path="/sign-in" />

// Backend: Verify JWT
import { verifyToken } from '@clerk/clerk-sdk-node';
const userId = await verifyToken(req.headers.authorization);
```

---

#### 5. Payment Processing: Stripe
**Why Stripe**:
- ✅ Industry standard
- ✅ No monthly fee (pay per transaction)
- ✅ Subscriptions built-in (recurring billing, dunning)
- ✅ Global payment methods
- ✅ Excellent documentation
- ✅ Fraud prevention (Radar)

**Implementation**:
```javascript
// Create subscription
const session = await stripe.checkout.sessions.create({
  customer_email: user.email,
  mode: 'subscription',
  line_items: [{
    price: 'price_premium_monthly',
    quantity: 1
  }],
  success_url: 'https://app.com/success',
  cancel_url: 'https://app.com/pricing'
});

// Webhook handling
app.post('/api/payments/webhook', async (req) => {
  const event = stripe.webhooks.constructEvent(req.body, sig, secret);

  if (event.type === 'customer.subscription.created') {
    await db.updateUser(event.data.object.customer, {
      subscription_tier: 'premium',
      subscription_expires_at: new Date(event.data.object.current_period_end * 1000)
    });
  }
});
```

---

## 💵 Cost Analysis & Scaling

### Infrastructure Costs Over Time

#### Year 1 Breakdown

**Months 1-3** (0-1K users):
- **Neon**: $0 (free tier)
- **Vercel**: $0 (hobby plan)
- **Clerk**: $0 (< 10K MAUs)
- **PostHog**: $0 (< 1M events)
- **Stripe**: $0 base + 2.9% per transaction
- **Total**: **$0/month** (minus transaction fees)

**Months 4-6** (1K-10K users):
- **Neon**: $0 still (10GB enough)
- **Vercel**: $20 (Pro plan for better analytics)
- **Clerk**: $0 still
- **PostHog**: $0 still
- **Stripe**: $0 base + fees
- **Total**: **$20/month**

**Revenue** (5K users, 5% conversion):
- 250 Premium @ $4.99 = $1,247/mo
- 5% microtransactions (250 users × $3) = $750/mo
- Ads (4,750 free users × 10 views/day × $1.50 CPM) = $2,137/mo
- **Total**: **$4,134/month**
- **Profit**: $4,114/month 🎉

**Months 7-12** (10K-100K users):
- **Neon**: $19 (scale plan)
- **Vercel**: $20 (Pro)
- **Clerk**: $25 (10K-50K MAUs)
- **PostHog**: $0 still (events within limit)
- **CDN (Cloudflare)**: $20 (Pro)
- **Stripe**: $0 base + fees
- **Total**: **$84/month**

**Revenue** (50K users, 8% conversion):
- 4,000 Premium @ $4.99 = $19,960/mo
- 5% microtransactions (2,500 × $4) = $10,000/mo
- Ads (46K free × 10 views/day × $1.50 CPM) = $20,700/mo
- **Total**: **$50,660/month** ($608K/year)
- **Profit**: $50,576/month 🚀

---

#### Year 2 Projection (100K-1M users)

**Infrastructure at 500K users**:
- **Neon**: $69 (scale plan)
- **Vercel**: $400 (Enterprise)
- **Clerk**: $99 (up to 500K MAUs)
- **PostHog**: $450 (10M events)
- **CDN**: $20 (Cloudflare Pro)
- **Upstash Redis**: $30 (if outgrow Vercel KV)
- **Support Tools**: $100 (Intercom, Zendesk)
- **Total**: **$1,168/month**

**Revenue** (500K users, 8% conversion):
- 40,000 Premium @ $4.99 = $199,600/mo
- 10,000 microtransactions × $5 = $50,000/mo
- Ads (460K free × 10 views × $1.50 CPM) = $207,000/mo
- **Total**: **$456,600/month** ($5.48M/year ARR)
- **Profit**: $455,432/month ($5.47M/year) 🤯

---

### Revenue Optimization Strategies

**Increase Conversion (Free → Premium)**:
- Better onboarding (show value immediately)
- Limited-time offers (first month 50% off)
- Social proof (X users upgraded this week)
- Upsells at friction points (daily limit reached)
- A/B test pricing ($3.99 vs $4.99 vs $5.99)

**Increase ARPU (Average Revenue Per User)**:
- Token packs (consumable, recurring purchase)
- Limited edition themes (FOMO)
- Battle passes (seasonal, Fortnite-style)
- Gift subscriptions (virality)

**Reduce Churn**:
- Streak preservation (don't lose your 30-day streak!)
- Exit surveys (understand why users cancel)
- Winback campaigns (50% off to return)
- Annual pricing (lock in for 12 months)

---

## 🎯 Success Metrics

### North Star Metric
**Daily Active Users (DAU)** - measures engagement

### Key Performance Indicators (KPIs)

**Acquisition**:
- New signups per day
- Signup conversion rate (visitor → user)
- Traffic sources (organic, paid, social, referral)
- CAC (Customer Acquisition Cost)

**Engagement**:
- DAU, WAU, MAU
- Retention (D1, D7, D30)
- Average session duration
- Puzzles per session
- Daily streak length

**Monetization**:
- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)
- Conversion rate (free → premium)
- Churn rate
- LTV (Lifetime Value)

**Product**:
- Puzzle completion rate
- Tutorial completion rate
- Achievement unlock rate
- Event participation rate
- Friend adds per user

---

## 🚨 Risks & Mitigation

### Technical Risks

**Risk**: Database becomes bottleneck at scale
**Mitigation**: Neon auto-scales, add read replicas if needed, Redis caching

**Risk**: Vercel serverless cold starts
**Mitigation**: Keep functions warm (cron ping), upgrade to Enterprise for dedicated instances

**Risk**: Puzzle generation can't keep up with demand
**Mitigation**: Pre-generate 1000s of puzzles in background, background workers on Railway/Render

### Business Risks

**Risk**: Low conversion (free → premium)
**Mitigation**: A/B test pricing/features, improve onboarding, add more value

**Risk**: High churn (users cancel subscriptions)
**Mitigation**: Engagement features (streaks, events), exit surveys, winback campaigns

**Risk**: Ad revenue lower than expected
**Mitigation**: Optimize ad placements, try multiple networks, focus on subscriptions

### Market Risks

**Risk**: Competitors (NYT, Chess.com) launch better Sudoku
**Mitigation**: Move fast, build community, differentiate (education, variants, social)

**Risk**: Puzzle game fatigue (trends shift)
**Mitigation**: Continuous innovation (new variants, events), data-driven iteration

---

## 📝 Next Steps

**Immediate Actions** (This Week):
1. Review this plan with your partner
2. Set up Neon database (migrate from Vercel Postgres)
3. Set up PostHog analytics
4. Create development roadmap (Notion, Linear, GitHub Projects)
5. Set up staging environment

**Month 1 Goals**:
1. Complete Phase 0 (Foundation)
2. Start Phase 1 (User System)
3. Finalize feature prioritization
4. Begin UI mockups for new pages

**Questions to Answer**:
1. Launch timeline: Aggressive (6 mo) or conservative (12 mo)?
2. Premium pricing: $4.99 or test $3.99?
3. Ultra tier: Launch day 1 or wait for traction?
4. Mobile apps (PWA vs native): When?
5. Hiring: When to bring in help? (design, marketing, support)

---

## 🎊 Conclusion

This plan transforms your 2-player Sudoku arena into **the definitive global Sudoku platform**. You're not just scaling—you're building a gaming ecosystem with:

- 🎮 **Unlimited Content** (500K+ puzzles across 15 variants)
- 🏆 **Deep Competition** (leagues, leaderboards, events)
- 📚 **Comprehensive Education** (beginner to expert courses)
- 💰 **Proven Monetization** (F2P best practices)
- 🌍 **Global Scale** (1M+ users, multi-region)
- 📊 **Data-Driven** (track everything, optimize relentlessly)

**You have an incredible foundation.** Your code is clean, your architecture is solid, and your vision is clear. This plan gives you the roadmap to build the **#1 Sudoku site globally**.

**Let's build something legendary.** 🚀🧩👑

---

**Document Version**: 1.0
**Last Updated**: December 2025
**Authors**: Claude Code + Filip
**Status**: Ready for Review

---

**Questions?** Review each phase, ask questions, then let's start implementing! 💪
