/**
 * projectValidators.js
 * Input validation helpers for project routes.
 */

const validateCreateProject = (req, res, next) => {
  const { title } = req.body || {};
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    errors.push('Project title must be at least 2 characters');
  }
  if (title && typeof title === 'string' && title.trim().length > 200) {
    errors.push('Project title cannot exceed 200 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }
  next();
};

const validateUpdateProject = (req, res, next) => {
  const { title, status } = req.body || {};
  const errors = [];

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 2) errors.push('Title must be at least 2 characters');
    if (typeof title === 'string' && title.trim().length > 200) errors.push('Title cannot exceed 200 characters');
  }

  const validStatuses = ['active', 'completed', 'archived'];
  if (status !== undefined && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }
  next();
};

module.exports = { validateCreateProject, validateUpdateProject };
