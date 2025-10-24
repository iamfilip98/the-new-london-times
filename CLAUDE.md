# Development Guidelines for Claude

## Critical Rules
1. **README is Source of Truth**: Every code change MUST be reflected in README.md
2. **Update README with Every Change**: Algorithm, scoring, features, API - document everything
3. **No Hardcoding**: All puzzles come from pre-generated database, zero fallbacks
4. **Gameplay-Driven Validation**: Validation must match actual gameplay experience
5. **Pre-Generation Pattern**: Never generate puzzles on-demand for users
6. **Git Workflow**: After making code changes, commit with a meaningful message and push to git

## Clue Counts - Single Source of Truth

These values are FINAL and should NEVER be changed without explicit user approval:

```javascript
const CLUE_COUNTS = {
  easy: 42,    // 39 empty cells - PERFECT, do not change
  medium: 28,  // 53 empty cells - requires candidates, forces thinking
  hard: 25     // 56 empty cells - challenging but fair (adjusted from 24)
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
**Goal**: "Requires candidates, forces thinking, smooth but not trivial"

**MUST**:
- REQUIRE candidate tracking to solve
- Have moderate candidate density early (avg 2.5-3.3 candidates per cell in first 20 moves)
- Have decent naked singles early (6-15 in first 20 moves - progress without being easy)
- Have 2-4 immediate naked singles at any point (consistent options)
- Hidden techniques are informational only (not used for validation)
- Bottlenecks are informational only (natural variation expected)

**VALIDATION ENSURES**:
- Day-to-day consistency in difficulty
- Requires candidates but provides smooth progression
- Forces thinking without getting stuck
- Clear separation from Easy (requires candidates) and Hard (harder metrics)

### Hard Difficulty
**Goal**: "Requires heavy candidate work, significantly harder than Medium"

**MUST**:
- REQUIRE candidate tracking to solve
- Have HIGH candidate density early (avg 3.4-5.0 candidates per cell in first 20 moves)
- Have VERY FEW naked singles early (max 5 in first 20 moves - forces candidate work)
- Have limited total naked singles (max 12 total - requires more thinking)
- Hidden techniques are informational only (not used for validation)
- Bottlenecks are informational only (natural variation expected)

**VALIDATION ENSURES**:
- Day-to-day consistency in difficulty
- Significantly harder than Medium (3.4+ candidates vs 3.3 max)
- Forces heavy candidate work (max 5 naked singles vs min 6 for Medium)
- Challenging but fair (playable within 7-minute target)
- Clear separation: Hard always has higher candidate density AND fewer naked singles

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
- ✅ Easy: Playable without candidates (comprehensive validation)
- ✅ Medium: Requires candidates and thinking (comprehensive validation)
- ✅ Hard: Challenging but fair (comprehensive validation)
- ✅ All clue counts match targets (42/28/25)
- ✅ Day-to-day consistency guaranteed across all difficulties
