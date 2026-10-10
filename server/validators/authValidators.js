/**
 * authValidators.js
 * Input validation helpers for auth routes.
 */

/**
 * Middleware: validateRegister
 * Checks that name, email, and password are present and meet validation rules.
 */
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push('A valid email is required');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }
  next();
};

/**
 * Middleware: validateLogin
 * Checks that email and password fields are present and valid strings.
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required');
  }
  if (!password || typeof password !== 'string' || !password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }
  next();
};

module.exports = { validateRegister, validateLogin };
