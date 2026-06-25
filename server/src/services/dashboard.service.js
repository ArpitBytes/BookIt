const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

/**
 * Get overall stats for an organizer
 */
async function getOrganizerStats(organizerId) {
  const [totalEvents, bookingStats, revenueResult, viewCount, confirmCount] =
    await Promise.all([
      // Total events
      prisma.event.count({ where: { organizerId } }),

      // Total confirmed bookings
      prisma.booking.count({
        where: {
          event: { organizerId },
          status: 'CONFIRMED',
        },
      }),

      // Total revenue
      prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(e.price), 0) as total_revenue
         FROM bookings b
         JOIN events e ON b.event_id = e.id
         WHERE e.organizer_id::text = $1
           AND b.status = 'CONFIRMED'`,
        organizerId
      ),

      // Views count (for conversion rate)
      prisma.activityLog.count({
        where: {
          action: 'EVENT_VIEWED',
          event: { organizerId },
        },
      }),

      // Confirmed bookings count (for conversion rate)
      prisma.activityLog.count({
        where: {
          action: 'BOOKING_CONFIRMED',
          event: { organizerId },
        },
      }),
    ]);

  const totalRevenue = Number(revenueResult[0]?.total_revenue || 0);
  const conversionRate =
    viewCount > 0 ? ((confirmCount / viewCount) * 100).toFixed(2) : 0;

  return {
    totalEvents,
    totalBookings: bookingStats,
    totalRevenue,
    conversionRate: Number(conversionRate),
  };
}

/**
 * Get attendees for a specific event
 */
async function getEventAttendees(eventId, organizerId, { page = 1, limit = 10 }) {
  // Verify event ownership
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, title: true },
  });

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  if (event.organizerId !== organizerId) {
    throw new ApiError(403, 'You can only view attendees for your own events');
  }

  const skip = (page - 1) * limit;

  const [attendees, total] = await Promise.all([
    prisma.booking.findMany({
      where: { eventId, status: 'CONFIRMED' },
      select: {
        id: true,
        bookedAt: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { bookedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.booking.count({
      where: { eventId, status: 'CONFIRMED' },
    }),
  ]);

  return {
    eventTitle: event.title,
    attendees: attendees.map((a) => ({
      id: a.user.id,
      name: a.user.name,
      email: a.user.email,
      bookedAt: a.bookedAt,
      bookingId: a.id,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get analytics data for organizer
 */
async function getAnalytics(organizerId, eventId) {
  // Build the optional event filter clause and params
  const viewsQuery = eventId
    ? `SELECT DATE(al.created_at) as date, COUNT(*)::int as count
       FROM activity_logs al
       JOIN events e ON al.event_id = e.id
       WHERE e.organizer_id::text = $1
         AND al.action = 'EVENT_VIEWED'
         AND al.created_at >= NOW() - INTERVAL '30 days'
         AND al.event_id::text = $2
       GROUP BY DATE(al.created_at)
       ORDER BY date`
    : `SELECT DATE(al.created_at) as date, COUNT(*)::int as count
       FROM activity_logs al
       JOIN events e ON al.event_id = e.id
       WHERE e.organizer_id::text = $1
         AND al.action = 'EVENT_VIEWED'
         AND al.created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(al.created_at)
       ORDER BY date`;

  const bookingsQuery = eventId
    ? `SELECT DATE(b.booked_at) as date, COUNT(*)::int as count
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       WHERE e.organizer_id::text = $1
         AND b.status = 'CONFIRMED'
         AND b.booked_at >= NOW() - INTERVAL '30 days'
         AND b.event_id::text = $2
       GROUP BY DATE(b.booked_at)
       ORDER BY date`
    : `SELECT DATE(b.booked_at) as date, COUNT(*)::int as count
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       WHERE e.organizer_id::text = $1
         AND b.status = 'CONFIRMED'
         AND b.booked_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(b.booked_at)
       ORDER BY date`;

  const conversionQuery = `
    SELECT
      e.id,
      e.title,
      COUNT(CASE WHEN al.action = 'EVENT_VIEWED' THEN 1 END)::int as views,
      COUNT(CASE WHEN al.action = 'BOOKING_CONFIRMED' THEN 1 END)::int as bookings
    FROM events e
    LEFT JOIN activity_logs al ON al.event_id = e.id
    WHERE e.organizer_id::text = $1
    GROUP BY e.id, e.title
    ORDER BY views DESC
    LIMIT 10`;

  const queryParams = eventId ? [organizerId, eventId] : [organizerId];

  const [viewsOverTime, bookingsOverTime, topEvents, conversionData] =
    await Promise.all([
      prisma.$queryRawUnsafe(viewsQuery, ...queryParams),
      prisma.$queryRawUnsafe(bookingsQuery, ...queryParams),

      // Top events by bookings (Prisma query — no UUID issue)
      prisma.event.findMany({
        where: { organizerId },
        select: {
          id: true,
          title: true,
          totalSeats: true,
          availableSeats: true,
          _count: {
            select: {
              bookings: { where: { status: 'CONFIRMED' } },
            },
          },
        },
        orderBy: {
          bookings: { _count: 'desc' },
        },
        take: 5,
      }),

      prisma.$queryRawUnsafe(conversionQuery, organizerId),
    ]);

  return {
    viewsOverTime,
    bookingsOverTime,
    topEvents: topEvents.map((e) => ({
      id: e.id,
      title: e.title,
      totalSeats: e.totalSeats,
      bookedSeats: e.totalSeats - e.availableSeats,
      bookingCount: e._count.bookings,
    })),
    conversionData: conversionData.map((e) => ({
      id: e.id,
      title: e.title,
      views: e.views,
      bookings: e.bookings,
      conversionRate: e.views > 0 ? ((e.bookings / e.views) * 100).toFixed(2) : 0,
    })),
  };
}

/**
 * Get activity logs for organizer's events
 */
async function getActivityLogs(
  organizerId,
  { eventId, action, page = 1, limit = 20 }
) {
  const skip = (page - 1) * limit;

  const where = {
    event: { organizerId },
  };

  if (eventId) {
    where.eventId = eventId;
  }

  if (action) {
    where.action = action;
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        metadata: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        event: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  getOrganizerStats,
  getEventAttendees,
  getAnalytics,
  getActivityLogs,
};
