require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { initializeDatabase, userOperations, courseOperations } = require('./database');

const app = express();
const PORT = process.env.PORT || 8080;

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

// Basic health check for Azure
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Ms. Hoa Chinese Learning Platform API',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

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
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để tiếp tục'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mvp-secret-key-change-in-production');
        const user = await userOperations.findById(decoded.userId);
        
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
        const existingUser = await userOperations.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email này đã được đăng ký'
            });
        }

        // Create user
        const hashedPassword = await hashPassword(password);
        const user = await userOperations.create({
            email,
            password: hashedPassword,
            full_name,
            membership_tier: 'free'
        });

        // Generate token
        const token = generateToken(user.id);

        // Update last login
        await userOperations.updateLastLogin(user.id);

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công! Chào mừng bạn đến với Ms. Hoa Chinese Learning Platform',
            data: {
                user,
                token
            }
        });

    } catch (error) {
        console.error('Register error:', error);
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
        const user = await userOperations.findByEmail(email);
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
        await userOperations.updateLastLogin(user.id);

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
        console.error('Login error:', error);
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
app.get('/api/courses', authMiddleware, async (req, res) => {
    try {
        const courses = await courseOperations.getAll();
        
        res.json({
            success: true,
            message: 'Danh sách khóa học',
            data: {
                courses
            }
        });
    } catch (error) {
        console.error('Courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tải khóa học. Vui lòng thử lại sau.'
        });
    }
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

// Start server
const startServer = async () => {
    try {
        // Start HTTP server first to satisfy Azure health checks
        const server = app.listen(PORT, () => {
            console.log(`🚀 Ms. Hoa Chinese Learning Platform - MVP Server`);
            console.log(`🌐 Running on: http://localhost:${PORT}`);
            console.log(`📚 API Health: http://localhost:${PORT}/api/health`);
            console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`✨ Server started, initializing database...`);
        });

        // Initialize database after server is running (non-blocking)
        setTimeout(async () => {
            try {
                await initializeDatabase();
                console.log('✅ Database initialized successfully');
                console.log(`🗄️ Database: PostgreSQL ${process.env.DATABASE_URL ? 'Connected' : 'Local'}`);
                console.log(`👤 Demo Account: demo@mshoa.com / password123`);
                console.log(`✨ Ready for demo!`);
            } catch (dbError) {
                console.error('⚠️ Database initialization failed, running in limited mode:', dbError.message);
                // Server continues running even if DB fails
            }
        }, 1000);
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
