const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc  Get dashboard summary statistics for the authenticated user
// @route GET /api/dashboard
// @access Private
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      reviewTasks,
      doneTasks,
      overdueTasks,
      recentProjects,
      upcomingTasks,
    ] = await Promise.all([
      Project.countDocuments({ owner: userId }),
      Project.countDocuments({ owner: userId, status: 'active' }),
      Project.countDocuments({ owner: userId, status: 'completed' }),
      Task.countDocuments({ owner: userId }),
      Task.countDocuments({ owner: userId, status: 'todo' }),
      Task.countDocuments({ owner: userId, status: 'in-progress' }),
      Task.countDocuments({ owner: userId, status: 'review' }),
      Task.countDocuments({ owner: userId, status: 'done' }),
      Task.countDocuments({
        owner: userId,
        status: { $ne: 'done' },
        dueDate: { $lt: new Date() },
      }),
      Project.find({ owner: userId }).sort({ createdAt: -1 }).limit(5),
      Task.find({
        owner: userId,
        status: { $ne: 'done' },
        dueDate: { $gte: new Date() },
      })
        .sort({ dueDate: 1 })
        .limit(5)
        .populate('project', 'title color'),
    ]);

    res.json({
      success: true,
      data: {
        projects: { total: totalProjects, active: activeProjects, completed: completedProjects },
        tasks: {
          total: totalTasks,
          todo: todoTasks,
          inProgress: inProgressTasks,
          review: reviewTasks,
          done: doneTasks,
          overdue: overdueTasks,
        },
        recentProjects,
        upcomingTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
