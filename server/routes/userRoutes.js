const express = require('express');
const userController = require('../controller/userController'); 

// I am assuming you have a middleware that checks if the user is logged in
// (often called 'protect' or 'verifyToken')
const authMiddleware = require('../middleware/authMiddleware'); // Update path to wherever your auth check is

const router = express.Router();

// ... your existing routes (like login, register, etc.)

// ⚡ THE NEW SQS ROUTE
// We use the auth middleware so req.user gets populated before hitting the controller
router.post('/request-admin', authMiddleware.protect, userController.requestAdminAccess);

module.exports = router;