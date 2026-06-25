const { body } = require('express-validator');

const createBookingValidator = [
  body('eventId')
    .notEmpty()
    .withMessage('Event ID is required')
    .isUUID()
    .withMessage('Event ID must be a valid UUID'),
];

module.exports = { createBookingValidator };
