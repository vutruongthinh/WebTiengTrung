const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { 
    generateVerificationToken, 
    sendVerificationEmail, 
    sendPasswordResetEmail, 
    sendWelcomeEmail 
} = require('../utils/emailService');

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Vui lòng nhập email hợp lệ'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('full_name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Họ tên phải từ 2-100 ký tự')
], async (req, res, next) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { email, password, full_name } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }

        // Create new user
        const verificationToken = generateVerificationToken();
        const user = await User.create({
            email,
            password,
            full_name,
            email_verification_token: verificationToken
        });

        // Send verification email
        try {
            await sendVerificationEmail(user, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Continue with registration even if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.',
            data: {
                user: user.toSafeObject(),
                email_sent: true
            }
        });

    } catch (error) {
        next(error);
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Vui lòng nhập email hợp lệ'),
    body('password')
        .notEmpty()
        .withMessage('Vui lòng nhập mật khẩu')
], async (req, res, next) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user and include password for comparison
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản đã bị vô hiệu hóa'
            });
        }

        // Check if email is verified
        if (!user.email_verified) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng xác nhận email trước khi đăng nhập',
                requires_verification: true
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }

        // Generate token
        const token = generateToken(user.id);

        // Update last login
        await user.update({ last_login: new Date() });

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: user.toSafeObject(),
                token
            }
        });

    } catch (error) {
        next(error);
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user.toSafeObject()
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, [
    body('full_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Họ tên phải từ 2-100 ký tự')
], async (req, res, next) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { full_name } = req.body;
        const updateData = {};

        if (full_name) updateData.full_name = full_name;

        await req.user.update(updateData);

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: {
                user: req.user.toSafeObject()
            }
        });

    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticateToken, [
    body('current_password')
        .notEmpty()
        .withMessage('Vui lòng nhập mật khẩu hiện tại'),
    body('new_password')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
], async (req, res, next) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { current_password, new_password } = req.body;

        // Get user with password
        const user = await User.findByPk(req.user.id);

        // Check current password
        const isMatch = await user.comparePassword(current_password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không chính xác'
            });
        }

        // Update password
        await user.update({ password: new_password });

        res.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });

    } catch (error) {
        next(error);
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Đăng xuất thành công'
    });
});

// @route   POST /api/auth/verify-email
// @desc    Verify user email address
// @access  Public
router.post('/verify-email', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Vui lòng nhập email hợp lệ'),
    body('token')
        .notEmpty()
        .withMessage('Vui lòng nhập mã xác nhận')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { email, token } = req.body;

        // Find user with matching email and verification token
        const user = await User.findOne({
            where: {
                email,
                email_verification_token: token
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Mã xác nhận không hợp lệ hoặc đã hết hạn'
            });
        }

        if (user.email_verified) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được xác nhận trước đó'
            });
        }

        // Verify email
        await user.update({
            email_verified: true,
            email_verification_token: null
        });

        // Send welcome email
        try {
            await sendWelcomeEmail(user);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        // Generate token for automatic login
        const authToken = generateToken(user.id);
        await user.update({ last_login: new Date() });

        res.json({
            success: true,
            message: 'Xác nhận email thành công! Chào mừng bạn đến với Ms. Hoa Chinese Learning!',
            data: {
                user: user.toSafeObject(),
                token: authToken
            }
        });

    } catch (error) {
        next(error);
    }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Public
router.post('/resend-verification', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Vui lòng nhập email hợp lệ')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { email } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài khoản với email này'
            });
        }

        if (user.email_verified) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được xác nhận'
            });
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        await user.update({ email_verification_token: verificationToken });

        // Send verification email
        try {
            await sendVerificationEmail(user, verificationToken);
            res.json({
                success: true,
                message: 'Email xác nhận đã được gửi lại'
            });
        } catch (emailError) {
            res.status(500).json({
                success: false,
                message: 'Không thể gửi email xác nhận, vui lòng thử lại sau'
            });
        }

    } catch (error) {
        next(error);
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Vui lòng nhập email hợp lệ')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { email } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            // Don't reveal if email exists for security
            return res.json({
                success: true,
                message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu'
            });
        }

        if (!user.email_verified) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng xác nhận email trước khi đặt lại mật khẩu'
            });
        }

        // Generate reset token (expires in 1 hour)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await user.update({
            password_reset_token: resetToken,
            password_reset_expires: resetExpires
        });

        // Send reset email
        try {
            await sendPasswordResetEmail(user, resetToken);
            res.json({
                success: true,
                message: 'Email hướng dẫn đặt lại mật khẩu đã được gửi'
            });
        } catch (emailError) {
            res.status(500).json({
                success: false,
                message: 'Không thể gửi email đặt lại mật khẩu, vui lòng thử lại sau'
            });
        }

    } catch (error) {
        next(error);
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Vui lòng nhập email hợp lệ'),
    body('token')
        .notEmpty()
        .withMessage('Vui lòng nhập mã đặt lại mật khẩu'),
    body('new_password')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { email, token, new_password } = req.body;

        // Find user with valid reset token
        const user = await User.findOne({
            where: {
                email,
                password_reset_token: token,
                password_reset_expires: {
                    [Op.gt]: new Date()
                }
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
            });
        }

        // Update password and clear reset token
        await user.update({
            password: new_password,
            password_reset_token: null,
            password_reset_expires: null
        });

        res.json({
            success: true,
            message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.'
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
