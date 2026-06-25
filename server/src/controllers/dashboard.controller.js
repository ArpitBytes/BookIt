const dashboardService = require('../services/dashboard.service');

async function getStats(req, res, next) {
  try {
    const stats = await dashboardService.getOrganizerStats(req.user.id);
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
}

async function getEventAttendees(req, res, next) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await dashboardService.getEventAttendees(
      req.params.id,
      req.user.id,
      {
        page: parseInt(page, 10),
        limit: Math.min(parseInt(limit, 10) || 10, 50),
      }
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getAnalytics(req, res, next) {
  try {
    const { eventId } = req.query;
    const analytics = await dashboardService.getAnalytics(
      req.user.id,
      eventId
    );
    res.status(200).json(analytics);
  } catch (error) {
    next(error);
  }
}

async function getActivityLogs(req, res, next) {
  try {
    const { eventId, action, page = 1, limit = 20 } = req.query;
    const result = await dashboardService.getActivityLogs(req.user.id, {
      eventId,
      action,
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10) || 20, 50),
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { getStats, getEventAttendees, getAnalytics, getActivityLogs };
