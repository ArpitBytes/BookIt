const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// All dashboard routes require ORGANIZER role
router.use(authenticate, authorize('ORGANIZER'));

// GET /api/dashboard/stats
router.get('/stats', dashboardController.getStats);

// GET /api/dashboard/analytics
router.get('/analytics', dashboardController.getAnalytics);

// GET /api/dashboard/activity-logs
router.get('/activity-logs', dashboardController.getActivityLogs);

// GET /api/dashboard/events/:id/attendees
router.get('/events/:id/attendees', dashboardController.getEventAttendees);

module.exports = router;
