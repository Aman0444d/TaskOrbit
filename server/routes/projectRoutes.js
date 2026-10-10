const express = require('express');
const {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { getTasks, createTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const {
  validateCreateProject,
  validateUpdateProject,
} = require('../validators/projectValidators');
const { validateCreateTask } = require('../validators/taskValidators');

const router = express.Router();

// All project routes are protected
router.use(protect);

// GET  /api/projects      – list user's projects
// POST /api/projects      – create a project (with validation)
router.route('/').get(getProjects).post(validateCreateProject, createProject);

// CRITICAL FIX: Nested task routes MUST be declared before /:id
// Otherwise Express matches /:id with id="abc/tasks" before reaching this route.
// GET  /api/projects/:projectId/tasks  – list project tasks
// POST /api/projects/:projectId/tasks  – create task in project
router.route('/:projectId/tasks').get(getTasks).post(validateCreateTask, createTask);

// GET    /api/projects/:id  – get one project
// PUT    /api/projects/:id  – update a project (with validation)
// DELETE /api/projects/:id  – delete project + its tasks
router.route('/:id').get(getProjectById).put(validateUpdateProject, updateProject).delete(deleteProject);

module.exports = router;
