const Task = require('../model/tasks');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');
exports.getTasks = catchAsync(async (req, res, next) => {
    // Return all tasks (we filter by project on frontend for now)
    const tasks = await Task.find({ isDeleted: false });
    res.status(200).json({ status: 'success', results: tasks.length, data: { tasks } });
});

exports.createTask = catchAsync(async (req, res, next) => {
    // 1. Log the body to verify data is coming in
    console.log("Creating Task Payload:", req.body);

    const { content, clientId, priority, sectionId, projectId, workspaceId } = req.body;

    // 2. Validate essential fields
    if (!content || !workspaceId || !projectId) {
        return next(new AppError('Missing required fields (content, workspaceId, projectId)', 400));
    }

    const newTask = await Task.create({
        content,
        clientId, 
        priority: priority || 'Medium',
        sectionId: sectionId || 'todo',
        projectId, 
        workspaceId,
        userId: req.user ? req.user._id : null,
        isDeleted: false // Explicitly set false
    });

    res.status(201).json({ status: 'success', data: { task: newTask } });
});

exports.updateTask = catchAsync(async (req, res, next) => {
    const { clientId } = req.params;
    
    // ⚡ FIX: Search by clientId string OR _id (if valid)
    // This prevents the "Cast to ObjectId failed" crash
    const query = { 
        $or: [
            { clientId: clientId },
            ...(mongoose.isValidObjectId(clientId) ? [{ _id: clientId }] : [])
        ] 
    };

    const task = await Task.findOne(query);

    if (!task) {
        return next(new AppError('No task found with that ID', 404));
    }

    // Update fields
    Object.assign(task, req.body);
    await task.save();

    res.status(200).json({ status: 'success', data: { task } });
});

exports.deleteTask = catchAsync(async (req, res, next) => {
    const { clientId } = req.params;
    
    // ⚡ FIX: Gracefully handle if a temp ID somehow reaches here
    if (clientId.startsWith('temp-')) {
        return res.status(200).json({ status: 'success', message: 'Ignored temp ID' });
    }

    // Try finding by clientId (string) OR _id (ObjectId)
    // We use findOneAndUpdate to avoid casting errors if clientId is just a random string
    const task = await Task.findOneAndUpdate(
        { 
            $or: [
                { clientId: clientId }, 
                // Only search by _id if it looks like a valid ObjectId (24 hex chars)
                ...(mongoose.isValidObjectId(clientId) ? [{ _id: clientId }] : [])
            ] 
        },
        { isDeleted: true },
        { new: true }
    );

    if (!task) {
        return next(new AppError('No task found to delete', 404));
    }

    res.status(204).json({ status: 'success', data: null });
});

exports.moveTask = catchAsync(async (req, res, next) => {
    const { taskId } = req.params;
    const { sectionId, order, completed } = req.body;

    const task = await Task.findOneAndUpdate(
        { $or: [{ clientId: taskId }, { _id: taskId }] },
        { sectionId, order, completed },
        { new: true }
    );

    if (!task) return next(new AppError('Task not found', 404));

    res.status(200).json({ status: 'success', data: { task } });
});

// Batch Sync (For SyncManager)
exports.syncBatch = catchAsync(async (req, res, next) => {
    const { tasks } = req.body;
    if (!tasks || tasks.length === 0) return res.status(200).json({ status: 'success' });

    const operations = tasks.map(task => ({
        updateOne: {
            filter: { clientId: task.clientId },
            update: { ...task, isDeleted: false }, // Ensure it's not deleted if syncing
            upsert: true // Create if doesn't exist
        }
    }));

    await Task.bulkWrite(operations);
    res.status(200).json({ status: 'success', message: 'Batch synced' });
});