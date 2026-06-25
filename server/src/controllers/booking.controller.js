const bookingService = require('../services/booking.service');

async function createBooking(req, res, next) {
  try {
    const booking = await bookingService.createBooking(
      req.user.id,
      req.body.eventId
    );
    res.status(201).json({ booking });
  } catch (error) {
    next(error);
  }
}

async function getUserBookings(req, res, next) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await bookingService.getUserBookings(req.user.id, {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10) || 10, 50),
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const booking = await bookingService.cancelBooking(
      req.user.id,
      req.params.id
    );
    res.status(200).json({ booking });
  } catch (error) {
    next(error);
  }
}

module.exports = { createBooking, getUserBookings, cancelBooking };
