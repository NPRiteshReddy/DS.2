/**
 * Assignments Controller
 * Handles CRUD operations for assignments and related functionality
 */

const { supabase } = require('../config/database');
const remindersService = require('../services/reminders.service');

/**
 * Create a new assignment
 * POST /api/assignments
 */
const createAssignment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, courseName, dueDate, priority, reminders } = req.body;

        if (!title || !dueDate) {
            return res.status(400).json({
                success: false,
                error: 'Title and due date are required'
            });
        }

        // Create assignment
        const { data: assignment, error } = await supabase
            .from('assignments')
            .insert({
                user_id: userId,
                title,
                description,
                course_name: courseName,
                due_date: dueDate,
                priority: priority || 'medium',
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // Schedule reminders if provided
        if (reminders && reminders.length > 0) {
            await remindersService.scheduleMultipleReminders(
                userId,
                assignment.id,
                dueDate,
                reminders
            );
        }

        res.status(201).json({
            success: true,
            data: assignment,
            message: 'Assignment created successfully'
        });
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create assignment'
        });
    }
};

/**
 * Get all assignments for user
 * GET /api/assignments
 */
const getAssignments = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, priority, sort = 'due_date', order = 'asc' } = req.query;

        let query = supabase
            .from('assignments')
            .select('*')
            .eq('user_id', userId);

        // Filter by status
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        // Filter by priority
        if (priority && priority !== 'all') {
            query = query.eq('priority', priority);
        }

        // Sort
        const ascending = order === 'asc';
        query = query.order(sort, { ascending });

        const { data, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get assignments'
        });
    }
};

/**
 * Get upcoming assignments (next 7 days)
 * GET /api/assignments/upcoming
 */
const getUpcomingAssignments = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const { data, error } = await supabase
            .from('assignments')
            .select('*')
            .eq('user_id', userId)
            .neq('status', 'completed')
            .gte('due_date', now.toISOString())
            .lte('due_date', nextWeek.toISOString())
            .order('due_date', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Get upcoming assignments error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get upcoming assignments'
        });
    }
};

/**
 * Get single assignment
 * GET /api/assignments/:id
 */
const getAssignment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { data, error } = await supabase
            .from('assignments')
            .select(`
        *,
        reminders (
          id,
          remind_at,
          is_sent
        )
      `)
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: 'Assignment not found'
                });
            }
            throw error;
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get assignment error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get assignment'
        });
    }
};

/**
 * Update assignment
 * PUT /api/assignments/:id
 */
const updateAssignment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { title, description, courseName, dueDate, priority, status, reminders } = req.body;

        const updates = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (courseName !== undefined) updates.course_name = courseName;
        if (dueDate !== undefined) updates.due_date = dueDate;
        if (priority !== undefined) updates.priority = priority;
        if (status !== undefined) updates.status = status;

        const { data, error } = await supabase
            .from('assignments')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: 'Assignment not found'
                });
            }
            throw error;
        }

        // Update reminders if provided
        if (reminders && dueDate) {
            // Delete existing reminders
            await remindersService.deleteRemindersForAssignment(id);
            // Schedule new ones
            await remindersService.scheduleMultipleReminders(userId, id, dueDate, reminders);
        }

        res.json({
            success: true,
            data,
            message: 'Assignment updated successfully'
        });
    } catch (error) {
        console.error('Update assignment error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update assignment'
        });
    }
};

/**
 * Delete assignment
 * DELETE /api/assignments/:id
 */
const deleteAssignment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Delete reminders first (cascades should handle this, but being explicit)
        await remindersService.deleteRemindersForAssignment(id);

        const { error } = await supabase
            .from('assignments')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Assignment deleted successfully'
        });
    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete assignment'
        });
    }
};

/**
 * Mark assignment as completed
 * POST /api/assignments/:id/complete
 */
const completeAssignment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { data, error } = await supabase
            .from('assignments')
            .update({ status: 'completed' })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: 'Assignment not found'
                });
            }
            throw error;
        }

        // Delete pending reminders for completed assignment
        await remindersService.deleteRemindersForAssignment(id);

        res.json({
            success: true,
            data,
            message: 'Assignment marked as completed'
        });
    } catch (error) {
        console.error('Complete assignment error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete assignment'
        });
    }
};

/**
 * Get assignment statistics
 * GET /api/assignments/stats
 */
const getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('assignments')
            .select('status')
            .eq('user_id', userId);

        if (error) throw error;

        const stats = {
            total: data.length,
            pending: data.filter(a => a.status === 'pending').length,
            inProgress: data.filter(a => a.status === 'in_progress').length,
            completed: data.filter(a => a.status === 'completed').length,
            overdue: data.filter(a => a.status === 'overdue').length
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get statistics'
        });
    }
};

module.exports = {
    createAssignment,
    getAssignments,
    getUpcomingAssignments,
    getAssignment,
    updateAssignment,
    deleteAssignment,
    completeAssignment,
    getStats
};
