const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  createEventValidator,
  updateEventValidator,
} = require('../validators/event.validator');

// GET /api/events — public listing with search, filter, pagination
router.get('/', optionalAuth, eventController.getEvents);

// GET /api/events/mine — organizer's own events
router.get(
  '/mine',
  authenticate,
  authorize('ORGANIZER'),
  eventController.getOrganizerEvents
);

// GET /api/events/:id — single event detail
router.get('/:id', optionalAuth, eventController.getEventById);

// POST /api/events — create event (organizer only)
router.post(
  '/',
  authenticate,
  authorize('ORGANIZER'),
  createEventValidator,
  validate,
  eventController.createEvent
);

// PUT /api/events/:id — update event (organizer only, must own)
router.put(
  '/:id',
  authenticate,
  authorize('ORGANIZER'),
  updateEventValidator,
  validate,
  eventController.updateEvent
);

module.exports = router;
