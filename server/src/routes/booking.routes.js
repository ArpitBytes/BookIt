const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  createBookingValidator,
} = require('../validators/booking.validator');

// POST /api/bookings — create a booking (user only)
router.post(
  '/',
  authenticate,
  authorize('USER'),
  createBookingValidator,
  validate,
  bookingController.createBooking
);

// GET /api/bookings — get user's bookings
router.get('/', authenticate, bookingController.getUserBookings);

// PATCH /api/bookings/:id/cancel — cancel a booking
router.patch(
  '/:id/cancel',
  authenticate,
  bookingController.cancelBooking
);

module.exports = router;
