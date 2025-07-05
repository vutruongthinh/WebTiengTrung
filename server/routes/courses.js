const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Course, Video, UserCourse, User } = require('../models');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses with purchase options
// @access  Public (with optional auth for personalized data)
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const { level, search, featured } = req.query;
        
        // Build query conditions
        const whereConditions = { is_active: true };
        
        if (level) {
            whereConditions.level = level;
        }
        
        if (search) {
            whereConditions[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ];
        }
        
        if (featured === 'true') {
            whereConditions.is_featured = true;
        }

        // Get courses with basic info
        const courses = await Course.findAll({
            where: whereConditions,
            include: [
                {
                    model: Video,
                    as: 'videos',
                    attributes: ['id', 'title', 'duration_seconds', 'is_preview'],
                    where: { is_active: true },
                    required: false
                }
            ],
            order: [['order_index', 'ASC'], ['created_at', 'DESC']]
        });

        // Process courses for response
        const processedCourses = await Promise.all(courses.map(async (course) => {
            const courseData = course.toPublicObject();
            
            // Add purchase options
            courseData.purchase_options = course.getPurchaseOptions();
            
            // Check user access if authenticated
            if (req.user) {
                // Check if user has VIP access
                const hasVipAccess = req.user.hasMembershipAccess('vip');
                
                // Check if user purchased this course individually
                const userCourse = await UserCourse.findOne({
                    where: {
                        user_id: req.user.id,
                        course_id: course.id,
                        is_active: true
                    }
                });
                
                courseData.user_access = {
                    has_access: hasVipAccess || (userCourse && userCourse.hasAccess()),
                    access_type: hasVipAccess ? 'vip_membership' : (userCourse ? userCourse.access_type : null),
                    progress: userCourse ? userCourse.progress_percentage : 0
                };
            }
            
            // Add preview video count
            courseData.preview_videos_count = course.videos.filter(v => v.is_preview).length;
            courseData.total_videos_count = course.videos.length;
            
            return courseData;
        }));

        res.json({
            success: true,
            data: {
                courses: processedCourses,
                total: processedCourses.length
            }
        });

    } catch (error) {
        next(error);
    }
});

// @route   GET /api/courses/:id
// @desc    Get single course details
// @access  Public (with optional auth)
router.get('/:id', optionalAuth, async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id, {
            include: [
                {
                    model: Video,
                    as: 'videos',
                    where: { is_active: true },
                    required: false,
                    order: [['order_index', 'ASC']]
                }
            ]
        });

        if (!course || !course.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khóa học'
            });
        }

        const courseData = course.toPublicObject();
        courseData.purchase_options = course.getPurchaseOptions();

        // Check user access and filter videos
        let accessibleVideos = [];
        if (req.user) {
            const hasVipAccess = req.user.hasMembershipAccess('vip');
            const userCourse = await UserCourse.findOne({
                where: {
                    user_id: req.user.id,
                    course_id: course.id,
                    is_active: true
                }
            });

            const hasAccess = hasVipAccess || (userCourse && userCourse.hasAccess());
            
            courseData.user_access = {
                has_access: hasAccess,
                access_type: hasVipAccess ? 'vip_membership' : (userCourse ? userCourse.access_type : null),
                progress: userCourse ? userCourse.progress_percentage : 0
            };

            // Filter videos based on access
            accessibleVideos = course.videos.filter(video => {
                return video.is_preview || hasAccess;
            });
        } else {
            // Only preview videos for non-authenticated users
            accessibleVideos = course.videos.filter(video => video.is_preview);
        }

        courseData.videos = accessibleVideos;

        res.json({
            success: true,
            data: { course: courseData }
        });

    } catch (error) {
        next(error);
    }
});

// @route   POST /api/courses/:id/purchase
// @desc    Initiate course purchase
// @access  Private
router.post('/:id/purchase', authenticateToken, [
    body('purchase_type')
        .isIn(['individual', 'vip_membership'])
        .withMessage('Loại mua hàng không hợp lệ')
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

        const { purchase_type } = req.body;
        const courseId = req.params.id;

        const course = await Course.findByPk(courseId);
        if (!course || !course.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khóa học'
            });
        }

        // Check if user already has access
        const hasVipAccess = req.user.hasMembershipAccess('vip');
        if (hasVipAccess) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã có quyền truy cập với gói VIP'
            });
        }

        const existingUserCourse = await UserCourse.findOne({
            where: {
                user_id: req.user.id,
                course_id: courseId,
                is_active: true
            }
        });

        if (existingUserCourse && existingUserCourse.hasAccess()) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã sở hữu khóa học này'
            });
        }

        // Determine price based on purchase type
        let amount, paymentType, membershipTier = null;
        
        if (purchase_type === 'individual') {
            if (!course.can_purchase_individually || course.price_vnd <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Khóa học này không thể mua riêng lẻ'
                });
            }
            amount = course.price_vnd;
            paymentType = 'course';
        } else if (purchase_type === 'vip_membership') {
            if (!course.vip_price_vnd) {
                return res.status(400).json({
                    success: false,
                    message: 'Gói VIP chưa được thiết lập cho khóa học này'
                });
            }
            amount = course.vip_price_vnd;
            paymentType = 'membership';
            membershipTier = 'vip';
        }

        // Create payment record (VietQR integration will be handled here)
        const Payment = require('../models/Payment');
        const payment = await Payment.create({
            user_id: req.user.id,
            course_id: purchase_type === 'individual' ? courseId : null,
            payment_type: paymentType,
            membership_tier: membershipTier,
            amount_vnd: amount,
            status: 'pending',
            expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes expiry
        });

        res.json({
            success: true,
            message: 'Đã tạo đơn hàng thành công',
            data: {
                payment_id: payment.id,
                amount: payment.getFormattedAmount(),
                expires_at: payment.expires_at,
                qr_code_url: `/api/payments/${payment.id}/qr`, // Will implement QR generation
                purchase_type,
                course_title: course.title
            }
        });

    } catch (error) {
        next(error);
    }
});

// @route   GET /api/courses/my-courses
// @desc    Get user's purchased courses
// @access  Private
router.get('/user/my-courses', authenticateToken, async (req, res, next) => {
    try {
        const userCourses = await UserCourse.findAll({
            where: {
                user_id: req.user.id,
                is_active: true
            },
            include: [
                {
                    model: Course,
                    as: 'course',
                    where: { is_active: true },
                    include: [
                        {
                            model: Video,
                            as: 'videos',
                            where: { is_active: true },
                            required: false
                        }
                    ]
                }
            ],
            order: [['purchased_at', 'DESC']]
        });

        const coursesData = userCourses.map(userCourse => {
            const courseData = userCourse.course.toPublicObject();
            courseData.enrollment = {
                access_type: userCourse.access_type,
                progress: userCourse.progress_percentage,
                purchased_at: userCourse.purchased_at,
                completion_date: userCourse.completion_date,
                has_access: userCourse.hasAccess()
            };
            return courseData;
        });

        res.json({
            success: true,
            data: {
                courses: coursesData,
                vip_access: req.user.hasMembershipAccess('vip')
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
