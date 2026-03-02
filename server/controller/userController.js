const sqsService = require('../service/sqsService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.requestAdminAccess = catchAsync(async (req, res, next) => {
    // req.user should be populated by your standard JWT protect middleware
    if (!req.user) {
        return next(new AppError('You must be logged in to request access', 401));
    }

    // Push the heavy lifting to SQS
    await sqsService.sendAdminRequest({
        userId: req.user._id,
        username: req.user.username,
        email: req.user.email
    });

    // Respond immediately to the frontend UI
    res.status(200).json({ 
        status: 'success', 
        message: 'Your request for Super Admin access has been queued!' 
    });
});