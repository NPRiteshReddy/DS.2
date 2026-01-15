/**
 * News Routes
 * API endpoints for news feed and user interests
 */

const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news.controller');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/categories', newsController.getCategories);

// Protected routes (require authentication)
router.get('/interests', authenticate, newsController.getUserInterests);
router.put('/interests', authenticate, newsController.updateUserInterests);
router.get('/', authenticate, newsController.getNewsFeed);
router.get('/saved', authenticate, newsController.getSavedArticles);
router.post('/:articleId/read', authenticate, newsController.markAsRead);
router.post('/:articleId/save', authenticate, newsController.toggleSave);

module.exports = router;
