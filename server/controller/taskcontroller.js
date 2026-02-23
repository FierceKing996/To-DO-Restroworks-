const Task = require('../model/tasks');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getTasks = catchAsync(async (req, res, next) => {
    const { workspaceId } = req.query; 
    const userId = req.user.userId;

    const query = { userId, isDeleted: false };
    if (workspaceId) query.workspaceId = workspaceId;

    const tasks = await Task.find(query).sort({ updatedAt: -1 });
    res.status(200).json({ status: 'success', results: tasks.length, data: { tasks } });
});

exports.createTask = catchAsync(async (req, res, next) => {

    const { clientId, content, type, workspaceId, createdAt } = req.body;
    const userId = req.user.userId;

    if (!workspaceId) {
        return next(new AppError('Task must belong to a workspace (workspaceId missing)', 400));
    }

    const newTask = await Task.create({
        userId,
        clientId,
        content,
        type,
        workspaceId,
        createdAt
    });

    res.status(201).json({ status: 'success', data: { task: newTask } });
});

exports.updateTask = catchAsync(async (req, res, next) => {
    const { clientId } = req.params;
    const updates = req.body;
    updates.updatedAt = new Date();

    const task = await Task.findOneAndUpdate(
        { clientId, userId: req.user.userId }, 
        updates, 
        { new: true, runValidators: true }
    );

    if (!task) {
        return next(new AppError('No task found with that ID', 404));
    }

    res.status(200).json({ status: 'success', data: { task } });
});

exports.deleteTask = catchAsync(async (req, res, next) => {
    const task = await Task.findOneAndUpdate(
        { clientId: req.params.clientId, userId: req.user.userId },
        { isDeleted: true, updatedAt: new Date() },
        { new: true }
    );

    if (!task) {
        return next(new AppError('No task found with that ID', 404));
    }

    res.status(200).json({ status: 'success', message: 'Task deleted successfully' });
});

exports.syncBatch = catchAsync(async (req, res, next) => {
    const { tasks } = req.body;
    
    if (!tasks || tasks.length === 0) {
        return res.status(200).json({ status: 'success', message: 'No tasks to sync' });
    }

    const bulkOperations = tasks.map(task => {
        // Grab the ID from the frontend (whether they sent it as clientId or id)
        const frontendId = task.clientId || task.id;

        return {
            updateOne: {
                // ⚡ CHANGE 1: Search the database using 'clientId', not 'id'
                filter: { clientId: frontendId }, 
                
                // ⚡ CHANGE 2: Explicitly map only the schema-approved fields
                update: { $set: { 
                    clientId: frontendId,
                    content: task.content,
                    completed: task.completed,
                    workspaceId: task.workspaceId,
                    user: req.user._id 
                }}, 
                
                upsert: true 
            }
        };
    });

    // Execute all operations at once
    const result = await Task.bulkWrite(bulkOperations);

    res.status(200).json({ 
        status: 'success', 
        message: `Batch sync complete. Modified: ${result.modifiedCount}, Upserted: ${result.upsertedCount}` 
    });
});
