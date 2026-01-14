/**
 * Resources Routes
 * API endpoints for resource library
 */

const express = require('express');
const router = express.Router();
const resourcesController = require('../controllers/resources.controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Stats
router.get('/stats', resourcesController.getStats);

// Folders
router.post('/folders', resourcesController.createFolder);
router.get('/folders', resourcesController.getFolders);
router.delete('/folders/:id', resourcesController.deleteFolder);

// Resources
router.post('/', resourcesController.createResource);
router.get('/', resourcesController.getResources);
router.get('/:id', resourcesController.getResource);
router.put('/:id', resourcesController.updateResource);
router.delete('/:id', resourcesController.deleteResource);
router.post('/:id/favorite', resourcesController.toggleFavorite);

module.exports = router;
