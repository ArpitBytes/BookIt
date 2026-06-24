const ApiError = require('../utils/ApiError');

/**
 * Role-based authorization middleware.
 * Must be used after authenticate middleware.
 * @param  {...string} roles - Allowed roles (e.g., 'ORGANIZER', 'USER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Access denied. Required role: ${roles.join(' or ')}`)
      );
    }

    next();
  };
};

module.exports = authorize;
