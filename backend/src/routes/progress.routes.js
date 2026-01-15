/**
 * Progress Routes
 * API endpoints for progress, achievements, and gamification
 */

const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progress.controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.get('/', progressController.getProgress);
router.get('/achievements', progressController.getAchievements);
router.get('/activity', progressController.getActivityHistory);
router.get('/leaderboard', progressController.getLeaderboard);
router.post('/record', progressController.recordActivity);

module.exports = router;
