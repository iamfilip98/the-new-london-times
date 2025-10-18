# Development Guidelines for Claude

## Critical Rules
1. **README is Source of Truth**: Every code change MUST be reflected in README.md
2. **Update README with Every Change**: Algorithm, scoring, features, API - document everything
3. **No Hardcoding**: All puzzles come from pre-generated database, zero fallbacks
4. **Gameplay-Driven Validation**: Validation must match actual gameplay experience
5. **Pre-Generation Pattern**: Never generate puzzles on-demand for users

## Clue Counts - Single Source of Truth

These values are FINAL and should NEVER be changed without explicit user approval:

```javascript
const CLUE_COUNTS = {
  easy: 42,    // 39 empty cells - PERFECT, do not change
  medium: 25,  // 56 empty cells - was 24, now 25 per user feedback
  hard: 19     // 62 empty cells - was 18, now 19 per user feedback
};
```

## Gameplay Requirements (Never Compromise)

### Easy Difficulty
**Goal**: "Playable without candidates, challenging but smooth"

**MUST**:
- Be solvable WITHOUT candidate tracking
- Have smooth progression (1-3 obvious moves always available)
- Have 15+ naked singles throughout the solve
- Have 0-2 hidden techniques (adds slight challenge)
- Have 0 bottlenecks (smooth flow)

### Medium Difficulty
**Goal**: "Requires candidates, forces thinking, can't see next move immediately"

**MUST**:
- REQUIRE candidate tracking to solve
- Have max 2 naked singles available at any point (forces pause)
- Have 5+ moments where player must mark candidates to proceed
- Require 3-5 hidden techniques (pattern recognition)
- Have 1-2 bottlenecks (pause and think moments)
- NOT require candidate elimination (only tracking)

### Hard Difficulty
**Goal**: "Requires candidates, MUST eliminate candidates to progress"

**MUST**:
- REQUIRE candidate elimination techniques
- Have high candidate density early (avg 4+ candidates per cell in first 20 moves)
- Require elimination techniques at least 3 times
- Have very few naked singles early (max 3 in first 20 moves)
- Require 4-6 hidden techniques (complex pattern recognition)
- Have 2-4 bottlenecks (multiple challenging decision points)

## Pre-Generation System

### Architecture
**OLD**: Generate puzzles on-demand when user requests (causes timeouts)
**NEW**: Generate puzzles at 11 PM daily for NEXT day (allows strict quality control)

### Flow
1. **11:00 PM**: Scheduled job starts
2. **11:00-11:10 PM**: Generate and validate 100-200 candidates per difficulty
3. **11:10 PM**: Select best puzzles, store in database
4. **12:00 AM**: New puzzles available to players instantly

## Target Solve Times

```javascript
const targetTimes = {
  easy: 210,    // 3:30
  medium: 180,  // 3:00
  hard: 420     // 7:00
};
```

## Success Criteria

- ✅ Puzzles pre-generated at 11 PM daily
- ✅ Zero hardcoded puzzles
- ✅ Zero dead code
- ✅ Validation matches gameplay experience
- ✅ Users get instant load times
- ✅ README is 100% accurate
- ✅ Easy playable without candidates
- ✅ Medium requires candidates and thinking
- ✅ Hard requires candidate elimination
- ✅ All clue counts match targets (42/25/19)
