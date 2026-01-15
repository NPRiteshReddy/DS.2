/**
 * Study Controller
 * Handles study sessions and pomodoro tracking
 */

const { supabase } = require('../config/database');

/**
 * Start a study session
 * POST /api/study/sessions
 */
const startSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { assignmentId, title, type = 'pomodoro', durationMinutes = 25 } = req.body;

        const { data, error } = await supabase
            .from('study_sessions')
            .insert({
                user_id: userId,
                assignment_id: assignmentId || null,
                title: title || (type === 'pomodoro' ? 'Focus Session' : 'Break'),
                type,
                duration_minutes: durationMinutes,
                status: 'in_progress',
                started_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data,
            message: 'Session started'
        });
    } catch (error) {
        console.error('Start session error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start session'
        });
    }
};

/**
 * Complete a study session
 * POST /api/study/sessions/:id/complete
 */
const completeSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { notes } = req.body;

        const { data, error } = await supabase
            .from('study_sessions')
            .update({
                status: 'completed',
                ended_at: new Date().toISOString(),
                notes: notes || null
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        // Update daily stats
        await updateDailyStats(userId, data.duration_minutes, data.type);

        res.json({
            success: true,
            data,
            message: 'Session completed!'
        });
    } catch (error) {
        console.error('Complete session error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete session'
        });
    }
};

/**
 * Cancel a study session
 * POST /api/study/sessions/:id/cancel
 */
const cancelSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabase
            .from('study_sessions')
            .update({ status: 'cancelled', ended_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Session cancelled'
        });
    } catch (error) {
        console.error('Cancel session error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel session'
        });
    }
};

/**
 * Get study sessions for a date range
 * GET /api/study/sessions
 */
const getSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate, limit = 50 } = req.query;

        let query = supabase
            .from('study_sessions')
            .select('*, assignments(id, title, course_name)')
            .eq('user_id', userId)
            .order('started_at', { ascending: false })
            .limit(parseInt(limit));

        if (startDate) {
            query = query.gte('started_at', startDate);
        }
        if (endDate) {
            query = query.lte('started_at', endDate);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get sessions'
        });
    }
};

/**
 * Get today's stats
 * GET /api/study/today
 */
const getTodayStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('daily_study_stats')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({
            success: true,
            data: data || {
                total_study_minutes: 0,
                pomodoros_completed: 0,
                sessions_count: 0
            }
        });
    } catch (error) {
        console.error('Get today stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get today stats'
        });
    }
};

/**
 * Get weekly stats
 * GET /api/study/weekly
 */
const getWeeklyStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const { data, error } = await supabase
            .from('daily_study_stats')
            .select('*')
            .eq('user_id', userId)
            .gte('date', weekAgo.toISOString().split('T')[0])
            .order('date', { ascending: true });

        if (error) throw error;

        // Calculate totals
        const totals = data.reduce((acc, day) => ({
            totalMinutes: acc.totalMinutes + (day.total_study_minutes || 0),
            totalPomodoros: acc.totalPomodoros + (day.pomodoros_completed || 0),
            totalSessions: acc.totalSessions + (day.sessions_count || 0)
        }), { totalMinutes: 0, totalPomodoros: 0, totalSessions: 0 });

        res.json({
            success: true,
            data: {
                days: data,
                totals
            }
        });
    } catch (error) {
        console.error('Get weekly stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get weekly stats'
        });
    }
};

/**
 * Get pomodoro settings
 * GET /api/study/settings
 */
const getSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('pomodoro_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({
            success: true,
            data: data || {
                work_duration: 25,
                break_duration: 5,
                long_break_duration: 15,
                sessions_before_long_break: 4,
                auto_start_breaks: false,
                auto_start_pomodoros: false,
                sound_enabled: true
            }
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get settings'
        });
    }
};

/**
 * Update pomodoro settings
 * PUT /api/study/settings
 */
const updateSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const settings = req.body;

        const { data, error } = await supabase
            .from('pomodoro_settings')
            .upsert({
                user_id: userId,
                work_duration: settings.workDuration || 25,
                break_duration: settings.breakDuration || 5,
                long_break_duration: settings.longBreakDuration || 15,
                sessions_before_long_break: settings.sessionsBeforeLongBreak || 4,
                auto_start_breaks: settings.autoStartBreaks || false,
                auto_start_pomodoros: settings.autoStartPomodoros || false,
                sound_enabled: settings.soundEnabled ?? true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data,
            message: 'Settings saved'
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update settings'
        });
    }
};

/**
 * Helper: Update daily stats
 */
const updateDailyStats = async (userId, minutes, type) => {
    const today = new Date().toISOString().split('T')[0];

    // Get existing stats
    const { data: existing } = await supabase
        .from('daily_study_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

    const isPomodoro = type === 'pomodoro';

    if (existing) {
        await supabase
            .from('daily_study_stats')
            .update({
                total_study_minutes: existing.total_study_minutes + (isPomodoro ? minutes : 0),
                pomodoros_completed: existing.pomodoros_completed + (isPomodoro ? 1 : 0),
                sessions_count: existing.sessions_count + 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
    } else {
        await supabase
            .from('daily_study_stats')
            .insert({
                user_id: userId,
                date: today,
                total_study_minutes: isPomodoro ? minutes : 0,
                pomodoros_completed: isPomodoro ? 1 : 0,
                sessions_count: 1
            });
    }
};

module.exports = {
    startSession,
    completeSession,
    cancelSession,
    getSessions,
    getTodayStats,
    getWeeklyStats,
    getSettings,
    updateSettings
};
