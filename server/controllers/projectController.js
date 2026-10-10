const Project = require('../models/Project');
const Task = require('../models/Task');

// Allowed sort fields — prevents NoSQL injection through unvalidated sortBy
const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'title', 'status', 'dueDate'];

// @desc  Get all projects for the authenticated user
// @route GET /api/projects
// @access Private
const getProjects = async (req, res, next) => {
  try {
    const { status, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    const filter = { owner: req.user._id };

    // Validate status against allowed enum values
    const validStatuses = ['active', 'completed', 'archived'];
    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(', ')}` });
      }
      filter.status = status;
    }

    if (search) filter.title = { $regex: search.trim(), $options: 'i' };

    // Sanitise sortBy — reject unknown fields
    const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    const projects = await Project.find(filter).sort({ [safeSortBy]: sortOrder });

    res.json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};

// @desc  Create a new project
// @route POST /api/projects
// @access Private
const createProject = async (req, res, next) => {
  try {
    // Whitelist fields — prevent mass-assignment of owner or other internal fields
    const { title, description, status, color, dueDate } = req.body;
    const project = await Project.create({
      title,
      description,
      status,
      color,
      dueDate,
      owner: req.user._id,
    });
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single project by ID
// @route GET /api/projects/:id
// @access Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// @desc  Update a project
// @route PUT /api/projects/:id
// @access Private
const updateProject = async (req, res, next) => {
  try {
    // Whitelist updatable fields — never let client overwrite owner
    const { title, description, status, color, dueDate } = req.body;
    const updateData = {};
    if (title      !== undefined) updateData.title       = title;
    if (description !== undefined) updateData.description = description;
    if (status     !== undefined) updateData.status      = status;
    if (color      !== undefined) updateData.color       = color;
    if (dueDate    !== undefined) updateData.dueDate     = dueDate;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updateData,
      { returnDocument: 'after', runValidators: true }
    );
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete a project and its tasks
// @route DELETE /api/projects/:id
// @access Private
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }
    // Cascade-delete all tasks belonging to this project
    await Task.deleteMany({ project: project._id });
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
};
