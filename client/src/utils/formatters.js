/**
 * utils/formatters.js
 * Reusable formatting helpers used across the UI.
 */

/**
 * Formats a date string or Date object into a readable short form.
 * @param {string|Date} date
 * @returns {string} e.g. "Oct 9, 2026"
 */
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Returns true if the given date is in the past (overdue).
 * @param {string|Date} date
 * @returns {boolean}
 */
export const isOverdue = (date) => {
  if (!date) return false;
  return new Date(date) < new Date();
};

/**
 * Capitalizes the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

/**
 * Converts a task/project status key into a display label.
 * @param {string} status
 * @returns {string}
 */
export const statusLabel = (status) => {
  const map = {
    todo: 'To Do',
    'in-progress': 'In Progress',
    review: 'Review',
    done: 'Done',
    active: 'Active',
    completed: 'Completed',
    archived: 'Archived',
  };
  return map[status] || capitalize(status);
};

/**
 * Maps a priority string to a Tailwind CSS color class (utility).
 * @param {string} priority - 'low' | 'medium' | 'high' | 'urgent'
 * @returns {string}
 */
export const priorityColor = (priority) => {
  const map = {
    low: 'text-green-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    urgent: 'text-red-600',
  };
  return map[priority] || 'text-gray-400';
};
