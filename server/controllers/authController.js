const generateToken = require('../utils/generateToken');
const User = require('../models/User');

// @desc  Register a new user
// @route POST /api/auth/register
// @access Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      res.status(409);
      throw new Error('Email is already registered');
    }

    // Only allow safe fields — prevent mass-assignment of e.g. avatar injection
    const user = await User.create({ name: name.trim(), email, password });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Login user and return JWT
// @route POST /api/auth/login
// @access Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get current authenticated user profile
// @route GET /api/auth/me
// @access Private
const getMe = (req, res) => {
  // req.user is already fully populated by authMiddleware.protect
  // No extra DB round-trip needed
  res.json({ success: true, data: req.user });
};

module.exports = { register, login, getMe };
