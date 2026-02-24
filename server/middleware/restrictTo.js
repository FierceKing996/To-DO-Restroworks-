const AppError = require('../utils/AppError');

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // req.user is set by your 'protect' middleware / Passport
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};