const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

/**
 * Get paginated events with optional search and date filter
 */
async function getEvents({ search, date, page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;
  const where = {};

  // Search by title (case-insensitive)
  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  // Filter by date (events on a specific day)
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    where.date = { gte: startOfDay, lte: endOfDay };
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        venue: true,
        date: true,
        totalSeats: true,
        availableSeats: true,
        price: true,
        createdAt: true,
        organizer: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'asc' },
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single event by ID.
 * Optionally logs an EVENT_VIEWED activity for authenticated users.
 */
async function getEventById(eventId, userId = null) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      description: true,
      venue: true,
      date: true,
      totalSeats: true,
      availableSeats: true,
      price: true,
      organizerId: true,
      createdAt: true,
      updatedAt: true,
      organizer: {
        select: { id: true, name: true },
      },
    },
  });

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // Track view for logged-in users (fire-and-forget, non-blocking)
  if (userId) {
    prisma.activityLog
      .create({
        data: {
          userId,
          eventId: event.id,
          action: 'EVENT_VIEWED',
        },
      })
      .catch(() => {});
  }

  return event;
}

/**
 * Create a new event (organizer only)
 */
async function createEvent(organizerId, data) {
  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      venue: data.venue,
      date: new Date(data.date),
      totalSeats: data.totalSeats,
      availableSeats: data.totalSeats, // Initially all seats are available
      price: data.price,
      organizerId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      venue: true,
      date: true,
      totalSeats: true,
      availableSeats: true,
      price: true,
      createdAt: true,
    },
  });

  return event;
}

/**
 * Update an existing event (organizer only, must own event)
 */
async function updateEvent(eventId, organizerId, data) {
  // Find the event and verify ownership
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  if (event.organizerId !== organizerId) {
    throw new ApiError(403, 'You can only edit your own events');
  }

  // If totalSeats is being updated, adjust availableSeats accordingly
  const updateData = { ...data };

  if (data.totalSeats !== undefined) {
    const bookedSeats = event.totalSeats - event.availableSeats;

    if (data.totalSeats < bookedSeats) {
      throw new ApiError(
        400,
        `Cannot reduce total seats below ${bookedSeats} (current bookings)`
      );
    }

    updateData.availableSeats = data.totalSeats - bookedSeats;
  }

  if (data.date) {
    updateData.date = new Date(data.date);
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: updateData,
    select: {
      id: true,
      title: true,
      description: true,
      venue: true,
      date: true,
      totalSeats: true,
      availableSeats: true,
      price: true,
      updatedAt: true,
    },
  });

  return updated;
}

/**
 * Get events by organizer (for dashboard)
 */
async function getOrganizerEvents(organizerId, { page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where: { organizerId },
      select: {
        id: true,
        title: true,
        date: true,
        venue: true,
        totalSeats: true,
        availableSeats: true,
        price: true,
        createdAt: true,
        _count: {
          select: {
            bookings: { where: { status: 'CONFIRMED' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.event.count({ where: { organizerId } }),
  ]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  getOrganizerEvents,
};
