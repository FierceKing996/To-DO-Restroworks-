const Project = require('../model/Project');
const Task = require('../model/tasks');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.createProject = catchAsync(async (req, res, next) => {
    // 1. Create the project
    const newProject = await Project.create(req.body);
    
    res.status(201).json({
        status: 'success',
        data: { project: newProject }
    });
});

exports.getWorkspaceProjects = catchAsync(async (req, res, next) => {
    const { workspaceId } = req.params;
    
    const projects = await Project.find({ workspaceId, isDeleted: false });
    
    res.status(200).json({
        status: 'success',
        results: projects.length,
        data: { projects }
    });
});

exports.updateProjectSections = catchAsync(async (req, res, next) => {
    // Used when moving COLUMNS or Renaming them
    const { projectId } = req.params;
    const { sections } = req.body;

    const project = await Project.findByIdAndUpdate(
        projectId, 
        { sections },
        { new: true, runValidators: true }
    );

    if (!project) return next(new AppError('No project found', 404));

    res.status(200).json({ status: 'success', data: { project } });
});

exports.deleteProject = catchAsync(async (req, res, next) => {
    // Soft delete project
    const project = await Project.findByIdAndUpdate(req.params.id, { isDeleted: true });
    
    if (!project) return next(new AppError('No project found', 404));

    // Optional: Soft delete all tasks in this project too
    await Task.updateMany({ projectId: project._id }, { isDeleted: true });

    res.status(204).json({ status: 'success', data: null });
});