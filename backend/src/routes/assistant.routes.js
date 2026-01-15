/**
 * AI Assistant Routes
 * API endpoints for AI study assistant
 */

const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistant.controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Sessions
router.post('/sessions', assistantController.createSession);
router.get('/sessions', assistantController.getSessions);
router.get('/sessions/:id', assistantController.getSession);
router.delete('/sessions/:id', assistantController.deleteSession);
router.post('/sessions/:id/chat', assistantController.chat);

// Quick actions
router.post('/quick-action', assistantController.quickAction);

module.exports = router;
