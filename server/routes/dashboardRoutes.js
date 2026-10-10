const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/dashboard  – aggregated stats for the authenticated user
router.get('/', protect, getDashboardStats);

module.exports = router;
