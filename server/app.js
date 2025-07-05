require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory user storage for MVP
let users = [];
let userIdCounter = 1;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút'
    }
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (serve frontend)
app.use(express.static(path.join(__dirname, '../')));

// Helper functions
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'mvp-secret-key-change-in-production',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Auth middleware
const authMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để tiếp tục'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mvp-secret-key-change-in-production');
        const user = users.find(u => u.id === decoded.userId);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Phiên đăng nhập không hợp lệ'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Phiên đăng nhập đã hết hạn'
        });
    }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Ms. Hoa Chinese Learning Platform API',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0-mvp'
    });
});

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, full_name } = req.body;

        // Validation
        if (!email || !password || !full_name) {
            return res.status(400).json({
                success: false,
                message: 'Email, mật khẩu và họ tên là bắt buộc'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }

        // Check if user exists
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email này đã được đăng ký'
            });
        }

        // Create user
        const hashedPassword = await hashPassword(password);
        const user = {
            id: userIdCounter++,
            email,
            password: hashedPassword,
            full_name,
            membership_tier: 'free',
            email_verified: true, // Auto-verify for MVP
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        };

        users.push(user);

        // Generate token
        const token = generateToken(user.id);

        // Update last login
        user.last_login = new Date();

        // Remove password from response
        const { password: _, ...userResponse } = user;

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công! Chào mừng bạn đến với Ms. Hoa Chinese Learning Platform',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký. Vui lòng thử lại sau.'
        });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email và mật khẩu là bắt buộc'
            });
        }

        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Check password
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Update last login
        user.last_login = new Date();

        // Generate token
        const token = generateToken(user.id);

        // Remove password from response
        const { password: _, ...userResponse } = user;

        res.json({
            success: true,
            message: 'Đăng nhập thành công! Chào mừng bạn trở lại.',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng nhập. Vui lòng thử lại sau.'
        });
    }
});

// Get current user profile
app.get('/api/auth/profile', authMiddleware, (req, res) => {
    const { password: _, ...userResponse } = req.user;
    
    res.json({
        success: true,
        message: 'Thông tin tài khoản',
        data: {
            user: userResponse
        }
    });
});

// Logout (client-side token removal, server acknowledges)
app.post('/api/auth/logout', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Đăng xuất thành công. Hẹn gặp lại bạn!'
    });
});

// Demo protected route
app.get('/api/courses', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Danh sách khóa học',
        data: {
            courses: [
                {
                    id: 1,
                    title: 'Tiếng Trung Cơ Bản',
                    title_chinese: '基础中文',
                    description: 'Khóa học tiếng Trung cơ bản cho người mới bắt đầu',
                    level: 'beginner',
                    hsk_level: 'HSK 1-2',
                    required_tier: 'free',
                    price_vnd: 0,
                    is_featured: true
                },
                {
                    id: 2,
                    title: 'Tiếng Trung Nâng Cao',
                    title_chinese: '高级中文',
                    description: 'Khóa học tiếng Trung nâng cao cho học viên có kinh nghiệm',
                    level: 'advanced',
                    hsk_level: 'HSK 5-6',
                    required_tier: 'vip',
                    price_vnd: 2000000,
                    is_featured: true
                }
            ]
        }
    });
});

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        success: false,
        message: 'Đã xảy ra lỗi không mong muốn',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Initialize with demo data
const initializeDemoData = async () => {
    if (users.length === 0) {
        try {
            // Create demo user
            const hashedPassword = await hashPassword('password123');
            const demoUser = {
                id: userIdCounter++,
                email: 'demo@mshoa.com',
                password: hashedPassword,
                full_name: 'Học viên Demo',
                membership_tier: 'free',
                email_verified: true,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            };

            users.push(demoUser);
        } catch (error) {
            // Ignore errors during demo data creation
        }
    }
};

// Start server
const startServer = async () => {
    await initializeDemoData();
    
    app.listen(PORT, () => {
        console.log(`🚀 Ms. Hoa Chinese Learning Platform - MVP Server`);
        console.log(`🌐 Running on: http://localhost:${PORT}`);
        console.log(`📚 API Health: http://localhost:${PORT}/api/health`);
        console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`👤 Demo Account: demo@mshoa.com / password123`);
        console.log(`✨ Ready for demo!`);
    });
};

startServer();

module.exports = app;
