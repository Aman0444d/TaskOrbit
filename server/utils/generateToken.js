const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT for the given user ID.
 * @param {string} id - MongoDB ObjectId of the user.
 * @returns {string} Signed JWT token.
 */
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'taskorbit_fallback_dev_jwt_secret';
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
