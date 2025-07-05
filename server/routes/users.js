const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile (extended info)
// @access  Private
router.get('/profile', authenticateToken, async (req, res, next) => {
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

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authenticateToken, async (req, res, next) => {
    try {
        await req.user.update({ is_active: false });
        
        res.json({
            success: true,
            message: 'Tài khoản đã được vô hiệu hóa thành công'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
