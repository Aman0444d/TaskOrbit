/**
 * Middleware: notFound — catches requests that don't match any route.
 * Must be placed AFTER all route registrations in app.js.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { notFound };
