const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để tiếp tục'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findByPk(decoded.userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user || !user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa'
            });
        }

        // Attach user to request
        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn, vui lòng đăng nhập lại'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }

        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực, vui lòng thử lại'
        });
    }
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
    try {
        // First check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để tiếp tục'
            });
        }

        // Check if user is admin (you can modify this logic)
        const isAdmin = req.user.email === process.env.ADMIN_EMAIL || 
                        req.user.membership_tier === 'admin';

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập chức năng này'
            });
        }

        next();

    } catch (error) {
        console.error('Admin check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra quyền admin'
        });
    }
};

// Middleware to check membership tier access
const requireVIP = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để tiếp tục'
            });
        }

        if (!req.user.hasMembershipAccess('vip')) {
            return res.status(403).json({
                success: false,
                message: 'Bạn cần nâng cấp lên gói VIP để truy cập nội dung này',
                required_tier: 'vip',
                current_tier: req.user.membership_tier,
                upgrade_options: {
                    vip: 'Truy cập toàn bộ khóa học và nội dung độc quyền'
                }
            });
        }

        next();

    } catch (error) {
        console.error('VIP membership check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra gói thành viên'
        });
    }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.userId, {
                attributes: { exclude: ['password'] }
            });

            if (user && user.is_active) {
                req.user = user;
            }
        }

        next();

    } catch (error) {
        // Ignore authentication errors for optional auth
        next();
    }
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireVIP,
    optionalAuth
};
