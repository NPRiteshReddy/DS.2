/**
 * Progress Controller
 * Handles user progress, XP, streaks, and achievements
 */

const { supabase } = require('../config/database');

// XP rewards for actions
const XP_REWARDS = {
    pomodoro_complete: 25,
    assignment_complete: 50,
    flashcard_review: 5,
    video_create: 100,
    audio_create: 75,
    daily_login: 10
};

/**
 * Get user progress
 * GET /api/progress
 */
const getProgress = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get or create progress
        let { data: progress, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code === 'PGRST116') {
            // Create new progress record
            const { data: newProgress } = await supabase
                .from('user_progress')
                .insert({ user_id: userId })
                .select()
                .single();
            progress = newProgress;
        }

        // Calculate level thresholds
        const currentLevel = progress?.level || 1;
        const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
        const xpForNextLevel = Math.pow(currentLevel, 2) * 100;
        const xpProgress = progress?.total_xp - xpForCurrentLevel;
        const xpNeeded = xpForNextLevel - xpForCurrentLevel;

        res.json({
            success: true,
            data: {
                ...progress,
                xpProgress,
                xpNeeded,
                xpPercentage: Math.round((xpProgress / xpNeeded) * 100)
            }
        });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ success: false, error: 'Failed to get progress' });
    }
};

/**
 * Get user achievements
 * GET /api/progress/achievements
 */
const getAchievements = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all achievements
        const { data: allAchievements } = await supabase
            .from('achievements')
            .select('*')
            .order('category');

        // Get user's earned achievements
        const { data: earned } = await supabase
            .from('user_achievements')
            .select('achievement_id, earned_at')
            .eq('user_id', userId);

        const earnedIds = new Set(earned?.map(a => a.achievement_id) || []);
        const earnedMap = Object.fromEntries(earned?.map(a => [a.achievement_id, a.earned_at]) || []);

        const achievements = allAchievements?.map(a => ({
            ...a,
            earned: earnedIds.has(a.id),
            earned_at: earnedMap[a.id] || null
        }));

        res.json({
            success: true,
            data: {
                achievements,
                earned: earned?.length || 0,
                total: allAchievements?.length || 0
            }
        });
    } catch (error) {
        console.error('Get achievements error:', error);
        res.status(500).json({ success: false, error: 'Failed to get achievements' });
    }
};

/**
 * Get activity history
 * GET /api/progress/activity
 */
const getActivityHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const { data, error } = await supabase
            .from('daily_activity')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: true });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ success: false, error: 'Failed to get activity' });
    }
};

/**
 * Get leaderboard
 * GET /api/progress/leaderboard
 */
const getLeaderboard = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const { data, error } = await supabase
            .from('user_progress')
            .select(`
        user_id,
        total_xp,
        level,
        current_streak,
        users (
          full_name
        )
      `)
            .order('total_xp', { ascending: false })
            .limit(parseInt(limit));

        if (error) throw error;

        const leaderboard = data?.map((entry, index) => ({
            rank: index + 1,
            userId: entry.user_id,
            name: entry.users?.full_name || 'Anonymous',
            xp: entry.total_xp,
            level: entry.level,
            streak: entry.current_streak
        }));

        res.json({ success: true, data: leaderboard });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ success: false, error: 'Failed to get leaderboard' });
    }
};

/**
 * Add XP to user (internal helper)
 */
const addXP = async (userId, amount, action) => {
    const today = new Date().toISOString().split('T')[0];

    // Get current progress
    let { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (!progress) {
        const { data } = await supabase
            .from('user_progress')
            .insert({ user_id: userId })
            .select()
            .single();
        progress = data;
    }

    // Update streak
    let newStreak = progress.current_streak;
    let longestStreak = progress.longest_streak;

    if (progress.last_activity_date) {
        const lastDate = new Date(progress.last_activity_date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            newStreak += 1;
            if (newStreak > longestStreak) longestStreak = newStreak;
        } else if (diffDays > 1) {
            newStreak = 1;
        }
    } else {
        newStreak = 1;
    }

    // Calculate new XP and level
    const newXP = (progress.total_xp || 0) + amount;
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

    // Update progress
    await supabase
        .from('user_progress')
        .update({
            total_xp: newXP,
            level: newLevel,
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_activity_date: today,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

    // Update daily activity
    const { data: activity } = await supabase
        .from('daily_activity')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

    if (activity) {
        await supabase
            .from('daily_activity')
            .update({ xp_earned: (activity.xp_earned || 0) + amount })
            .eq('id', activity.id);
    } else {
        await supabase
            .from('daily_activity')
            .insert({ user_id: userId, date: today, xp_earned: amount });
    }

    // Check for streak achievements
    await checkStreakAchievements(userId, newStreak);

    return { xp: newXP, level: newLevel, streak: newStreak };
};

/**
 * Check and award streak achievements
 */
const checkStreakAchievements = async (userId, streak) => {
    const streakAchievements = [
        { streak: 3, id: 'streak_3' },
        { streak: 7, id: 'streak_7' },
        { streak: 30, id: 'streak_30' }
    ];

    for (const sa of streakAchievements) {
        if (streak >= sa.streak) {
            await awardAchievement(userId, sa.id);
        }
    }
};

/**
 * Award achievement to user
 */
const awardAchievement = async (userId, achievementId) => {
    // Check if already earned
    const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

    if (existing) return null;

    // Award achievement
    const { data: achievement } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', achievementId)
        .single();

    if (!achievement) return null;

    await supabase
        .from('user_achievements')
        .insert({ user_id: userId, achievement_id: achievementId });

    // Add XP reward
    if (achievement.xp_reward) {
        await addXP(userId, achievement.xp_reward, 'achievement');
    }

    return achievement;
};

/**
 * Record activity and check achievements
 * POST /api/progress/record
 */
const recordActivity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { action, data: actionData } = req.body;

        const xpAmount = XP_REWARDS[action] || 10;
        const result = await addXP(userId, xpAmount, action);

        res.json({
            success: true,
            data: {
                xpEarned: xpAmount,
                ...result
            }
        });
    } catch (error) {
        console.error('Record activity error:', error);
        res.status(500).json({ success: false, error: 'Failed to record activity' });
    }
};

module.exports = {
    getProgress,
    getAchievements,
    getActivityHistory,
    getLeaderboard,
    recordActivity,
    addXP,
    awardAchievement
};
