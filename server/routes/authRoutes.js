const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../validators/authValidators');

const router = express.Router();

// POST /api/auth/register  (with input validation)
router.post('/register', validateRegister, register);

// POST /api/auth/login  (with input validation)
router.post('/login', validateLogin, login);

// GET /api/auth/me  (protected)
router.get('/me', protect, getMe);

module.exports = router;
