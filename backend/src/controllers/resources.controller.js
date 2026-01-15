/**
 * Resources Controller
 * Handles resource library management
 */

const { supabase } = require('../config/database');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ============================================================================
// Resource Operations
// ============================================================================

/**
 * Create a resource (link or note)
 * POST /api/resources
 */
const createResource = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, type, url, content, description, tags, folderId } = req.body;

        if (!title || !type) {
            return res.status(400).json({ success: false, error: 'Title and type are required' });
        }

        const { data, error } = await supabase
            .from('resources')
            .insert({
                user_id: userId,
                folder_id: folderId || null,
                title,
                type,
                url,
                content,
                description,
                tags: tags || []
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Create resource error:', error);
        res.status(500).json({ success: false, error: 'Failed to create resource' });
    }
};

/**
 * Get all resources
 * GET /api/resources
 */
const getResources = async (req, res) => {
    try {
        const userId = req.user.id;
        const { folderId, type, search, favorites } = req.query;

        let query = supabase
            .from('resources')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (folderId) {
            query = query.eq('folder_id', folderId);
        } else if (folderId === 'root') {
            query = query.is('folder_id', null);
        }

        if (type) {
            query = query.eq('type', type);
        }

        if (favorites === 'true') {
            query = query.eq('is_favorite', true);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get resources error:', error);
        res.status(500).json({ success: false, error: 'Failed to get resources' });
    }
};

/**
 * Get single resource
 * GET /api/resources/:id
 */
const getResource = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { data, error } = await supabase
            .from('resources')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get resource error:', error);
        res.status(500).json({ success: false, error: 'Failed to get resource' });
    }
};

/**
 * Update resource
 * PUT /api/resources/:id
 */
const updateResource = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('resources')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Update resource error:', error);
        res.status(500).json({ success: false, error: 'Failed to update resource' });
    }
};

/**
 * Delete resource
 * DELETE /api/resources/:id
 */
const deleteResource = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Get resource to check for file
        const { data: resource } = await supabase
            .from('resources')
            .select('file_path')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        // Delete file if exists
        if (resource?.file_path) {
            const filePath = path.join(UPLOADS_DIR, resource.file_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        const { error } = await supabase
            .from('resources')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ success: true, message: 'Resource deleted' });
    } catch (error) {
        console.error('Delete resource error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete resource' });
    }
};

/**
 * Toggle favorite
 * POST /api/resources/:id/favorite
 */
const toggleFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { data: resource } = await supabase
            .from('resources')
            .select('is_favorite')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        const { data, error } = await supabase
            .from('resources')
            .update({ is_favorite: !resource.is_favorite })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Toggle favorite error:', error);
        res.status(500).json({ success: false, error: 'Failed to toggle favorite' });
    }
};

// ============================================================================
// Folder Operations
// ============================================================================

/**
 * Create folder
 * POST /api/resources/folders
 */
const createFolder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, parentId, color } = req.body;

        const { data, error } = await supabase
            .from('resource_folders')
            .insert({
                user_id: userId,
                name,
                parent_id: parentId || null,
                color: color || 'gray'
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Create folder error:', error);
        res.status(500).json({ success: false, error: 'Failed to create folder' });
    }
};

/**
 * Get folders
 * GET /api/resources/folders
 */
const getFolders = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('resource_folders')
            .select('*')
            .eq('user_id', userId)
            .order('name');

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get folders error:', error);
        res.status(500).json({ success: false, error: 'Failed to get folders' });
    }
};

/**
 * Delete folder
 * DELETE /api/resources/folders/:id
 */
const deleteFolder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabase
            .from('resource_folders')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ success: true, message: 'Folder deleted' });
    } catch (error) {
        console.error('Delete folder error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete folder' });
    }
};

/**
 * Get resource stats
 * GET /api/resources/stats
 */
const getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('resources')
            .select('type')
            .eq('user_id', userId);

        if (error) throw error;

        const stats = {
            total: data.length,
            links: data.filter(r => r.type === 'link').length,
            notes: data.filter(r => r.type === 'note').length,
            files: data.filter(r => ['pdf', 'file', 'image'].includes(r.type)).length
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
};

module.exports = {
    createResource,
    getResources,
    getResource,
    updateResource,
    deleteResource,
    toggleFavorite,
    createFolder,
    getFolders,
    deleteFolder,
    getStats
};
