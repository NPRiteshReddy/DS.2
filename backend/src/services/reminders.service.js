/**
 * Reminders Service
 * Handles scheduling and sending reminders for assignments
 */

const { supabase } = require('../config/database');
const emailService = require('./email.service');
/**
 * Schedule a reminder for an assignment
 * @param {Object} params - Reminder parameters
 * @returns {Promise<Object>} Created reminder
 */
const scheduleReminder = async ({ userId, assignmentId, remindAt }) => {
    const { data, error } = await supabase
        .from('reminders')
        .insert({
            user_id: userId,
            assignment_id: assignmentId,
            remind_at: remindAt
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Schedule multiple reminders based on preset options
 * @param {string} userId - User ID
 * @param {string} assignmentId - Assignment ID
 * @param {Date} dueDate - Assignment due date
 * @param {Array<string>} reminderOptions - Array of reminder options ('1day', '3days', '1week', etc.)
 * @returns {Promise<Array>} Created reminders
 */
const scheduleMultipleReminders = async (userId, assignmentId, dueDate, reminderOptions = ['1day']) => {
    const reminders = [];
    const dueDateObj = new Date(dueDate);

    for (const option of reminderOptions) {
        let remindAt;

        switch (option) {
            case '1hour':
                remindAt = new Date(dueDateObj.getTime() - 60 * 60 * 1000);
                break;
            case '3hours':
                remindAt = new Date(dueDateObj.getTime() - 3 * 60 * 60 * 1000);
                break;
            case '1day':
                remindAt = new Date(dueDateObj.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '3days':
                remindAt = new Date(dueDateObj.getTime() - 3 * 24 * 60 * 60 * 1000);
                break;
            case '1week':
                remindAt = new Date(dueDateObj.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            default:
                // Custom: parse as ISO date string or skip
                if (option.startsWith('custom:')) {
                    remindAt = new Date(option.replace('custom:', ''));
                } else {
                    continue;
                }
        }

        // Only schedule if remind time is in the future
        if (remindAt > new Date()) {
            const reminder = await scheduleReminder({
                userId,
                assignmentId,
                remindAt: remindAt.toISOString()
            });
            reminders.push(reminder);
        }
    }

    return reminders;
};

/**
 * Delete all reminders for an assignment
 * @param {string} assignmentId - Assignment ID
 */
const deleteRemindersForAssignment = async (assignmentId) => {
    await supabase
        .from('reminders')
        .delete()
        .eq('assignment_id', assignmentId);
};

/**
 * Create an in-app notification
 * @param {Object} params - Notification params
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async ({ userId, type = 'reminder', title, message, link }) => {
    const { data, error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            type,
            title,
            message,
            link
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Check and process due reminders
 * This should be called by a cron job or worker process
 * @returns {Promise<number>} Number of reminders processed
 */
const processDueReminders = async () => {
    const now = new Date().toISOString();

    // Get all due reminders that haven't been sent
    const { data: dueReminders, error } = await supabase
        .from('reminders')
        .select(`
      id,
      user_id,
      assignment_id,
      remind_at,
      assignments (
        id,
        title,
        due_date,
        course_name
      )
    `)
        .eq('is_sent', false)
        .lte('remind_at', now);

    if (error) {
        console.error('Error fetching due reminders:', error);
        return 0;
    }

    let processedCount = 0;

    for (const reminder of dueReminders) {
        try {
            const assignment = reminder.assignments;
            if (!assignment) continue;

            // Calculate time until due
            const dueDate = new Date(assignment.due_date);
            const timeDiff = dueDate - new Date();
            const hoursUntilDue = Math.round(timeDiff / (1000 * 60 * 60));

            let timeMessage;
            if (hoursUntilDue <= 0) {
                timeMessage = 'is overdue!';
            } else if (hoursUntilDue < 24) {
                timeMessage = `is due in ${hoursUntilDue} hour${hoursUntilDue === 1 ? '' : 's'}`;
            } else {
                const daysUntilDue = Math.round(hoursUntilDue / 24);
                timeMessage = `is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`;
            }

            // Create notification
            await createNotification({
                userId: reminder.user_id,
                type: 'reminder',
                title: `Assignment Reminder: ${assignment.title}`,
                message: `${assignment.title}${assignment.course_name ? ` (${assignment.course_name})` : ''} ${timeMessage}`,
                link: `/assignments?highlight=${assignment.id}`
            });

            // Mark reminder as sent
            await supabase
                .from('reminders')
                .update({ is_sent: true })
                .eq('id', reminder.id);

            processedCount++;
        } catch (err) {
            console.error(`Error processing reminder ${reminder.id}:`, err);
        }
    }

    return processedCount;
};

/**
 * Mark overdue assignments
 * @returns {Promise<number>} Number of assignments marked as overdue
 */
const markOverdueAssignments = async () => {
    const { data, error } = await supabase
        .from('assignments')
        .update({ status: 'overdue' })
        .lt('due_date', new Date().toISOString())
        .not('status', 'in', '("completed","overdue")')
        .eq('is_archived', false)
        .select();

    if (error) {
        console.error('Error marking overdue assignments:', error);
        return 0;
    }

    return data?.length || 0;
};

/**
 * Get user's unread notification count
 * @param {string} userId - User ID
 * @returns {Promise<number>} Unread count
 */
const getUnreadCount = async (userId) => {
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) return 0;
    return count || 0;
};

module.exports = {
    scheduleReminder,
    scheduleMultipleReminders,
    deleteRemindersForAssignment,
    createNotification,
    processDueReminders,
    markOverdueAssignments,
    getUnreadCount
};
