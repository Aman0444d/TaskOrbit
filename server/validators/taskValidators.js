/**
 * taskValidators.js
 * Input validation helpers for task routes.
 */

const VALID_STATUSES  = ['todo', 'in-progress', 'review', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const validateCreateTask = (req, res, next) => {
  const { title } = req.body || {};
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    errors.push('Task title must be at least 2 characters');
  }
  if (title && typeof title === 'string' && title.trim().length > 200) {
    errors.push('Task title cannot exceed 200 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }
  next();
};

const validateUpdateTask = (req, res, next) => {
  const { title, status, priority } = req.body || {};
  const errors = [];

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 2)   errors.push('Title must be at least 2 characters');
    if (typeof title === 'string' && title.trim().length > 200) errors.push('Title cannot exceed 200 characters');
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }
  next();
};

module.exports = { validateCreateTask, validateUpdateTask };
