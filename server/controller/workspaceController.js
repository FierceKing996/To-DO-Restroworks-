const Workspace = require('../model/Workspace');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// 1. Get All Workspaces
exports.getWorkspaces = catchAsync(async (req, res, next) => {
    const workspaces = await Workspace.find({ userId: req.user.userId });

    res.status(200).json({
        status: 'success',
        results: workspaces.length,
        data: {
            workspaces
        }
    });
});

// 2. Create Workspace
exports.createWorkspace = catchAsync(async (req, res, next) => {
    const newWorkspace = await Workspace.create({
        ...req.body,
        userId: req.user.userId 
    });

    res.status(201).json({
        status: 'success',
        data: {
            workspace: newWorkspace
        }
    });
});

// 3. Delete Workspace (Soft Delete)
exports.deleteWorkspace = catchAsync(async (req, res, next) => {
    const { clientId } = req.params;
    const userId = req.user.userId;

    const ws = await Workspace.findOneAndUpdate(
        { clientId, userId },
        { isDeleted: true, updatedAt: new Date() },
        { new: true }
    );

    if (!ws) return next(new AppError('No workspace found with that ID', 404));

    res.status(200).json({ status: 'success', message: 'Workspace deleted' });
});