const { validationResult } = require('express-validator');

/**
 * Runs express-validator checks and returns 400 if any fail.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(400).json({
      error: {
        message: 'Validation failed',
        statusCode: 400,
        details: formattedErrors,
      },
    });
  }

  next();
};

module.exports = validate;
