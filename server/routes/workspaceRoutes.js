const express = require('express');
const router = express.Router();
const workspaceController = require('../controller/workspaceController');
const { protect } = require('../middleware/authMiddleware'); 

router.use(protect); 

router.route('/')
    .get(workspaceController.getWorkspaces)
    .post(workspaceController.createWorkspace);

router.route('/:clientId')
    .delete(workspaceController.deleteWorkspace);

module.exports = router;