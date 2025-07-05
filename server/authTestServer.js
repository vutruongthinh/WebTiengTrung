require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory user storage for testing
let users = [];
let userIdCounter = 1;

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
        process.env.JWT_SECRET || 'fallback-secret-key',
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
                message: 'Không có token xác thực'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        const user = users.find(u => u.id === decoded.userId);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Authentication server is working!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        users_count: users.length
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
            email_verified: false,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        };

        users.push(user);

        // Generate token
        const token = generateToken(user.id);

        // Remove password from response
        const { password: _, ...userResponse } = user;

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký'
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
            message: 'Đăng nhập thành công',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng nhập'
        });
    }
});

// Get current user profile
app.get('/api/auth/profile', authMiddleware, (req, res) => {
    const { password: _, ...userResponse } = req.user;
    
    res.json({
        success: true,
        data: {
            user: userResponse
        }
    });
});

// Test protected route
app.get('/api/test/protected', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Bạn đã truy cập thành công route được bảo vệ!',
        user: {
            id: req.user.id,
            email: req.user.email,
            full_name: req.user.full_name,
            membership_tier: req.user.membership_tier
        }
    });
});

// Create test user
app.post('/api/test/create-user', async (req, res) => {
    try {
        // Create default test user
        const hashedPassword = await hashPassword('password123');
        const testUser = {
            id: userIdCounter++,
            email: 'test@example.com',
            password: hashedPassword,
            full_name: 'Người dùng thử nghiệm',
            membership_tier: 'free',
            email_verified: true,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        };

        // Check if already exists
        const existing = users.find(u => u.email === testUser.email);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Test user already exists'
            });
        }

        users.push(testUser);

        const { password: _, ...userResponse } = testUser;

        res.json({
            success: true,
            message: 'Test user created successfully',
            data: { user: userResponse }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating test user'
        });
    }
});

// List all users (debug only)
app.get('/api/test/users', (req, res) => {
    const safeUsers = users.map(u => {
        const { password: _, ...safeUser } = u;
        return safeUser;
    });

    res.json({
        success: true,
        data: {
            users: safeUsers,
            count: users.length
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Authentication Test Server running on port ${PORT}`);
    console.log(`🌐 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Test Endpoints:`);
    console.log(`   • POST http://localhost:${PORT}/api/auth/register`);
    console.log(`   • POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   • GET  http://localhost:${PORT}/api/auth/profile`);
    console.log(`   • POST http://localhost:${PORT}/api/test/create-user`);
    console.log(`   • GET  http://localhost:${PORT}/api/test/users`);
    console.log(`   • GET  http://localhost:${PORT}/api/test/protected`);
});

module.exports = app;
