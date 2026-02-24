const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const { protect } = require('../middleware/authMiddleware'); // Or your passport one
const { restrictTo } = require('../middleware/restrictTo');

// Protect all admin routes
router.use(protect);
router.use(restrictTo('superadmin'));

router.get('/stats', adminController.getDashboardStats);

module.exports = router;