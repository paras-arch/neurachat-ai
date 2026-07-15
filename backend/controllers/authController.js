const User = require("../models/User");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const generateToken = (userId, email) => {
    return jwt.sign({ id: userId, email }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
};

exports.signup = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return next(new AppError("Name,email, and password are required.", 400));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError("Email already in use", 400));
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user.id, user.email);

    res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email },
    });

});

exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError("Email and password are required.", 400));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
        return next(new AppError("Invalid email or password.", 401));
    }

    const token = generateToken(user._id, user.email);

    res.status(200).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email },
    });
});

exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError("User not found.", 404));
    }

    res.status(200).json({
        success: true,
        user: { id: user._id, name: user.name, email: user.email },
    });
});
