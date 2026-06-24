const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  signupValidator,
  loginValidator,
} = require('../validators/auth.validator');

// POST /api/auth/signup
router.post('/signup', signupValidator, validate, authController.signup);

// POST /api/auth/login
router.post('/login', loginValidator, validate, authController.login);

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe);

module.exports = router;
