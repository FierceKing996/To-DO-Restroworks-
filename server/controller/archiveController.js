const Archive = require('../model/archive');
const catchAsync = require('../utils/catchAsync');

// 1. Get all archives for the user
exports.getArchives = catchAsync(async (req, res, next) => {
    const archives = await Archive.find({ userId: req.user.userId });
    res.status(200).json({ status: 'success', data: { archives } });
});

// 2. Save a new encrypted archive
exports.createArchive = catchAsync(async (req, res, next) => {
    const newArchive = await Archive.create({
        userId: req.user.userId,
        vaultId: req.body.id,
        originalWorkspace: req.body.originalWorkspace,
        encryptedData: req.body.encryptedData
    });
    res.status(201).json({ status: 'success', data: { archive: newArchive } });
});

// 3. Delete an archive (when it gets unarchived)
exports.deleteArchive = catchAsync(async (req, res, next) => {
    await Archive.findOneAndDelete({ vaultId: req.params.vaultId, userId: req.user.userId });
    res.status(200).json({ status: 'success' });
});