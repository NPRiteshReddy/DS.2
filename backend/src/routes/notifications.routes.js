/**
 * Notifications Routes
 * API endpoints for notification management
 */

const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.get('/', notificationsController.getNotifications);
router.get('/count', notificationsController.getUnreadCount);
router.get('/preferences', notificationsController.getPreferences);
router.put('/preferences', notificationsController.updatePreferences);
router.post('/read-all', notificationsController.markAllAsRead);
router.delete('/clear-all', notificationsController.clearAll);
router.post('/:id/read', notificationsController.markAsRead);
router.delete('/:id', notificationsController.deleteNotification);

module.exports = router;
