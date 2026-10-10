const Task = require('../models/Task');
const Project = require('../models/Project');

// Allowed sort fields for tasks — prevents NoSQL injection through unvalidated sortBy
const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'title', 'status', 'priority', 'dueDate', 'order'];

const VALID_STATUSES   = ['todo', 'in-progress', 'review', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// @desc  Get all tasks (optionally scoped to a project)
// @route GET /api/tasks  |  GET /api/projects/:projectId/tasks
// @access Private
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, search, sortBy = 'order', order = 'asc' } = req.query;
    const filter = { owner: req.user._id };

    if (req.params.projectId) filter.project = req.params.projectId;

    // Validate enum query params
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      }
      filter.status = status;
    }
    if (priority) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ success: false, message: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
      }
      filter.priority = priority;
    }
    if (search) filter.title = { $regex: search.trim(), $options: 'i' };

    // Sanitise sortBy
    const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'order';
    const sortOrder = order === 'asc' ? 1 : -1;

    const tasks = await Task.find(filter)
      .populate('project', 'title color')
      .sort({ [safeSortBy]: sortOrder });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};

// @desc  Create a task inside a project
// @route POST /api/projects/:projectId/tasks
// @access Private
const createTask = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      owner: req.user._id,
    });
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Whitelist fields — prevent mass-assignment of owner or project
    const { title, description, status, priority, dueDate, order, tags } = req.body;
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      order,
      tags,
      project: project._id,
      owner: req.user._id,
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single task by ID
// @route GET /api/tasks/:id
// @access Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id }).populate(
      'project',
      'title color'
    );
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc  Update a task
// @route PUT /api/tasks/:id
// @access Private
const updateTask = async (req, res, next) => {
  try {
    // Whitelist updatable fields — never let client overwrite owner or project
    const { title, description, status, priority, dueDate, order, tags } = req.body;
    const updateData = {};
    if (title       !== undefined) updateData.title       = title;
    if (description !== undefined) updateData.description = description;
    if (status      !== undefined) updateData.status      = status;
    if (priority    !== undefined) updateData.priority    = priority;
    if (dueDate     !== undefined) updateData.dueDate     = dueDate;
    if (order       !== undefined) updateData.order       = order;
    if (tags        !== undefined) updateData.tags        = tags;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updateData,
      { returnDocument: 'after', runValidators: true }
    );
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete a task
// @route DELETE /api/tasks/:id
// @access Private
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, createTask, getTaskById, updateTask, deleteTask };
