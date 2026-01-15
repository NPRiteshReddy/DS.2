/**
 * Assignments Routes
 * API endpoints for assignment management
 */

const express = require('express');
const router = express.Router();
const assignmentsController = require('../controllers/assignments.controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Assignment CRUD
router.post('/', assignmentsController.createAssignment);
router.get('/', assignmentsController.getAssignments);
router.get('/upcoming', assignmentsController.getUpcomingAssignments);
router.get('/stats', assignmentsController.getStats);
router.get('/:id', assignmentsController.getAssignment);
router.put('/:id', assignmentsController.updateAssignment);
router.delete('/:id', assignmentsController.deleteAssignment);
router.post('/:id/complete', assignmentsController.completeAssignment);

module.exports = router;
