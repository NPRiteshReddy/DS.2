/**
 * Study Routes
 * API endpoints for study sessions and pomodoro
 */

const express = require('express');
const router = express.Router();
const studyController = require('../controllers/study.controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Sessions
router.post('/sessions', studyController.startSession);
router.post('/sessions/:id/complete', studyController.completeSession);
router.post('/sessions/:id/cancel', studyController.cancelSession);
router.get('/sessions', studyController.getSessions);

// Stats
router.get('/today', studyController.getTodayStats);
router.get('/weekly', studyController.getWeeklyStats);

// Settings
router.get('/settings', studyController.getSettings);
router.put('/settings', studyController.updateSettings);

module.exports = router;
