const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Create a booking with pessimistic locking to prevent overselling.
 *
 * Uses SELECT ... FOR UPDATE inside a Serializable transaction to ensure:
 * - Only one user can book the last seat
 * - No duplicate bookings per user per event
 * - All operations are atomic (check → decrement → create → log)
 */
async function createBooking(userId, eventId) {
  return await prisma.$transaction(
    async (tx) => {
      // 1. Log booking attempt (inside transaction — rolls back on failure)
      await tx.activityLog.create({
        data: {
          userId,
          eventId,
          action: 'BOOKING_STARTED',
          metadata: { timestamp: new Date().toISOString() },
        },
      });

      // 2. Acquire exclusive row-level lock on the event row
      const events = await tx.$queryRawUnsafe(
        `SELECT id, title, available_seats, total_seats, date
         FROM events
         WHERE id::text = $1
         FOR UPDATE`,
        eventId
      );

      const event = events[0];

      if (!event) {
        throw new ApiError(404, 'Event not found');
      }

      // 3. Check if event date has passed
      if (new Date(event.date) < new Date()) {
        throw new ApiError(400, 'Cannot book a past event');
      }

      // 4. Check seat availability (under lock — guaranteed accurate)
      if (event.available_seats <= 0) {
        logger.info(`Booking rejected: no seats available for event ${eventId}`, {
          userId,
          eventId,
          availableSeats: event.available_seats,
        });
        throw new ApiError(409, 'No seats available for this event');
      }

      // 5. Check for duplicate booking (belt-and-suspenders with DB constraint)
      const existingBooking = await tx.booking.findFirst({
        where: { userId, eventId, status: 'CONFIRMED' },
      });

      if (existingBooking) {
        throw new ApiError(409, 'You have already booked this event');
      }

      // 6. Decrement available seats
      await tx.event.update({
        where: { id: eventId },
        data: { availableSeats: { decrement: 1 } },
      });

      // 7. Create booking record
      const booking = await tx.booking.create({
        data: {
          userId,
          eventId,
          status: 'CONFIRMED',
        },
        select: {
          id: true,
          eventId: true,
          status: true,
          bookedAt: true,
          event: {
            select: { title: true, date: true, venue: true },
          },
        },
      });

      // 8. Log confirmation
      await tx.activityLog.create({
        data: {
          userId,
          eventId,
          action: 'BOOKING_CONFIRMED',
          metadata: { bookingId: booking.id },
        },
      });

      logger.info(`Booking confirmed: ${booking.id}`, {
        userId,
        eventId,
        bookingId: booking.id,
      });

      return booking;
    },
    {
      isolationLevel: 'Serializable',
      timeout: 10000, // 10s timeout to prevent deadlocks
    }
  );
}

/**
 * Cancel a booking and release the seat.
 * Also uses row-level locking to safely increment available_seats.
 */
async function cancelBooking(userId, bookingId) {
  return await prisma.$transaction(async (tx) => {
    // 1. Find the booking and verify ownership
    const booking = await tx.booking.findFirst({
      where: { id: bookingId, userId, status: 'CONFIRMED' },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found or already cancelled');
    }

    // 2. Lock the event row before modifying seats
    await tx.$queryRawUnsafe(
      `SELECT id FROM events WHERE id::text = $1 FOR UPDATE`,
      booking.eventId
    );

    // 3. Increment available seats
    await tx.event.update({
      where: { id: booking.eventId },
      data: { availableSeats: { increment: 1 } },
    });

    // 4. Update booking status
    const cancelled = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
      select: {
        id: true,
        eventId: true,
        status: true,
        bookedAt: true,
        cancelledAt: true,
        event: {
          select: { title: true, date: true, venue: true },
        },
      },
    });

    // 5. Log cancellation
    await tx.activityLog.create({
      data: {
        userId,
        eventId: booking.eventId,
        action: 'BOOKING_CANCELLED',
        metadata: { bookingId },
      },
    });

    logger.info(`Booking cancelled: ${bookingId}`, {
      userId,
      eventId: booking.eventId,
      bookingId,
    });

    return cancelled;
  });
}

/**
 * Get user's bookings (paginated)
 */
async function getUserBookings(userId, { page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        bookedAt: true,
        cancelledAt: true,
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            venue: true,
            price: true,
          },
        },
      },
      orderBy: { bookedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where: { userId } }),
  ]);

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = { createBooking, cancelBooking, getUserBookings };
