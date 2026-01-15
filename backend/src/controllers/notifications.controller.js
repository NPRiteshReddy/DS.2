/**
 * Notifications Controller
 * Handles user notifications management
 */

const { supabase } = require('../config/database');
const remindersService = require('../services/reminders.service');

/**
 * Get user notifications
 * GET /api/notifications
 */
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { unreadOnly, limit = 20 } = req.query;

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (unreadOnly === 'true') {
            query = query.eq('is_read', false);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Get unread count
        const unreadCount = await remindersService.getUnreadCount(userId);

        res.json({
            success: true,
            data: {
                notifications: data,
                unreadCount
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get notifications'
        });
    }
};

/**
 * Get unread count only
 * GET /api/notifications/count
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await remindersService.getUnreadCount(userId);

        res.json({
            success: true,
            data: { unreadCount: count }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get unread count'
        });
    }
};

/**
 * Mark notification as read
 * POST /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark as read'
        });
    }
};

/**
 * Mark all notifications as read
 * POST /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark all as read'
        });
    }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete notification'
        });
    }
};

/**
 * Clear all notifications
 * DELETE /api/notifications/clear-all
 */
const clearAll = async (req, res) => {
    try {
        const userId = req.user.id;

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;

        res.json({
            success: true,
            message: 'All notifications cleared'
        });
    } catch (error) {
        console.error('Clear all notifications error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear notifications'
        });
    }
};

/**
 * Get notification preferences
 * GET /api/notifications/preferences
 */
const getPreferences = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('user_notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({
            success: true,
            data: data || {
                email_enabled: true,
                whatsapp_enabled: false,
                whatsapp_phone: '',
                in_app_enabled: true
            }
        });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get preferences'
        });
    }
};

/**
 * Update notification preferences
 * PUT /api/notifications/preferences
 */
const updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { emailEnabled, whatsappEnabled, whatsappPhone, inAppEnabled } = req.body;

        const { data, error } = await supabase
            .from('user_notification_preferences')
            .upsert({
                user_id: userId,
                email_enabled: emailEnabled,
                whatsapp_enabled: whatsappEnabled,
                whatsapp_phone: whatsappPhone,
                in_app_enabled: inAppEnabled,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data,
            message: 'Preferences updated successfully'
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update preferences'
        });
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    getPreferences,
    updatePreferences
};
