const eventService = require('../services/event.service');
const prisma = require('../utils/prisma');

async function getEvents(req, res, next) {
  try {
    const { search, date, page = 1, limit = 10 } = req.query;
    const result = await eventService.getEvents({
      search,
      date,
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10) || 10, 50),
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getEventById(req, res, next) {
  try {
    const event = await eventService.getEventById(req.params.id);

    // Log EVENT_VIEWED for authenticated users (fire-and-forget)
    if (req.user) {
      prisma.activityLog
        .create({
          data: {
            userId: req.user.id,
            eventId: event.id,
            action: 'EVENT_VIEWED',
          },
        })
        .catch(() => {
          // Silently ignore logging failures
        });
    }

    res.status(200).json({ event });
  } catch (error) {
    next(error);
  }
}

async function createEvent(req, res, next) {
  try {
    const event = await eventService.createEvent(req.user.id, req.body);
    res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
}

async function updateEvent(req, res, next) {
  try {
    const event = await eventService.updateEvent(
      req.params.id,
      req.user.id,
      req.body
    );
    res.status(200).json({ event });
  } catch (error) {
    next(error);
  }
}

async function getOrganizerEvents(req, res, next) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await eventService.getOrganizerEvents(req.user.id, {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10) || 10, 50),
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  getOrganizerEvents,
};
