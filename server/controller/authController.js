const jwt = require('jsonwebtoken');
const User = require('../model/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Secret should normally be in a .env file!
const JWT_SECRET = 'agency-os-super-secret-key-2026-secure'; 

const signToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '90d' });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        username: req.body.username,
        password: req.body.password
    });

    const token = signToken(newUser._id);

    res.status(201).json({ status: 'success', token, data: { user: newUser } });
});

exports.login = catchAsync(async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) return next(new AppError('Please provide username and password', 400));

    const user = await User.findOne({ username });
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect username or password', 401));
    }

    const token = signToken(user._id);
    res.status(200).json({ status: 'success', token, data: { user } });
});