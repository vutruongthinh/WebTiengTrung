const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Simple test endpoint to check if server is working
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Authentication server is working!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Test user creation (for development only)
router.post('/test-user', async (req, res) => {
    try {
        // Create a test user
        const testUser = await User.create({
            email: 'test@example.com',
            password: 'password123',
            full_name: 'Người dùng thử nghiệm',
            membership_tier: 'free',
            email_verified: true
        });

        res.status(201).json({
            success: true,
            message: 'Test user created successfully',
            data: testUser.toSafeObject()
        });

    } catch (error) {
        // Handle duplicate user error
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'Test user already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating test user',
            error: error.message
        });
    }
});

// Test login
router.post('/test-login', async (req, res) => {
    try {
        const user = await User.findOne({
            where: { email: 'test@example.com' }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Test user not found. Create test user first.'
            });
        }

        const isValid = await user.comparePassword('password123');
        
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        res.json({
            success: true,
            message: 'Test login successful',
            data: user.toSafeObject()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error during test login',
            error: error.message
        });
    }
});

module.exports = router;
