class AchievementsManager {
    constructor() {
        this.needsInitialCleanup = true; // Flag to run cleanup once per session
        this.achievementDefinitions = [
            // STREAK ACHIEVEMENTS (10)
            {
                id: 'streak_3',
                title: 'Hot Start',
                description: 'Win 3 consecutive days',
                icon: 'fas fa-fire',
                type: 'streak',
                requirement: { type: 'win_streak', value: 3 },
                rarity: 'common'
            },
            {
                id: 'streak_5',
                title: 'Five-peat',
                description: 'Win 5 consecutive days',
                icon: 'fas fa-fire',
                type: 'streak',
                requirement: { type: 'win_streak', value: 5 },
                rarity: 'rare'
            },
            {
                id: 'streak_7',
                title: 'Lucky Seven',
                description: 'Win 7 consecutive days',
                icon: 'fas fa-dice-seven',
                type: 'streak',
                requirement: { type: 'win_streak', value: 7 },
                rarity: 'epic'
            },
            {
                id: 'streak_10',
                title: 'Dominator',
                description: 'Win 10 consecutive days',
                icon: 'fas fa-crown',
                type: 'streak',
                requirement: { type: 'win_streak', value: 10 },
                rarity: 'epic'
            },
            {
                id: 'streak_15',
                title: 'Unstoppable Force',
                description: 'Win 15 consecutive days',
                icon: 'fas fa-meteor',
                type: 'streak',
                requirement: { type: 'win_streak', value: 15 },
                rarity: 'legendary'
            },
            {
                id: 'streak_20',
                title: 'Sudoku Overlord',
                description: 'Win 20 consecutive days',
                icon: 'fas fa-crown',
                type: 'streak',
                requirement: { type: 'win_streak', value: 20 },
                rarity: 'legendary'
            },
            {
                id: 'streak_30',
                title: 'Month of Madness',
                description: 'Win 30 consecutive days',
                icon: 'fas fa-dragon',
                type: 'streak',
                requirement: { type: 'win_streak', value: 30 },
                rarity: 'legendary'
            },
            {
                id: 'streak_50',
                title: 'Dimension Breaker',
                description: 'Win 50 consecutive days (breaks the laws of probability)',
                icon: 'fas fa-infinity',
                type: 'streak',
                requirement: { type: 'win_streak', value: 50 },
                rarity: 'legendary'
            },
            {
                id: 'perfect_week',
                title: 'Perfect Week',
                description: 'Win all 7 days in a week',
                icon: 'fas fa-calendar-check',
                type: 'weekly',
                requirement: { type: 'weekly_sweep', value: 7 },
                rarity: 'epic'
            },
            {
                id: 'weekend_warrior',
                title: 'Weekend Warrior',
                description: 'Win both Saturday and Sunday',
                icon: 'fas fa-calendar-weekend',
                type: 'weekend',
                requirement: { type: 'weekend_sweep', value: 1 },
                rarity: 'common'
            },

            // SPEED ACHIEVEMENTS (12)
            {
                id: 'speed_walker_easy',
                title: 'Speed Walker (Easy)',
                description: 'Complete Easy under 3 minutes',
                icon: 'fas fa-walking',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'easy', value: 180 },
                rarity: 'common'
            },
            {
                id: 'speed_demon_easy',
                title: 'Speed Demon (Easy)',
                description: 'Complete Easy under 2 minutes',
                icon: 'fas fa-bolt',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'easy', value: 120 },
                rarity: 'rare'
            },
            {
                id: 'speed_racer_easy',
                title: 'Speed Racer (Easy)',
                description: 'Complete Easy under 1 minute',
                icon: 'fas fa-rocket',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'easy', value: 60 },
                rarity: 'epic'
            },
            {
                id: 'teleporter_easy',
                title: 'Teleporter (Easy)',
                description: 'Complete Easy under 30 seconds (almost impossible)',
                icon: 'fas fa-magic',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'easy', value: 30 },
                rarity: 'legendary'
            },
            {
                id: 'speed_demon_medium',
                title: 'Speed Demon (Medium)',
                description: 'Complete Medium under 5 minutes',
                icon: 'fas fa-bolt',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'medium', value: 300 },
                rarity: 'rare'
            },
            {
                id: 'speed_racer_medium',
                title: 'Speed Racer (Medium)',
                description: 'Complete Medium under 3 minutes',
                icon: 'fas fa-rocket',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'medium', value: 180 },
                rarity: 'epic'
            },
            {
                id: 'teleporter_medium',
                title: 'Teleporter (Medium)',
                description: 'Complete Medium under 2 minutes (superhuman)',
                icon: 'fas fa-magic',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'medium', value: 120 },
                rarity: 'legendary'
            },
            {
                id: 'speed_demon_hard',
                title: 'Speed Demon (Hard)',
                description: 'Complete Hard under 10 minutes',
                icon: 'fas fa-bolt',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'hard', value: 600 },
                rarity: 'epic'
            },
            {
                id: 'speed_racer_hard',
                title: 'Speed Racer (Hard)',
                description: 'Complete Hard under 5 minutes',
                icon: 'fas fa-rocket',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'hard', value: 300 },
                rarity: 'legendary'
            },
            {
                id: 'time_lord',
                title: 'Time Lord',
                description: 'Complete Hard under 3 minutes (defies physics)',
                icon: 'fas fa-clock',
                type: 'speed',
                requirement: { type: 'time_under', difficulty: 'hard', value: 180 },
                rarity: 'legendary'
            },
            {
                id: 'triple_threat',
                title: 'Triple Threat',
                description: 'Complete all 3 difficulties in under 15 minutes total',
                icon: 'fas fa-fire',
                type: 'speed',
                requirement: { type: 'total_time_under', value: 900 },
                rarity: 'epic'
            },
            {
                id: 'lightning_round',
                title: 'Lightning Round',
                description: 'Complete all 3 difficulties in under 8 minutes total',
                icon: 'fas fa-bolt',
                type: 'speed',
                requirement: { type: 'total_time_under', value: 480 },
                rarity: 'legendary'
            },

            // PERFECTION ACHIEVEMENTS (8)
            {
                id: 'flawless_easy',
                title: 'Flawless (Easy)',
                description: 'Complete Easy with 0 errors',
                icon: 'fas fa-star',
                type: 'perfect',
                requirement: { type: 'zero_errors', difficulty: 'easy', value: 1 },
                rarity: 'common'
            },
            {
                id: 'flawless_medium',
                title: 'Flawless (Medium)',
                description: 'Complete Medium with 0 errors',
                icon: 'fas fa-star',
                type: 'perfect',
                requirement: { type: 'zero_errors', difficulty: 'medium', value: 1 },
                rarity: 'rare'
            },
            {
                id: 'flawless_hard',
                title: 'Flawless (Hard)',
                description: 'Complete Hard with 0 errors',
                icon: 'fas fa-star',
                type: 'perfect',
                requirement: { type: 'zero_errors', difficulty: 'hard', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'perfectionist',
                title: 'Perfectionist',
                description: 'Complete a day with zero total errors',
                icon: 'fas fa-gem',
                type: 'perfect',
                requirement: { type: 'zero_errors_day', value: 1 },
                rarity: 'rare'
            },
            {
                id: 'perfectionist_week',
                title: 'Perfectionist Week',
                description: 'Complete 7 consecutive days with 0 total errors',
                icon: 'fas fa-diamond',
                type: 'perfect',
                requirement: { type: 'perfect_week', value: 7 },
                rarity: 'legendary'
            },
            {
                id: 'perfectionist_month',
                title: 'Perfectionist God',
                description: 'Complete 30 consecutive days with 0 total errors',
                icon: 'fas fa-crown',
                type: 'perfect',
                requirement: { type: 'perfect_month', value: 30 },
                rarity: 'legendary'
            },
            {
                id: 'triple_perfect',
                title: 'Triple Perfect',
                description: 'Complete all 3 difficulties with 0 errors in one day',
                icon: 'fas fa-trophy',
                type: 'perfect',
                requirement: { type: 'triple_perfect_day', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'machine_precision',
                title: 'Machine Precision',
                description: 'Get 10 perfect days in a row',
                icon: 'fas fa-robot',
                type: 'perfect',
                requirement: { type: 'perfect_streak', value: 10 },
                rarity: 'legendary'
            },

            // SCORE ACHIEVEMENTS (6)
            {
                id: 'point_collector',
                title: 'Point Collector',
                description: 'Score over 750 points in a single day',
                icon: 'fas fa-coins',
                type: 'score',
                requirement: { type: 'daily_score', value: 750 },
                rarity: 'common'
            },
            {
                id: 'high_scorer',
                title: 'High Scorer',
                description: 'Score over 1000 points in a single day',
                icon: 'fas fa-chart-line',
                type: 'score',
                requirement: { type: 'daily_score', value: 1000 },
                rarity: 'rare'
            },
            {
                id: 'score_master',
                title: 'Score Master',
                description: 'Score over 1500 points in a single day',
                icon: 'fas fa-trophy',
                type: 'score',
                requirement: { type: 'daily_score', value: 1500 },
                rarity: 'epic'
            },
            {
                id: 'point_overlord',
                title: 'Point Overlord',
                description: 'Score over 2000 points in a single day',
                icon: 'fas fa-crown',
                type: 'score',
                requirement: { type: 'daily_score', value: 2000 },
                rarity: 'legendary'
            },
            {
                id: 'clutch_performer',
                title: 'Clutch Performer',
                description: 'Win by exactly 1 point',
                icon: 'fas fa-crosshairs',
                type: 'score',
                requirement: { type: 'close_win', value: 1 },
                rarity: 'rare'
            },
            {
                id: 'dominator_daily',
                title: 'Daily Dominator',
                description: 'Win with 2x opponent\'s score',
                icon: 'fas fa-crown',
                type: 'score',
                requirement: { type: 'dominating_win', value: 2 },
                rarity: 'epic'
            },

            // CONSISTENCY & MILESTONE ACHIEVEMENTS (6)
            {
                id: 'getting_started',
                title: 'Getting Started',
                description: 'Complete 7 days of competition',
                icon: 'fas fa-play',
                type: 'consistency',
                requirement: { type: 'total_days', value: 7 },
                rarity: 'common',
                oneTime: true
            },
            {
                id: 'consistent_performer',
                title: 'Consistent Performer',
                description: 'Complete 30 days of competition',
                icon: 'fas fa-calendar',
                type: 'consistency',
                requirement: { type: 'total_days', value: 30 },
                rarity: 'rare',
                oneTime: true
            },
            {
                id: 'dedicated_competitor',
                title: 'Dedicated Competitor',
                description: 'Complete 100 days of competition',
                icon: 'fas fa-medal',
                type: 'consistency',
                requirement: { type: 'total_days', value: 100 },
                rarity: 'epic',
                oneTime: true
            },
            {
                id: 'sudoku_veteran',
                title: 'Sudoku Veteran',
                description: 'Complete 365 days of competition',
                icon: 'fas fa-shield',
                type: 'consistency',
                requirement: { type: 'total_days', value: 365 },
                rarity: 'legendary',
                oneTime: true
            },
            {
                id: 'consistency_king',
                title: 'Consistency King',
                description: 'Have all 3 difficulties within 10% of each other',
                icon: 'fas fa-balance-scale',
                type: 'consistency',
                requirement: { type: 'balanced_times', value: 0.1 },
                rarity: 'rare'
            },
            {
                id: 'precision_machine',
                title: 'Precision Machine',
                description: 'Have all 3 difficulties within 5% of each other',
                icon: 'fas fa-cog',
                type: 'consistency',
                requirement: { type: 'balanced_times', value: 0.05 },
                rarity: 'epic'
            },

            // QUIRKY & FUN ACHIEVEMENTS (25)
            {
                id: 'comeback_kid',
                title: 'Comeback Kid',
                description: 'Win after losing 3 days in a row',
                icon: 'fas fa-undo',
                type: 'comeback',
                requirement: { type: 'comeback_win', value: 3 },
                rarity: 'rare'
            },
            {
                id: 'comeback_legend',
                title: 'Comeback Legend',
                description: 'Win after losing 5 days in a row',
                icon: 'fas fa-phoenix-squadron',
                type: 'comeback',
                requirement: { type: 'comeback_win', value: 5 },
                rarity: 'epic'
            },
            {
                id: 'phoenix_rising',
                title: 'Phoenix Rising',
                description: 'Win after losing 7 days in a row (legendary comeback)',
                icon: 'fas fa-feather',
                type: 'comeback',
                requirement: { type: 'comeback_win', value: 7 },
                rarity: 'legendary'
            },
            {
                id: 'dnf_survivor',
                title: 'DNF Survivor',
                description: 'Win despite having a DNF',
                icon: 'fas fa-shield-alt',
                type: 'comeback',
                requirement: { type: 'win_with_dnf', value: 1 },
                rarity: 'rare'
            },
            {
                id: 'error_magnet',
                title: 'Error Magnet',
                description: 'Make 20+ errors in a single day',
                icon: 'fas fa-exclamation-triangle',
                type: 'errors',
                requirement: { type: 'total_errors_over', value: 20 },
                rarity: 'common'
            },
            {
                id: 'chaos_generator',
                title: 'Chaos Generator',
                description: 'Make 30+ errors in a single day',
                icon: 'fas fa-tornado',
                type: 'errors',
                requirement: { type: 'total_errors_over', value: 30 },
                rarity: 'rare'
            },
            {
                id: 'error_explosion',
                title: 'Error Explosion',
                description: 'Make 50+ errors in a single day (how is this possible?)',
                icon: 'fas fa-bomb',
                type: 'errors',
                requirement: { type: 'total_errors_over', value: 50 },
                rarity: 'legendary'
            },
            {
                id: 'methodical_solver',
                title: 'Methodical Solver',
                description: 'Take over 15 minutes on Hard (thinking it through)',
                icon: 'fas fa-brain',
                type: 'patience',
                requirement: { type: 'time_over', difficulty: 'hard', value: 900 },
                rarity: 'common'
            },
            {
                id: 'perfectionist_patience',
                title: 'Perfectionist Patience',
                description: 'Take over 20 minutes on Hard (maximum dedication)',
                icon: 'fas fa-clock',
                type: 'patience',
                requirement: { type: 'time_over', difficulty: 'hard', value: 1200 },
                rarity: 'rare'
            },
            {
                id: 'zen_master',
                title: 'Zen Master',
                description: 'Take over 30 minutes on Hard (ultimate patience)',
                icon: 'fas fa-meditation',
                type: 'patience',
                requirement: { type: 'time_over', difficulty: 'hard', value: 1800 },
                rarity: 'epic'
            },
            {
                id: 'error_recovery',
                title: 'Error Recovery Master',
                description: 'Win a day despite making 10+ errors',
                icon: 'fas fa-first-aid',
                type: 'errors',
                requirement: { type: 'win_with_errors', value: 10 },
                rarity: 'epic'
            },
            {
                id: 'night_owl',
                title: 'Night Owl',
                description: 'Complete a puzzle after 10 PM',
                icon: 'fas fa-moon',
                type: 'timing',
                requirement: { type: 'late_submission', value: 22 },
                rarity: 'common'
            },
            {
                id: 'early_bird',
                title: 'Early Bird',
                description: 'Complete a puzzle before 7 AM',
                icon: 'fas fa-sun',
                type: 'timing',
                requirement: { type: 'early_submission', value: 7 },
                rarity: 'common'
            },
            {
                id: 'midnight_warrior',
                title: 'Midnight Warrior',
                description: 'Complete a puzzle after midnight',
                icon: 'fas fa-star',
                type: 'timing',
                requirement: { type: 'late_submission', value: 24 },
                rarity: 'rare'
            },
            {
                id: 'weekend_specialist',
                title: 'Weekend Specialist',
                description: 'Win 10 weekend battles',
                icon: 'fas fa-calendar-weekend',
                type: 'timing',
                requirement: { type: 'weekend_wins', value: 10 },
                rarity: 'epic'
            },
            {
                id: 'monday_blues',
                title: 'Monday Blues Fighter',
                description: 'Win 5 Monday battles',
                icon: 'fas fa-coffee',
                type: 'timing',
                requirement: { type: 'monday_wins', value: 5 },
                rarity: 'rare'
            },
            {
                id: 'friday_finisher',
                title: 'Friday Finisher',
                description: 'Win 5 Friday battles',
                icon: 'fas fa-glass-cheers',
                type: 'timing',
                requirement: { type: 'friday_wins', value: 5 },
                rarity: 'rare'
            },
            {
                id: 'lucky_thirteen',
                title: 'Lucky Thirteen',
                description: 'Win on Friday the 13th',
                icon: 'fas fa-cat',
                type: 'timing',
                requirement: { type: 'friday_13th_win', value: 1 },
                rarity: 'legendary'
            },
            {
                id: 'new_year_champion',
                title: 'New Year Champion',
                description: 'Win on January 1st',
                icon: 'fas fa-fireworks',
                type: 'timing',
                requirement: { type: 'new_year_win', value: 1 },
                rarity: 'legendary'
            },
            {
                id: 'birthday_bash',
                title: 'Birthday Bash',
                description: 'Win on your birthday (custom date)',
                icon: 'fas fa-birthday-cake',
                type: 'timing',
                requirement: { type: 'birthday_win', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'data_analyst',
                title: 'Data Analyst',
                description: 'Check analytics page 10 times',
                icon: 'fas fa-chart-bar',
                type: 'meta',
                requirement: { type: 'analytics_visits', value: 10 },
                rarity: 'common'
            },
            {
                id: 'achievement_hunter',
                title: 'Achievement Hunter',
                description: 'Check achievements page 25 times',
                icon: 'fas fa-trophy',
                type: 'meta',
                requirement: { type: 'achievements_visits', value: 25 },
                rarity: 'rare'
            },
            {
                id: 'social_butterfly',
                title: 'Social Butterfly',
                description: 'Switch between players 50 times',
                icon: 'fas fa-exchange-alt',
                type: 'meta',
                requirement: { type: 'player_switches', value: 50 },
                rarity: 'epic'
            },
            {
                id: 'procrastinator',
                title: 'Master Procrastinator',
                description: 'Take exactly 42 minutes on any puzzle',
                icon: 'fas fa-hourglass-half',
                type: 'quirky',
                requirement: { type: 'exact_time', value: 2520 },
                rarity: 'legendary'
            },
            {
                id: 'mirror_match',
                title: 'Mirror Match',
                description: 'Have identical scores with opponent',
                icon: 'fas fa-mirror',
                type: 'quirky',
                requirement: { type: 'identical_scores', value: 1 },
                rarity: 'epic'
            }
            ,

            // SEASONAL & HOLIDAY ACHIEVEMENTS (15)
            {
                id: 'valentines_winner',
                title: 'Love Wins',
                description: 'Win on Valentine\'s Day',
                icon: 'fas fa-heart',
                type: 'seasonal',
                requirement: { type: 'valentines_win', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'halloween_master',
                title: 'Spooky Solver',
                description: 'Win on Halloween',
                icon: 'fas fa-ghost',
                type: 'seasonal',
                requirement: { type: 'halloween_win', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'christmas_champion',
                title: 'Christmas Champion',
                description: 'Win on Christmas Day',
                icon: 'fas fa-tree',
                type: 'seasonal',
                requirement: { type: 'christmas_win', value: 1 },
                rarity: 'legendary'
            },
            {
                id: 'thanksgiving_gratitude',
                title: 'Thankful Solver',
                description: 'Win on Thanksgiving',
                icon: 'fas fa-turkey',
                type: 'seasonal',
                requirement: { type: 'thanksgiving_win', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'spring_awakening',
                title: 'Spring Awakening',
                description: 'Win on first day of spring',
                icon: 'fas fa-seedling',
                type: 'seasonal',
                requirement: { type: 'spring_equinox_win', value: 1 },
                rarity: 'rare'
            },
            {
                id: 'summer_solstice',
                title: 'Summer Solstice',
                description: 'Win on longest day of the year',
                icon: 'fas fa-sun',
                type: 'seasonal',
                requirement: { type: 'summer_solstice_win', value: 1 },
                rarity: 'rare'
            },
            {
                id: 'winter_warrior',
                title: 'Winter Warrior',
                description: 'Win on winter solstice',
                icon: 'fas fa-snowflake',
                type: 'seasonal',
                requirement: { type: 'winter_solstice_win', value: 1 },
                rarity: 'rare'
            },
            {
                id: 'april_fools',
                title: 'No Joke',
                description: 'Win on April Fool\'s Day',
                icon: 'fas fa-laugh',
                type: 'seasonal',
                requirement: { type: 'april_fools_win', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'pi_day_precision',
                title: 'Pi Day Precision',
                description: 'Win on Pi Day (March 14)',
                icon: 'fas fa-pi',
                type: 'seasonal',
                requirement: { type: 'pi_day_win', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'leap_year_legend',
                title: 'Leap Year Legend',
                description: 'Win on February 29th',
                icon: 'fas fa-calendar-plus',
                type: 'seasonal',
                requirement: { type: 'leap_day_win', value: 1 },
                rarity: 'legendary'
            },
            {
                id: 'independence_solver',
                title: 'Independence Solver',
                description: 'Win on July 4th',
                icon: 'fas fa-flag-usa',
                type: 'seasonal',
                requirement: { type: 'july_4th_win', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'eclipse_master',
                title: 'Eclipse Master',
                description: 'Win during a solar eclipse',
                icon: 'fas fa-circle',
                type: 'seasonal',
                requirement: { type: 'eclipse_win', value: 1 },
                rarity: 'legendary'
            },
            {
                id: 'meteor_shower',
                title: 'Shooting Star',
                description: 'Win during a meteor shower',
                icon: 'fas fa-meteor',
                type: 'seasonal',
                requirement: { type: 'meteor_shower_win', value: 1 },
                rarity: 'legendary'
            },
            {
                id: 'full_moon_mystic',
                title: 'Full Moon Mystic',
                description: 'Win on a full moon',
                icon: 'fas fa-moon',
                type: 'seasonal',
                requirement: { type: 'full_moon_win', value: 1 },
                rarity: 'rare'
            },
            {
                id: 'black_friday_bargain',
                title: 'Black Friday Bargain',
                description: 'Win on Black Friday',
                icon: 'fas fa-shopping-cart',
                type: 'seasonal',
                requirement: { type: 'black_friday_win', value: 1 },
                rarity: 'epic'
            },

            // NUMERICAL & MATHEMATICAL ACHIEVEMENTS (20)
            {
                id: 'fibonacci_master',
                title: 'Fibonacci Master',
                description: 'Win with a Fibonacci number score (1, 1, 2, 3, 5, 8, 13...)',
                icon: 'fas fa-calculator',
                type: 'mathematical',
                requirement: { type: 'fibonacci_score', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'prime_time',
                title: 'Prime Time',
                description: 'Win with a prime number score',
                icon: 'fas fa-divide',
                type: 'mathematical',
                requirement: { type: 'prime_score', value: 1 },
                rarity: 'rare'
            },
            {
                id: 'perfect_square',
                title: 'Perfect Square',
                description: 'Win with a perfect square score (4, 9, 16, 25...)',
                icon: 'fas fa-square',
                type: 'mathematical',
                requirement: { type: 'perfect_square_score', value: 1 },
                rarity: 'rare'
            },
            {
                id: 'lucky_seven',
                title: 'Lucky Seven Variant',
                description: 'Win with a score containing only 7s (77, 777, etc.)',
                icon: 'fas fa-dice-seven',
                type: 'mathematical',
                requirement: { type: 'all_sevens_score', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'palindrome_perfection',
                title: 'Palindrome Perfection',
                description: 'Win with a palindromic score (121, 1331, etc.)',
                icon: 'fas fa-sync-alt',
                type: 'mathematical',
                requirement: { type: 'palindrome_score', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'century_maker',
                title: 'Century Maker',
                description: 'Score exactly 100 points',
                icon: 'fas fa-bullseye',
                type: 'mathematical',
                requirement: { type: 'exact_score', value: 100 },
                rarity: 'rare'
            },
            {
                id: 'half_century',
                title: 'Half Century',
                description: 'Score exactly 50 points',
                icon: 'fas fa-medal',
                type: 'mathematical',
                requirement: { type: 'exact_score', value: 50 },
                rarity: 'common'
            },
            {
                id: 'double_century',
                title: 'Double Century',
                description: 'Score exactly 200 points',
                icon: 'fas fa-crown',
                type: 'mathematical',
                requirement: { type: 'exact_score', value: 200 },
                rarity: 'epic'
            },
            {
                id: 'triple_digits',
                title: 'Triple Digits',
                description: 'Win with all three difficulties having same-digit times (11:11, 22:22)',
                icon: 'fas fa-align-center',
                type: 'mathematical',
                requirement: { type: 'triple_digit_times', value: 1 },
                rarity: 'legendary'
            },
            {
                id: 'golden_ratio',
                title: 'Golden Ratio',
                description: 'Win with a score near the golden ratio × 100 (161 or 162)',
                icon: 'fas fa-percentage',
                type: 'mathematical',
                requirement: { type: 'golden_ratio_score', value: 1 },
                rarity: 'legendary'
            },
            {
                id: 'binary_master',
                title: 'Binary Master',
                description: 'Win with a score that\'s a power of 2 (2, 4, 8, 16, 32...)',
                icon: 'fas fa-microchip',
                type: 'mathematical',
                requirement: { type: 'power_of_two_score', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'triangular_triumph',
                title: 'Triangular Triumph',
                description: 'Win with a triangular number score (1, 3, 6, 10, 15...)',
                icon: 'fas fa-play',
                type: 'mathematical',
                requirement: { type: 'triangular_score', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'catalan_champion',
                title: 'Catalan Champion',
                description: 'Win with a Catalan number score (1, 2, 5, 14, 42...)',
                icon: 'fas fa-cat',
                type: 'mathematical',
                requirement: { type: 'catalan_score', value: 1 },
                rarity: 'legendary'
            },
            {
                id: 'factorial_fantastic',
                title: 'Factorial Fantastic',
                description: 'Win with a factorial score (1, 2, 6, 24, 120...)',
                icon: 'fas fa-exclamation',
                type: 'mathematical',
                requirement: { type: 'factorial_score', value: 1 },
                rarity: 'legendary'
            },
            {
                id: 'even_steven',
                title: 'Even Steven',
                description: 'Win 10 times with only even-numbered scores',
                icon: 'fas fa-balance-scale',
                type: 'mathematical',
                requirement: { type: 'even_score_streak', value: 10 },
                rarity: 'rare'
            },
            {
                id: 'odd_one_out',
                title: 'Odd One Out',
                description: 'Win 10 times with only odd-numbered scores',
                icon: 'fas fa-balance-scale-right',
                type: 'mathematical',
                requirement: { type: 'odd_score_streak', value: 10 },
                rarity: 'rare'
            },
            {
                id: 'zero_hero',
                title: 'Zero Hero',
                description: 'Win with a score ending in zero',
                icon: 'fas fa-circle-notch',
                type: 'mathematical',
                requirement: { type: 'score_ends_in_zero', value: 1 },
                rarity: 'common'
            },
            {
                id: 'triple_zero',
                title: 'Triple Zero',
                description: 'Win with a score ending in 000',
                icon: 'fas fa-bullseye',
                type: 'mathematical',
                requirement: { type: 'score_ends_in_000', value: 1 },
                rarity: 'legendary'
            },
            {
                id: 'digital_root_one',
                title: 'Digital Root One',
                description: 'Win with a score whose digits sum to 1',
                icon: 'fas fa-calculator',
                type: 'mathematical',
                requirement: { type: 'digital_root_one', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'ascending_order',
                title: 'Ascending Order',
                description: 'Win with a score with digits in ascending order (123, 1234, etc.)',
                icon: 'fas fa-sort-numeric-up',
                type: 'mathematical',
                requirement: { type: 'ascending_digits', value: 1 },
                rarity: 'epic'
            },

            // COMPETITIVE & PSYCHOLOGICAL ACHIEVEMENTS (15)
            {
                id: 'mind_reader',
                title: 'Mind Reader',
                description: 'Win with exactly 1 point more than opponent 5 times',
                icon: 'fas fa-brain',
                type: 'competitive',
                requirement: { type: 'one_point_wins', value: 5 },
                rarity: 'epic'
            },
            {
                id: 'psychological_warfare',
                title: 'Psychological Warfare',
                description: 'Win after opponent leads for most of the day',
                icon: 'fas fa-chess',
                type: 'competitive',
                requirement: { type: 'late_comeback', value: 1 },
                rarity: 'rare'
            },
            {
                id: 'copycat',
                title: 'Copycat',
                description: 'Complete puzzles in same order as opponent 3 days in a row',
                icon: 'fas fa-copy',
                type: 'competitive',
                requirement: { type: 'mirror_completion_order', value: 3 },
                rarity: 'epic'
            },
            {
                id: 'trendsetter',
                title: 'Trendsetter',
                description: 'Have opponent copy your completion order 3 times',
                icon: 'fas fa-crown',
                type: 'competitive',
                requirement: { type: 'influence_opponent_order', value: 3 },
                rarity: 'epic'
            },
            {
                id: 'speedster_intimidation',
                title: 'Speedster Intimidation',
                description: 'Complete all 3 puzzles before opponent finishes 1',
                icon: 'fas fa-rocket',
                type: 'competitive',
                requirement: { type: 'complete_all_before_opponent_one', value: 1 },
                rarity: 'legendary'
            },
            {
                id: 'pressure_cooker',
                title: 'Pressure Cooker',
                description: 'Win while opponent is ahead until final puzzle',
                icon: 'fas fa-fire',
                type: 'competitive',
                requirement: { type: 'final_puzzle_comeback', value: 1 },
                rarity: 'epic'
            },
            {
                id: 'chess_master',
                title: 'Chess Master',
                description: 'Win 5 games with strategic patience (slowest completion)',
                icon: 'fas fa-chess-king',
                type: 'competitive',
                requirement: { type: 'strategic_slow_wins', value: 5 },
                rarity: 'rare'
            },
            {
                id: 'blitz_master',
                title: 'Blitz Master',
                description: 'Win 5 games with speed dominance (fastest completion)',
                icon: 'fas fa-lightning-bolt',
                type: 'competitive',
                requirement: { type: 'speed_dominance_wins', value: 5 },
                rarity: 'rare'
            },
            {
                id: 'equalizer',
                title: 'The Equalizer',
                description: 'Force 5 tie games',
                icon: 'fas fa-balance-scale',
                type: 'competitive',
                requirement: { type: 'force_ties', value: 5 },
                rarity: 'epic'
            },
            {
                id: 'clutch_performer_v2',
                title: 'Clutch Performer Pro',
                description: 'Win 3 games decided by 1 point',
                icon: 'fas fa-bullseye',
                type: 'competitive',
                requirement: { type: 'clutch_wins', value: 3 },
                rarity: 'epic'
            },
            {
                id: 'momentum_shifter',
                title: 'Momentum Shifter',
                description: 'Come back from 100+ point deficit to win',
                icon: 'fas fa-exchange-alt',
                type: 'competitive',
                requirement: { type: 'large_comeback', value: 100 },
                rarity: 'legendary'
            },
            {
                id: 'the_wall',
                title: 'The Wall',
                description: 'Prevent opponent comebacks 10 times while leading',
                icon: 'fas fa-shield',
                type: 'competitive',
                requirement: { type: 'prevent_comebacks', value: 10 },
                rarity: 'epic'
            },
            {
                id: 'tempo_control',
                title: 'Tempo Control',
                description: 'Win by completing puzzles in perfect difficulty order 5 times',
                icon: 'fas fa-sort',
                type: 'competitive',
                requirement: { type: 'perfect_order_wins', value: 5 },
                rarity: 'rare'
            },
            {
                id: 'reverse_psychology',
                title: 'Reverse Psychology',
                description: 'Win by completing hardest puzzle first 5 times',
                icon: 'fas fa-backward',
                type: 'competitive',
                requirement: { type: 'hard_first_wins', value: 5 },
                rarity: 'rare'
            },
            {
                id: 'mind_games',
                title: 'Mind Games',
                description: 'Win with identical time patterns as opponent (psychological mirror)',
                icon: 'fas fa-brain',
                type: 'competitive',
                requirement: { type: 'time_pattern_mirror', value: 1 },
                rarity: 'legendary'
            },

            // BONUS ACHIEVEMENTS (4 more to reach 121)
            {
                id: 'century_club',
                title: 'Century Club',
                description: 'Complete 100 total puzzles across all difficulties',
                icon: 'fas fa-certificate',
                type: 'milestone',
                requirement: { type: 'total_puzzles_completed', value: 100 },
                rarity: 'epic',
                oneTime: true
            },
            {
                id: 'double_trouble',
                title: 'Double Trouble',
                description: 'Complete both Easy and Medium in under 5 minutes total',
                icon: 'fas fa-stopwatch',
                type: 'speed',
                requirement: { type: 'easy_medium_time_under', value: 300 },
                rarity: 'rare'
            },
            {
                id: 'puzzle_archaeologist',
                title: 'Puzzle Archaeologist',
                description: 'Complete a puzzle that was started over 24 hours ago',
                icon: 'fas fa-hourglass-end',
                type: 'patience',
                requirement: { type: 'old_puzzle_completion', value: 24 },
                rarity: 'epic'
            },
            {
                id: 'the_chosen_one',
                title: 'The Chosen One',
                description: 'Unlock achievement #121 (this one!) - The final piece of the puzzle',
                icon: 'fas fa-crown',
                type: 'meta',
                requirement: { type: 'final_achievement', value: 1 },
                rarity: 'legendary',
                oneTime: true
            }
        ];

        this.unlockedAchievements = [];
        this.filteringInitialized = false;
        this.currentFilters = null;
        this.allAchievementHTML = null;
        this.initializeAsync();
    }

    async initializeAsync() {
        try {
            await this.refreshAchievements();

            // Run automatic cleanup once per session to fix any inconsistencies
            if (this.needsInitialCleanup) {
                //console.log('🔧 Running automatic achievement cleanup...');
                await this.performAutomaticCleanup();
                this.needsInitialCleanup = false;
            }
        } catch (error) {
            console.error('Failed to load achievements:', error);
            this.unlockedAchievements = [];
        }
    }

    async refreshAchievements() {
        try {
            // Always load from database, never from localStorage
            this.unlockedAchievements = await sudokuApp.loadAchievements() || [];

            // Extra safeguard: ensure we're working with database data only
            if (!Array.isArray(this.unlockedAchievements)) {
                console.warn('Invalid achievements data from database, resetting to empty array');
                this.unlockedAchievements = [];
            }

            //console.log(`Loaded ${this.unlockedAchievements.length} achievements from database`);
        } catch (error) {
            console.error('Failed to refresh achievements:', error);
            // Reset to empty array if database fails to ensure clean state
            this.unlockedAchievements = [];
        }
    }

    // Helper method to ensure unlockedAchievements is always an array
    ensureUnlockedAchievementsArray() {
        if (!Array.isArray(this.unlockedAchievements)) {
            this.unlockedAchievements = [];
        }
    }

    // Safety mechanism: prevent awarding more achievements than days played
    shouldAllowRepeatableAchievement(achievementId, player, allEntries) {
        // Count how many times this player has unlocked this achievement
        const existingUnlocks = this.unlockedAchievements.filter(a =>
            a.id === achievementId && a.player === player
        ).length;

        // Count how many complete days this player has played (only complete entries count)
        const completeDaysPlayed = allEntries.filter(entry =>
            sudokuApp.isEntryComplete && sudokuApp.isEntryComplete(entry)
        ).length;

        // Don't allow more unlocks than complete days played
        return existingUnlocks < completeDaysPlayed;
    }

    async checkNewAchievements(newEntry, allEntries, streaks) {
        // Always refresh achievements from database before checking
        await this.refreshAchievements();
        this.ensureUnlockedAchievementsArray();

        const newlyUnlocked = [];

        for (const achievement of this.achievementDefinitions) {
            const playersWhoEarned = this.checkAchievementRequirement(achievement, newEntry, allEntries, streaks);

            if (playersWhoEarned && playersWhoEarned.length > 0) {
                for (const player of playersWhoEarned) {
                    // Check if this player should get this achievement
                    let shouldUnlock = false;

                    if (achievement.oneTime) {
                        // For one-time achievements, check if player has ANY instance of this achievement
                        const alreadyHas = this.unlockedAchievements.some(a =>
                            a.id === achievement.id && a.player === player
                        );
                        shouldUnlock = !alreadyHas;
                    } else {
                        // For repeatable achievements, only unlock once per entry date
                        const alreadyUnlockedForThisEntry = this.unlockedAchievements.some(a =>
                            a.id === achievement.id &&
                            a.player === player &&
                            a.unlockedAt.startsWith(newEntry.date)
                        );
                        shouldUnlock = !alreadyUnlockedForThisEntry;

                        // Additional safety check: don't unlock if player already has too many of this achievement
                        if (shouldUnlock) {
                            const existingCount = this.unlockedAchievements.filter(a =>
                                a.id === achievement.id && a.player === player
                            ).length;

                            // Conservative limit: no more achievements than total entries
                            if (existingCount >= allEntries.length) {
                                console.warn(`🚫 Blocking ${achievement.id} for ${player}: already has ${existingCount} (max ${allEntries.length})`);
                                shouldUnlock = false;
                            }
                        }
                    }

                    if (shouldUnlock) {
                        await this.unlockAchievement(achievement, player);
                        newlyUnlocked.push({...achievement, player});
                        //console.log(`🆕 New achievement: ${achievement.title} for ${player}`);
                    }
                }
            }
        }

        // Show notifications for newly unlocked achievements
        newlyUnlocked.forEach((achievement, index) => {
            setTimeout(() => {
                sudokuApp.showAchievementNotification(achievement);
            }, index * 2000); // Stagger notifications
        });

        return newlyUnlocked;
    }

    checkAchievementRequirement(achievement, newEntry, allEntries, streaks) {
        const req = achievement.requirement;

        switch (req.type) {
            case 'win_streak':
                return this.checkWinStreak(req.value, streaks);

            case 'weekly_sweep':
                return this.checkWeeklySweep(allEntries);

            case 'time_under':
                return this.checkTimeUnder(req, newEntry);

            case 'time_over':
                return this.checkTimeOver(req, newEntry);

            case 'total_time_under':
                return this.checkTotalTimeUnder(req, newEntry);

            case 'total_errors_over':
                return this.checkTotalErrorsOver(req, newEntry);

            case 'late_submission':
            case 'early_submission':
                return this.checkSubmissionTime(req, newEntry);

            case 'weekend_sweep':
                return this.checkWeekendSweep(allEntries);

            case 'close_win':
                return this.checkCloseWin(req, newEntry);

            case 'dominating_win':
                return this.checkDominatingWin(req, newEntry);

            case 'balanced_times':
                return this.checkBalancedTimes(req, newEntry);

            case 'win_with_dnf':
                return this.checkWinWithDnf(req, newEntry);

            case 'perfect_week':
                return this.checkPerfectWeek(allEntries);

            case 'zero_errors_day':
                return this.checkZeroErrorsDay(newEntry);

            case 'zero_errors':
                return this.checkZeroErrors(req, newEntry);

            case 'total_days':
                return allEntries.length >= req.value ? ['faidao', 'filip'] : [];

            case 'daily_score':
                return this.checkDailyScore(req.value, newEntry);

            case 'comeback_win':
                return this.checkComebackWin(req.value, allEntries);

            case 'perfect_month':
                return this.checkPerfectMonth(allEntries);

            case 'triple_perfect_day':
                return this.checkTriplePerfectDay(newEntry);

            case 'perfect_streak':
                return this.checkPerfectStreak(req.value, allEntries);

            case 'win_with_errors':
                return this.checkWinWithErrors(req.value, newEntry);

            // Placeholder functions for new achievement types
            // These will be implemented as needed when the underlying data tracking is available
            case 'weekend_wins':
            case 'monday_wins':
            case 'friday_wins':
            case 'friday_13th_win':
            case 'new_year_win':
            case 'birthday_win':
            case 'valentines_win':
            case 'halloween_win':
            case 'christmas_win':
            case 'thanksgiving_win':
            case 'spring_equinox_win':
            case 'summer_solstice_win':
            case 'winter_solstice_win':
            case 'april_fools_win':
            case 'pi_day_win':
            case 'leap_day_win':
            case 'july_4th_win':
            case 'eclipse_win':
            case 'meteor_shower_win':
            case 'full_moon_win':
            case 'black_friday_win':
            case 'fibonacci_score':
            case 'prime_score':
            case 'perfect_square_score':
            case 'all_sevens_score':
            case 'palindrome_score':
            case 'exact_score':
            case 'triple_digit_times':
            case 'golden_ratio_score':
            case 'power_of_two_score':
            case 'triangular_score':
            case 'catalan_score':
            case 'factorial_score':
            case 'even_score_streak':
            case 'odd_score_streak':
            case 'score_ends_in_zero':
            case 'score_ends_in_000':
            case 'digital_root_one':
            case 'ascending_digits':
            case 'one_point_wins':
            case 'late_comeback':
            case 'mirror_completion_order':
            case 'influence_opponent_order':
            case 'complete_all_before_opponent_one':
            case 'final_puzzle_comeback':
            case 'strategic_slow_wins':
            case 'speed_dominance_wins':
            case 'force_ties':
            case 'clutch_wins':
            case 'large_comeback':
            case 'prevent_comebacks':
            case 'perfect_order_wins':
            case 'hard_first_wins':
            case 'time_pattern_mirror':
            case 'analytics_visits':
            case 'achievements_visits':
            case 'player_switches':
            case 'exact_time':
            case 'identical_scores':
            case 'total_puzzles_completed':
            case 'easy_medium_time_under':
            case 'old_puzzle_completion':
            case 'final_achievement':
                // These achievement types are not yet implemented
                // They will be added as the underlying tracking systems are developed
                return [];

            default:
                return [];
        }
    }

    checkWinStreak(requiredStreak, streaks) {
        const players = [];
        if ((streaks.faidao?.current || 0) >= requiredStreak) players.push('faidao');
        if ((streaks.filip?.current || 0) >= requiredStreak) players.push('filip');
        return players;
    }

    checkWeeklySweep(allEntries) {
        if (allEntries.length < 7) return [];

        // Check if there's a 7-day period where one player won every day
        const sortedEntries = [...allEntries].sort((a, b) => new Date(a.date) - new Date(b.date));

        for (let i = 0; i <= sortedEntries.length - 7; i++) {
            const weekEntries = sortedEntries.slice(i, i + 7);

            // Check if dates are consecutive
            let isConsecutive = true;
            for (let j = 1; j < weekEntries.length; j++) {
                const prevDate = new Date(weekEntries[j - 1].date);
                const currDate = new Date(weekEntries[j].date);
                const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
                if (dayDiff !== 1) {
                    isConsecutive = false;
                    break;
                }
            }

            if (isConsecutive) {
                const faidaoWins = weekEntries.filter(e => e.faidao.scores.total > e.filip.scores.total).length;
                const filipWins = weekEntries.filter(e => e.filip.scores.total > e.faidao.scores.total).length;

                if (faidaoWins === 7) return ['faidao'];
                if (filipWins === 7) return ['filip'];
            }
        }

        return [];
    }

    checkTimeUnder(req, entry) {
        const players = ['faidao', 'filip'];

        return players.filter(player => {
            const time = entry[player].times[req.difficulty];
            const dnf = entry[player].dnf[req.difficulty];
            const qualifies = !dnf && time !== null && time < req.value;

            // Add debugging for speed achievements
            if (req.difficulty === 'easy' && req.value === 120) {
                //console.log(`Speed Demon Easy check for ${player}: time=${time}s, dnf=${dnf}, qualifies=${qualifies} (need <${req.value}s)`);
            }

            return qualifies;
        });
    }

    checkZeroErrorsDay(entry) {
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        return players.filter(player => {
            const totalErrors = difficulties.reduce((sum, diff) => {
                return sum + (entry[player].errors[diff] || 0);
            }, 0);
            return totalErrors === 0;
        });
    }

    checkZeroErrors(req, entry) {
        const players = ['faidao', 'filip'];

        return players.filter(player => {
            const errors = entry[player].errors[req.difficulty];
            const dnf = entry[player].dnf[req.difficulty];
            return !dnf && errors === 0;
        });
    }

    checkDailyScore(requiredScore, entry) {
        const players = [];
        if (entry.faidao.scores.total >= requiredScore) players.push('faidao');
        if (entry.filip.scores.total >= requiredScore) players.push('filip');
        return players;
    }

    checkComebackWin(lossStreak, allEntries) {
        if (allEntries.length < lossStreak + 1) return [];

        const sortedEntries = [...allEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
        const recentEntries = sortedEntries.slice(-lossStreak - 1);

        // Check if the latest entry is a win
        const latestEntry = recentEntries[recentEntries.length - 1];
        const latestFaidaoWon = latestEntry.faidao.scores.total > latestEntry.filip.scores.total;
        const latestFilipWon = latestEntry.filip.scores.total > latestEntry.faidao.scores.total;

        if (!latestFaidaoWon && !latestFilipWon) return []; // Tie doesn't count

        // Check if the previous entries were losses for the winner
        const previousEntries = recentEntries.slice(0, -1);

        if (latestFaidaoWon) {
            const hasLossStreak = previousEntries.every(entry => entry.filip.scores.total > entry.faidao.scores.total);
            return hasLossStreak ? ['faidao'] : [];
        } else {
            const hasLossStreak = previousEntries.every(entry => entry.faidao.scores.total > entry.filip.scores.total);
            return hasLossStreak ? ['filip'] : [];
        }
    }

    checkTimeOver(req, entry) {
        const players = ['faidao', 'filip'];

        return players.filter(player => {
            const time = entry[player].times[req.difficulty];
            const dnf = entry[player].dnf[req.difficulty];
            return !dnf && time !== null && time > req.value;
        });
    }

    checkTotalTimeUnder(req, entry) {
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        return players.filter(player => {
            const totalTime = difficulties.reduce((sum, diff) => {
                const time = entry[player].times[diff];
                const dnf = entry[player].dnf[diff];
                return sum + (!dnf && time !== null ? time : 0);
            }, 0);

            // Only count if all difficulties were completed (no DNFs)
            const allCompleted = difficulties.every(diff => !entry[player].dnf[diff] && entry[player].times[diff] !== null);
            return allCompleted && totalTime < req.value;
        });
    }

    checkTotalErrorsOver(req, entry) {
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        return players.filter(player => {
            const totalErrors = difficulties.reduce((sum, diff) => {
                return sum + (entry[player].errors[diff] || 0);
            }, 0);
            return totalErrors > req.value;
        });
    }

    checkSubmissionTime(req, entry) {
        const players = ['faidao', 'filip'];
        const submissionTime = new Date().getHours();

        // Check if this is a late or early submission
        const isLateSubmission = req.type === 'late_submission' && submissionTime >= req.value;
        const isEarlySubmission = req.type === 'early_submission' && submissionTime < req.value;

        if (isLateSubmission || isEarlySubmission) {
            // Return both players since submission time affects both
            return players;
        }
        return [];
    }

    checkWeekendSweep(allEntries) {
        if (allEntries.length < 2) return [];

        const today = new Date();
        const currentWeekStart = new Date(today.setDate(today.getDate() - today.getDay()));

        // Find Saturday and Sunday entries for current week
        const weekendEntries = allEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            const dayOfWeek = entryDate.getDay();
            return (dayOfWeek === 0 || dayOfWeek === 6) && entryDate >= currentWeekStart;
        });

        if (weekendEntries.length < 2) return [];

        const saturdayEntry = weekendEntries.find(e => new Date(e.date).getDay() === 6);
        const sundayEntry = weekendEntries.find(e => new Date(e.date).getDay() === 0);

        if (!saturdayEntry || !sundayEntry) return [];

        const players = [];
        if (saturdayEntry.faidao.scores.total > saturdayEntry.filip.scores.total &&
            sundayEntry.faidao.scores.total > sundayEntry.filip.scores.total) {
            players.push('faidao');
        }
        if (saturdayEntry.filip.scores.total > saturdayEntry.faidao.scores.total &&
            sundayEntry.filip.scores.total > sundayEntry.faidao.scores.total) {
            players.push('filip');
        }

        return players;
    }

    checkCloseWin(req, entry) {
        const scoreDiff = Math.abs(entry.faidao.scores.total - entry.filip.scores.total);
        if (scoreDiff === req.value) {
            if (entry.faidao.scores.total > entry.filip.scores.total) return ['faidao'];
            if (entry.filip.scores.total > entry.faidao.scores.total) return ['filip'];
        }
        return [];
    }

    checkDominatingWin(req, entry) {
        const players = [];
        if (entry.faidao.scores.total >= entry.filip.scores.total * req.value) {
            players.push('faidao');
        }
        if (entry.filip.scores.total >= entry.faidao.scores.total * req.value) {
            players.push('filip');
        }
        return players;
    }

    checkBalancedTimes(req, entry) {
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        return players.filter(player => {
            const times = difficulties.map(diff => entry[player].times[diff]).filter(t => t !== null);

            if (times.length !== 3) return false; // Need all 3 times

            const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
            const maxDeviation = Math.max(...times.map(time => Math.abs(time - avgTime) / avgTime));

            return maxDeviation <= req.value;
        });
    }

    checkWinWithDnf(req, entry) {
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        return players.filter(player => {
            const hasDnf = difficulties.some(diff => entry[player].dnf[diff]);
            const isWinner = entry[player].scores.total > entry[player === 'faidao' ? 'filip' : 'faidao'].scores.total;
            return hasDnf && isWinner;
        });
    }

    checkPerfectWeek(allEntries) {
        if (allEntries.length < 7) return [];

        const sortedEntries = [...allEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
        const difficulties = ['easy', 'medium', 'hard'];

        // Check last 7 consecutive days
        for (let i = sortedEntries.length - 7; i >= 0; i--) {
            const weekEntries = sortedEntries.slice(i, i + 7);

            // Verify consecutive days
            let isConsecutive = true;
            for (let j = 1; j < weekEntries.length; j++) {
                const prevDate = new Date(weekEntries[j - 1].date);
                const currDate = new Date(weekEntries[j].date);
                const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
                if (dayDiff !== 1) {
                    isConsecutive = false;
                    break;
                }
            }

            if (isConsecutive) {
                const players = ['faidao', 'filip'];
                const qualifyingPlayers = [];

                players.forEach(player => {
                    const perfectWeek = weekEntries.every(entry => {
                        return difficulties.every(diff => entry[player].errors[diff] === 0);
                    });
                    if (perfectWeek) qualifyingPlayers.push(player);
                });

                if (qualifyingPlayers.length > 0) return qualifyingPlayers;
            }
        }

        return [];
    }

    checkPerfectMonth(allEntries) {
        if (allEntries.length < 30) return [];

        const sortedEntries = [...allEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
        const difficulties = ['easy', 'medium', 'hard'];

        // Check last 30 consecutive days
        for (let i = sortedEntries.length - 30; i >= 0; i--) {
            const monthEntries = sortedEntries.slice(i, i + 30);

            // Verify consecutive days
            let isConsecutive = true;
            for (let j = 1; j < monthEntries.length; j++) {
                const prevDate = new Date(monthEntries[j - 1].date);
                const currDate = new Date(monthEntries[j].date);
                const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
                if (dayDiff !== 1) {
                    isConsecutive = false;
                    break;
                }
            }

            if (isConsecutive) {
                const players = ['faidao', 'filip'];
                const qualifyingPlayers = [];

                players.forEach(player => {
                    const perfectMonth = monthEntries.every(entry => {
                        return difficulties.every(diff => entry[player].errors[diff] === 0);
                    });
                    if (perfectMonth) qualifyingPlayers.push(player);
                });

                if (qualifyingPlayers.length > 0) return qualifyingPlayers;
            }
        }

        return [];
    }

    checkTriplePerfectDay(entry) {
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        return players.filter(player => {
            return difficulties.every(diff => {
                const errors = entry[player].errors[diff];
                const dnf = entry[player].dnf[diff];
                return !dnf && errors === 0;
            });
        });
    }

    checkPerfectStreak(requiredStreak, allEntries) {
        if (allEntries.length < requiredStreak) return [];

        const sortedEntries = [...allEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
        const difficulties = ['easy', 'medium', 'hard'];
        const players = ['faidao', 'filip'];
        const qualifyingPlayers = [];

        players.forEach(player => {
            // Check if the last N entries are all perfect for this player
            const recentEntries = sortedEntries.slice(-requiredStreak);

            // Verify consecutive days
            let isConsecutive = true;
            for (let j = 1; j < recentEntries.length; j++) {
                const prevDate = new Date(recentEntries[j - 1].date);
                const currDate = new Date(recentEntries[j].date);
                const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
                if (dayDiff !== 1) {
                    isConsecutive = false;
                    break;
                }
            }

            if (isConsecutive) {
                const perfectStreak = recentEntries.every(entry => {
                    return difficulties.every(diff => entry[player].errors[diff] === 0);
                });
                if (perfectStreak) qualifyingPlayers.push(player);
            }
        });

        return qualifyingPlayers;
    }

    checkWinWithErrors(minErrors, entry) {
        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        return players.filter(player => {
            const totalErrors = difficulties.reduce((sum, diff) => {
                return sum + (entry[player].errors[diff] || 0);
            }, 0);
            const isWinner = entry[player].scores.total > entry[player === 'faidao' ? 'filip' : 'faidao'].scores.total;
            return totalErrors >= minErrors && isWinner;
        });
    }

    async unlockAchievement(achievement, player) {
        this.ensureUnlockedAchievementsArray();

        const unlock = {
            id: achievement.id,
            player: player,
            unlockedAt: new Date().toISOString(),
            title: achievement.title,
            description: achievement.description
        };

        this.unlockedAchievements.push(unlock);

        // Save immediately to database
        try {
            await fetch('/api/achievements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(unlock)
            });
        } catch (error) {
            console.error('Failed to save achievement:', error);
        }
    }

    async isAchievementUnlocked(achievementId) {
        await this.refreshAchievements();
        this.ensureUnlockedAchievementsArray();
        return this.unlockedAchievements.some(a => a.id === achievementId);
    }

    async updateAchievements(entries, streaks, records) {
        // Always refresh achievements from database before updating display
        await this.refreshAchievements();
        this.ensureUnlockedAchievementsArray();

        // Update the achievements summary
        this.updateAchievementsSummary();

        // Initialize filtering if not already done
        this.initializeFiltering();

        // Render all achievements
        this.renderAchievements();
    }

    initializeFiltering() {
        if (this.filteringInitialized) return;
        this.filteringInitialized = true;

        // Get filter elements
        const filterTabs = document.querySelectorAll('.filter-tab');
        const categorySelect = document.getElementById('categorySelect');
        const raritySelect = document.getElementById('raritySelect');
        const searchInput = document.getElementById('achievementSearch');

        // Initialize filter state
        this.currentFilters = {
            status: 'all', // all, unlocked, locked
            category: 'all',
            rarity: 'all',
            search: ''
        };

        // Add event listeners
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active tab
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update filter
                this.currentFilters.status = tab.dataset.filter;
                this.applyFilters();
            });
        });

        if (categorySelect) {
            categorySelect.addEventListener('change', () => {
                this.currentFilters.category = categorySelect.value;
                this.applyFilters();
            });
        }

        if (raritySelect) {
            raritySelect.addEventListener('change', () => {
                this.currentFilters.rarity = raritySelect.value;
                this.applyFilters();
            });
        }

        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.search = searchInput.value.toLowerCase();
                    this.applyFilters();
                }, 300); // Debounce search
            });
        }
    }

    renderAchievements() {
        const achievementsGrid = document.getElementById('achievementsGrid');
        if (!achievementsGrid) return;

        // Create achievement HTML for all achievements
        this.allAchievementHTML = this.achievementDefinitions.map(achievement => {
            const achievementInstances = this.unlockedAchievements.filter(a => a.id === achievement.id);
            const isUnlocked = achievementInstances.length > 0;

            // Group by player and count
            const playerStats = {};
            achievementInstances.forEach(instance => {
                if (!playerStats[instance.player]) {
                    playerStats[instance.player] = {
                        count: 0,
                        firstUnlocked: instance.unlockedAt,
                        lastUnlocked: instance.unlockedAt
                    };
                }
                playerStats[instance.player].count++;
                if (new Date(instance.unlockedAt) < new Date(playerStats[instance.player].firstUnlocked)) {
                    playerStats[instance.player].firstUnlocked = instance.unlockedAt;
                }
                if (new Date(instance.unlockedAt) > new Date(playerStats[instance.player].lastUnlocked)) {
                    playerStats[instance.player].lastUnlocked = instance.unlockedAt;
                }
            });

            // Determine border color based on who has the most unlocks
            let borderClass = '';
            if (isUnlocked) {
                const playerEntries = Object.entries(playerStats);
                if (playerEntries.length === 1) {
                    borderClass = `${playerEntries[0][0]}-border`;
                } else if (playerEntries.length === 2) {
                    const [player1, stats1] = playerEntries[0];
                    const [player2, stats2] = playerEntries[1];
                    if (stats1.count > stats2.count) {
                        borderClass = `${player1}-border`;
                    } else if (stats2.count > stats1.count) {
                        borderClass = `${player2}-border`;
                    } else {
                        borderClass = 'tie-border';
                    }
                }
            }

            const playerStatsHTML = Object.keys(playerStats).length > 0 ? `
                <div class="achievement-players">
                    ${Object.entries(playerStats).map(([player, stats]) => `
                        <div class="player-achievement-stat">
                            <span class="player-name ${player}-color">${player}</span>
                            <span class="achievement-count">${stats.count}x</span>
                            <span class="achievement-date" title="First unlocked: ${new Date(stats.firstUnlocked).toLocaleDateString()}">
                                ${new Date(stats.firstUnlocked).toLocaleDateString()}
                            </span>
                        </div>
                    `).join('')}
                </div>
            ` : '';

            const element = {
                html: `
                    <div class="achievement-badge ${isUnlocked ? 'unlocked' : 'locked'} ${borderClass}"
                         data-status="${isUnlocked ? 'unlocked' : 'locked'}"
                         data-category="${achievement.type}"
                         data-rarity="${achievement.rarity}"
                         data-search="${achievement.title.toLowerCase()} ${achievement.description.toLowerCase()}">
                        <div class="badge-icon">
                            <i class="${achievement.icon}"></i>
                        </div>
                        <h3 class="badge-title">${achievement.title}</h3>
                        <p class="badge-description">${achievement.description}</p>
                        <div class="badge-rarity ${achievement.rarity}">${achievement.rarity.toUpperCase()}</div>
                        ${isUnlocked ? `
                            <div class="badge-unlocked-info">
                                <div class="total-unlocks">Unlocked ${achievementInstances.length} time${achievementInstances.length !== 1 ? 's' : ''}</div>
                                ${playerStatsHTML}
                            </div>
                        ` : ''}
                    </div>
                `,
                id: achievement.id, // Add missing ID for mobile click handlers
                isUnlocked,
                category: achievement.type,
                rarity: achievement.rarity,
                searchText: `${achievement.title.toLowerCase()} ${achievement.description.toLowerCase()}`
            };
            return element;
        });

        // Apply current filters
        this.applyFilters();
    }

    applyFilters() {
        if (!this.allAchievementHTML) return;

        const achievementsGrid = document.getElementById('achievementsGrid');
        const noResults = document.getElementById('noResults');

        // Filter achievements based on current filters
        const filteredAchievements = this.allAchievementHTML.filter(achievement => {
            // Status filter
            if (this.currentFilters.status === 'unlocked' && !achievement.isUnlocked) return false;
            if (this.currentFilters.status === 'locked' && achievement.isUnlocked) return false;

            // Category filter
            if (this.currentFilters.category !== 'all' && achievement.category !== this.currentFilters.category) return false;

            // Rarity filter
            if (this.currentFilters.rarity !== 'all' && achievement.rarity !== this.currentFilters.rarity) return false;

            // Search filter
            if (this.currentFilters.search && !achievement.searchText.includes(this.currentFilters.search)) return false;

            return true;
        });

        // Update display
        if (filteredAchievements.length === 0) {
            achievementsGrid.style.display = 'none';
            noResults.style.display = 'block';
        } else {
            achievementsGrid.style.display = 'grid';
            noResults.style.display = 'none';
            achievementsGrid.innerHTML = filteredAchievements.map(a => a.html).join('');

            // Add click event listeners for mobile popup
            this.addMobileClickHandlers(filteredAchievements);
        }

        // Update filter counts
        this.updateFilterCounts();
    }

    addMobileClickHandlers(achievements) {
        // Only add click handlers on mobile devices
        if (window.innerWidth > 768) return;

        const achievementBadges = document.querySelectorAll('.achievement-badge');
        achievementBadges.forEach((badge, index) => {
            const achievement = achievements[index];
            if (!achievement) return;

            badge.addEventListener('click', () => {
                console.log('Badge clicked!', achievement.id);

                // Find the achievement definition
                const achievementDef = this.achievementDefinitions.find(def => def.id === achievement.id);
                if (!achievementDef) {
                    console.log('Achievement definition not found for:', achievement.id);
                    return;
                }

                // Get additional data from the badge element
                const progressElement = badge.querySelector('.badge-progress');
                const unlockedByElement = badge.querySelector('.badge-unlocked-by');
                const dateElement = badge.querySelector('.badge-date');

                const achievementData = {
                    id: achievementDef.id,
                    icon: achievementDef.icon,
                    title: achievementDef.title,
                    description: achievementDef.description,
                    rarity: achievementDef.rarity,
                    progressHTML: progressElement ? progressElement.outerHTML : '',
                    unlockedByHTML: unlockedByElement ? unlockedByElement.outerHTML : '',
                    dateHTML: dateElement ? dateElement.outerHTML : ''
                };

                // Show popup if available
                if (window.achievementPopup) {
                    console.log('Showing popup for:', achievementData);
                    window.achievementPopup.showPopup(achievementData);
                } else {
                    console.log('Achievement popup not available');
                }
            });
        });
    }

    updateFilterCounts() {
        if (!this.allAchievementHTML) return;

        const totalCount = this.allAchievementHTML.length;
        const unlockedCount = this.allAchievementHTML.filter(a => a.isUnlocked).length;
        const lockedCount = totalCount - unlockedCount;

        // Update count badges
        const allCountEl = document.getElementById('allCount');
        const unlockedCountEl = document.getElementById('unlockedCount');
        const lockedCountEl = document.getElementById('lockedCount');

        if (allCountEl) allCountEl.textContent = totalCount;
        if (unlockedCountEl) unlockedCountEl.textContent = unlockedCount;
        if (lockedCountEl) lockedCountEl.textContent = lockedCount;
    }

    async getAchievementStats() {
        await this.refreshAchievements();
        this.ensureUnlockedAchievementsArray();

        const total = this.achievementDefinitions.length;
        const unlocked = this.unlockedAchievements.length;
        const percentage = Math.round((unlocked / total) * 100);

        return {
            total,
            unlocked,
            percentage,
            byRarity: {
                common: this.getUnlockedByRarity('common'),
                rare: this.getUnlockedByRarity('rare'),
                epic: this.getUnlockedByRarity('epic'),
                legendary: this.getUnlockedByRarity('legendary')
            }
        };
    }

    getUnlockedByRarity(rarity) {
        const totalByRarity = this.achievementDefinitions.filter(a => a.rarity === rarity).length;
        const unlockedByRarity = this.achievementDefinitions.filter(a =>
            a.rarity === rarity && this.unlockedAchievements.some(ua => ua.id === a.id)
        ).length;

        return {
            total: totalByRarity,
            unlocked: unlockedByRarity,
            percentage: totalByRarity > 0 ? Math.round((unlockedByRarity / totalByRarity) * 100) : 0
        };
    }

    async refreshAllAchievements() {
        //console.log('🔄 Starting complete achievement refresh...');

        try {
            // Step 1: Clear all existing achievements from database
            //console.log('🗑️ Clearing all existing achievements...');
            await fetch('/api/achievements', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Step 2: Load all game entries and streaks
            //console.log('📊 Loading game data...');
            const allEntries = await sudokuApp.loadFromStorage() || [];
            const streaks = await sudokuApp.loadStreaks() || {};

            // Step 3: Clear local achievements
            this.unlockedAchievements = [];

            // Step 4: Process each game entry chronologically with proper validation
            //console.log(`🎯 Processing ${allEntries.length} game entries...`);
            const sortedEntries = [...allEntries].sort((a, b) => new Date(a.date) - new Date(b.date));

            let processedCount = 0;
            const processedDates = new Set(); // Track processed dates to avoid duplicates

            for (const entry of sortedEntries) {
                // Skip if we've already processed this date
                if (processedDates.has(entry.date)) {
                    //console.log(`⚠️ Skipping duplicate entry for ${entry.date}`);
                    continue;
                }
                processedDates.add(entry.date);

                // Get entries up to this point for context
                const entriesUpToNow = sortedEntries.slice(0, sortedEntries.indexOf(entry) + 1);

                //console.log(`Processing entry ${entry.date}...`);

                // Check achievements for this entry with detailed logging
                const newAchievements = await this.checkNewAchievementsClean(entry, entriesUpToNow, streaks);

                processedCount++;
                //console.log(`✅ Processed ${processedCount}/${sortedEntries.length} entries, awarded ${newAchievements.length} achievements`);
            }

            //console.log('🎉 Achievement refresh completed!');
            //console.log(`📈 Total achievements awarded: ${this.unlockedAchievements.length}`);

            // Update the UI
            await this.updateAchievements(allEntries, streaks, {});

            return {
                success: true,
                totalAchievements: this.unlockedAchievements.length,
                processedEntries: processedCount
            };

        } catch (error) {
            console.error('❌ Achievement refresh failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Clean version that doesn't interfere with normal achievement checking
    async checkNewAchievementsClean(entry, allEntries, streaks) {
        const newlyUnlocked = [];

        for (const achievement of this.achievementDefinitions) {
            const playersWhoEarned = this.checkAchievementRequirement(achievement, entry, allEntries, streaks);

            if (playersWhoEarned && playersWhoEarned.length > 0) {
                for (const player of playersWhoEarned) {
                    // Only check if not already unlocked for this specific requirement
                    let shouldUnlock = false;

                    if (achievement.oneTime) {
                        // For one-time achievements, check if player has ANY instance
                        const alreadyHas = this.unlockedAchievements.some(a =>
                            a.id === achievement.id && a.player === player
                        );
                        shouldUnlock = !alreadyHas;
                    } else {
                        // For repeatable achievements, only unlock once per entry date
                        const alreadyUnlockedForThisEntry = this.unlockedAchievements.some(a =>
                            a.id === achievement.id &&
                            a.player === player &&
                            a.unlockedAt.startsWith(entry.date)
                        );
                        shouldUnlock = !alreadyUnlockedForThisEntry;
                    }

                    if (shouldUnlock) {
                        await this.unlockAchievementClean(achievement, player, entry.date);
                        newlyUnlocked.push({...achievement, player});
                        //console.log(`🏆 Unlocked: ${achievement.title} for ${player} on ${entry.date}`);
                    }
                }
            }
        }

        return newlyUnlocked;
    }

    async unlockAchievementClean(achievement, player, entryDate) {
        const unlock = {
            id: achievement.id,
            player: player,
            unlockedAt: `${entryDate}T12:00:00.000Z`, // Use entry date, not current time
            title: achievement.title,
            description: achievement.description
        };

        this.unlockedAchievements.push(unlock);

        // Save immediately to database
        try {
            await fetch('/api/achievements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(unlock)
            });
        } catch (error) {
            console.error('Failed to save achievement:', error);
        }
    }

    async performAutomaticCleanup() {
        try {
            // Check if achievements need cleanup by looking for excessive counts
            const achievementCounts = {};
            this.unlockedAchievements.forEach(a => {
                const key = `${a.id}-${a.player}`;
                achievementCounts[key] = (achievementCounts[key] || 0) + 1;
            });

            // Get total number of entries
            const allEntries = await sudokuApp.loadFromStorage() || [];
            const totalEntries = allEntries.length;

            // Find achievements with excessive counts
            const excessiveAchievements = Object.entries(achievementCounts).filter(([key, count]) => {
                // Allow some flexibility but catch obvious errors (more than 2x entries)
                return count > Math.max(totalEntries * 2, 10);
            });

            if (excessiveAchievements.length > 0) {
                //console.log(`⚠️ Found ${excessiveAchievements.length} achievement types with excessive counts. Running full refresh...`);
                await this.refreshAllAchievements();
                //console.log('✅ Automatic cleanup completed');
            } else {
                //console.log('✅ Achievement counts look reasonable, no cleanup needed');
            }

        } catch (error) {
            console.error('❌ Automatic cleanup failed:', error);
            // Don't throw error to avoid breaking app initialization
        }
    }

    updateAchievementsSummary() {
        this.ensureUnlockedAchievementsArray();

        // Count achievements per player
        const playerCounts = {
            faidao: 0,
            filip: 0
        };

        // Count unique achievements per player (not individual unlocks)
        const uniqueAchievements = new Set();
        this.unlockedAchievements.forEach(achievement => {
            const key = `${achievement.id}-${achievement.player}`;
            if (!uniqueAchievements.has(key)) {
                uniqueAchievements.add(key);
                if (playerCounts.hasOwnProperty(achievement.player)) {
                    playerCounts[achievement.player]++;
                }
            }
        });

        // Update DOM elements
        const faidaoCountEl = document.getElementById('faidaoAchievementCount');
        const filipCountEl = document.getElementById('filipAchievementCount');
        const totalUnlockedEl = document.getElementById('totalAchievementsUnlocked');
        const totalAchievementsEl = document.getElementById('totalAchievements');

        if (faidaoCountEl) faidaoCountEl.textContent = playerCounts.faidao;
        if (filipCountEl) filipCountEl.textContent = playerCounts.filip;
        if (totalUnlockedEl) {
            // Count unique achievements unlocked (not per player)
            const uniqueAchievementsUnlocked = new Set();
            this.unlockedAchievements.forEach(achievement => {
                uniqueAchievementsUnlocked.add(achievement.id);
            });
            totalUnlockedEl.textContent = uniqueAchievementsUnlocked.size;
        }
        if (totalAchievementsEl) {
            // Total unique achievements (encouraging teamwork to unlock all)
            totalAchievementsEl.textContent = this.achievementDefinitions.length;
        }
    }
}

// Initialize achievements manager
window.achievementsManager = new AchievementsManager();

// Mobile popup functionality
class AchievementPopup {
    constructor() {
        this.popup = document.getElementById('achievementPopup');
        this.popupContent = document.getElementById('achievementPopupContent');
        this.closeBtn = document.getElementById('achievementPopupClose');
        this.currentAchievementId = null; // Track currently displayed achievement

        this.initializePopup();
    }

    initializePopup() {
        if (!this.popup || !this.closeBtn) {
            console.log('Popup elements not found:', {
                popup: !!this.popup,
                closeBtn: !!this.closeBtn
            });
            return;
        }

        // Close popup when clicking close button
        this.closeBtn.addEventListener('click', () => {
            this.hidePopup();
        });

        // Close popup when clicking outside content
        this.popup.addEventListener('click', (e) => {
            if (e.target === this.popup) {
                this.hidePopup();
            }
        });

        // Close popup on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.popup.classList.contains('show')) {
                this.hidePopup();
            }
        });
    }

    showPopup(achievementData) {
        if (!this.popup || !this.popupContent) return;

        // Check if clicking the same achievement - toggle behavior
        if (this.currentAchievementId === achievementData.id && this.popup.classList.contains('show')) {
            this.hidePopup();
            return;
        }

        // Create full achievement badge content for popup
        const content = `
            <button class="achievement-popup-close" id="achievementPopupClose">&times;</button>
            <div class="popup-achievement-badge">
                <div class="badge-icon">
                    <i class="${achievementData.icon}"></i>
                </div>
                <h3 class="badge-title">${achievementData.title}</h3>
                <p class="badge-description">${achievementData.description}</p>
                <div class="badge-rarity ${achievementData.rarity}">${achievementData.rarity.toUpperCase()}</div>
                ${achievementData.progressHTML || ''}
                ${achievementData.unlockedByHTML || ''}
                ${achievementData.dateHTML || ''}
            </div>
        `;

        this.popupContent.innerHTML = content;

        // Re-add close button event listener
        const newCloseBtn = this.popupContent.querySelector('.achievement-popup-close');
        if (newCloseBtn) {
            newCloseBtn.addEventListener('click', () => {
                this.hidePopup();
            });
        }

        // Store current achievement ID for toggle functionality
        this.currentAchievementId = achievementData.id;

        this.popup.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    hidePopup() {
        if (!this.popup) return;

        this.popup.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
        this.currentAchievementId = null; // Clear current achievement
    }
}

// Initialize popup manager after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing achievement popup...');
    window.achievementPopup = new AchievementPopup();
    console.log('Achievement popup initialized:', !!window.achievementPopup);
});

// Add global refresh function for easy access
window.refreshAchievements = async function() {
    //console.log('🔄 Starting achievement refresh...');
    const result = await window.achievementsManager.refreshAllAchievements();

    if (result.success) {
        //console.log('✅ Achievement refresh completed!');
        //console.log(`📊 Processed ${result.processedEntries} game entries`);
        //console.log(`🏆 Awarded ${result.totalAchievements} total achievements`);
        alert(`Achievement refresh completed!\n\nProcessed: ${result.processedEntries} game entries\nTotal achievements: ${result.totalAchievements}`);
    } else {
        console.error('❌ Achievement refresh failed:', result.error);
        alert(`Achievement refresh failed: ${result.error}`);
    }

    return result;
};