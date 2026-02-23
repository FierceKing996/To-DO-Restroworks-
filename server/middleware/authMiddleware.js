const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const JWT_SECRET = 'agency-os-super-secret-key-2026-secure';

exports.protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Put the verified user ID on the request object
        req.user = { userId: decoded.id }; 
        next();
    } catch (err) {
        return next(new AppError('Invalid or expired token', 401));
    }
};