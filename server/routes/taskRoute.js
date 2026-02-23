const express = require('express');
const router = express.Router();
const taskController = require('../controller/taskcontroller');
const { protect } = require('../middleware/authMiddleware'); 

// Temporary 
/*const mockAuth = (req, res, next) => {
    req.user = { userId: '65c1234567890abcdef12345' }; // Fake User ID for testing
    next();
};*/
router.post('/batch', protect, taskController.syncBatch);

// Routes
router.get('/', protect, taskController.getTasks);
router.post('/', protect, taskController.createTask);
router.put('/:clientId', protect, taskController.updateTask);
router.delete('/:clientId', protect, taskController.deleteTask);

module.exports = router;