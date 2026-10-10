const express = require('express');
const {
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { validateUpdateTask } = require('../validators/taskValidators');

const router = express.Router();

// All task routes are protected
router.use(protect);

// GET /api/tasks  – list all user tasks (supports ?status, ?priority, ?search, ?sortBy, ?order)
router.get('/', getTasks);

// GET    /api/tasks/:id  – get one task
// PUT    /api/tasks/:id  – update task (with validation)
// DELETE /api/tasks/:id  – delete task
router.route('/:id').get(getTaskById).put(validateUpdateTask, updateTask).delete(deleteTask);

module.exports = router;
