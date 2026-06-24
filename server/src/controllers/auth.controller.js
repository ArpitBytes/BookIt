const authService = require('../services/auth.service');

async function signup(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.signup({ name, email, password, role });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res) {
  res.status(200).json({ user: req.user });
}

module.exports = { signup, login, getMe };
