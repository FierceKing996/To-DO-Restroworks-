const jwt = require('jsonwebtoken');
const User = require('../model/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const passport = require('passport'); 

const JWT_SECRET = 'agency-os-super-secret-key-2026-secure'; 

const signToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '90d' });
};

exports.signup = catchAsync(async (req, res, next) => {
    // Keep your signup exactly as it is!
    const newUser = await User.create({
        username: req.body.username,
        password: req.body.password
    });
    const token = signToken(newUser._id);
    res.status(201).json({ status: 'success', token, data: { user: newUser } });
});

exports.login = (req, res, next) => {
    // We tell Passport to use the 'local' strategy we built, without sessions
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) return next(err);
        
        // If login failed, Passport provides the error message we defined
        if (!user) return next(new AppError(info.message, 401));

        // If successful, generate the JWT token and send it to React
        const token = signToken(user._id);
        res.status(200).json({ status: 'success', token, data: { user } });
        
    })(req, res, next);
};