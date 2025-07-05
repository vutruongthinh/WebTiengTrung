const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Course, Video, Payment, User } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// @route   GET /api/admin/courses
// @desc    Get all courses for admin management
// @access  Admin
router.get('/courses', async (req, res, next) => {
    try {
        const courses = await Course.findAll({
            include: [
                {
                    model: Video,
                    as: 'videos',
                    attributes: ['id', 'title', 'duration_seconds', 'is_active']
                }
            ],
            order: [['order_index', 'ASC'], ['created_at', 'DESC']]
        });

        const coursesData = courses.map(course => {
            const data = course.toJSON();
            data.formatted_price = course.getFormattedPrice();
            data.formatted_vip_price = course.getFormattedVipPrice();
            data.video_count = course.videos.length;
            data.active_video_count = course.videos.filter(v => v.is_active).length;
            return data;
        });

        res.json({
            success: true,
            data: { courses: coursesData }
        });

    } catch (error) {
        next(error);
    }
});

// @route   POST /api/admin/courses
// @desc    Create new course
// @access  Admin
router.post('/courses', [
    body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Course title must be 5-200 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('level').isIn(['beginner', 'intermediate', 'advanced', 'specialized', 'exam', 'online']).withMessage('Invalid course level'),
    body('required_tier').isIn(['free', 'vip']).withMessage('Required tier must be free or vip'),
    body('price_vnd').isInt({ min: 0 }).withMessage('Price must be a positive number'),
    body('can_purchase_individually').isBoolean().withMessage('Purchase option must be boolean')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input data',
                errors: errors.array()
            });
        }

        const courseData = req.body;
        
        // Validate VIP pricing
        if (courseData.vip_price_vnd && courseData.vip_price_vnd < 0) {
            return res.status(400).json({
                success: false,
                message: 'VIP price must be positive'
            });
        }

        const course = await Course.create(courseData);

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: { 
                course: {
                    ...course.toJSON(),
                    formatted_price: course.getFormattedPrice(),
                    formatted_vip_price: course.getFormattedVipPrice()
                }
            }
        });

    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/admin/courses/:id
// @desc    Update course
// @access  Admin
router.put('/courses/:id', [
    body('title').optional().trim().isLength({ min: 5, max: 200 }),
    body('level').optional().isIn(['beginner', 'intermediate', 'advanced', 'specialized', 'exam', 'online']),
    body('required_tier').optional().isIn(['free', 'vip']),
    body('price_vnd').optional().isInt({ min: 0 }),
    body('vip_price_vnd').optional().isInt({ min: 0 }),
    body('can_purchase_individually').optional().isBoolean()
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input data',
                errors: errors.array()
            });
        }

        const course = await Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        await course.update(req.body);

        res.json({
            success: true,
            message: 'Course updated successfully',
            data: { 
                course: {
                    ...course.toJSON(),
                    formatted_price: course.getFormattedPrice(),
                    formatted_vip_price: course.getFormattedVipPrice()
                }
            }
        });

    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/admin/pricing/vip
// @desc    Update global VIP pricing
// @access  Admin
router.put('/pricing/vip', [
    body('vip_price_vnd').isInt({ min: 0 }).withMessage('VIP price must be a positive number'),
    body('apply_to_all_courses').optional().isBoolean()
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input data',
                errors: errors.array()
            });
        }

        const { vip_price_vnd, apply_to_all_courses } = req.body;

        if (apply_to_all_courses) {
            // Update all courses that can have VIP access
            await Course.update(
                { vip_price_vnd },
                { 
                    where: { 
                        required_tier: 'vip',
                        is_active: true 
                    } 
                }
            );

            res.json({
                success: true,
                message: 'VIP pricing updated for all courses',
                data: {
                    vip_price_vnd,
                    formatted_price: new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                    }).format(vip_price_vnd)
                }
            });
        } else {
            res.json({
                success: true,
                message: 'VIP price validated',
                data: {
                    vip_price_vnd,
                    formatted_price: new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                    }).format(vip_price_vnd)
                }
            });
        }

    } catch (error) {
        next(error);
    }
});

// @route   GET /api/admin/analytics
// @desc    Get admin analytics
// @access  Admin
router.get('/analytics', async (req, res, next) => {
    try {
        // User statistics
        const totalUsers = await User.count();
        const vipUsers = await User.count({ where: { membership_tier: 'vip' } });
        const freeUsers = await User.count({ where: { membership_tier: 'free' } });

        // Course statistics
        const totalCourses = await Course.count({ where: { is_active: true } });
        const freeCourses = await Course.count({ where: { required_tier: 'free', is_active: true } });
        const vipCourses = await Course.count({ where: { required_tier: 'vip', is_active: true } });

        // Payment statistics
        const totalRevenue = await Payment.sum('amount_vnd', { where: { status: 'completed' } }) || 0;
        const monthlyRevenue = await Payment.sum('amount_vnd', {
            where: {
                status: 'completed',
                payment_date: {
                    [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        }) || 0;

        // Recent payments
        const recentPayments = await Payment.findAll({
            where: { status: 'completed' },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['full_name', 'email']
                },
                {
                    model: Course,
                    as: 'course',
                    attributes: ['title']
                }
            ],
            order: [['payment_date', 'DESC']],
            limit: 10
        });

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    vip: vipUsers,
                    free: freeUsers
                },
                courses: {
                    total: totalCourses,
                    free: freeCourses,
                    vip: vipCourses
                },
                revenue: {
                    total: new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                    }).format(totalRevenue),
                    monthly: new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                    }).format(monthlyRevenue),
                    total_raw: totalRevenue,
                    monthly_raw: monthlyRevenue
                },
                recent_payments: recentPayments.map(payment => ({
                    ...payment.toJSON(),
                    formatted_amount: payment.getFormattedAmount()
                }))
            }
        });

    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/admin/courses/:id
// @desc    Soft delete course
// @access  Admin
router.delete('/courses/:id', async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        await course.update({ is_active: false });

        res.json({
            success: true,
            message: 'Course deactivated successfully'
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
