const express = require('express');
const projectController = require('../controller/projectController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(authMiddleware.protect);

router.route('/')
    .post(projectController.createProject); // Create new project

router.route('/:projectId')
    .patch(projectController.updateProjectSections) // Update columns
    .delete(projectController.deleteProject);

// Get all projects for a specific workspace
router.route('/workspace/:workspaceId')
    .get(projectController.getWorkspaceProjects);

module.exports = router;