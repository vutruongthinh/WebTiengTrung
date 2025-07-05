const express = require('express');
const { body, validationResult } = require('express-validator');
const { Payment, User, Course } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/payments/:id/qr
// @desc    Get QR code for payment
// @access  Private
router.get('/:id/qr', authenticateToken, async (req, res, next) => {
    try {
        const payment = await Payment.findByPk(req.params.id);
        
        if (!payment || payment.user_id !== req.user.id) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn thanh toán'
            });
        }

        if (payment.isExpired()) {
            return res.status(400).json({
                success: false,
                message: 'Đơn thanh toán đã hết hạn'
            });
        }

        // TODO: Implement VietQR generation
        // For now, return placeholder QR data
        res.json({
            success: true,
            data: {
                qr_code_url: `data:image/png;base64,placeholder_qr_code`,
                payment_info: {
                    amount: payment.getFormattedAmount(),
                    expires_at: payment.expires_at,
                    bank_info: {
                        bank_name: 'Vietcombank',
                        account_number: '1234567890',
                        account_name: 'MS HOA CHINESE LEARNING',
                        transfer_content: `THANHTOAN ${payment.id}`
                    }
                }
            }
        });

    } catch (error) {
        next(error);
    }
});

// @route   GET /api/payments/my-payments
// @desc    Get user's payment history
// @access  Private
router.get('/my-payments', authenticateToken, async (req, res, next) => {
    try {
        const payments = await Payment.findAll({
            where: { user_id: req.user.id },
            include: [
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'title', 'thumbnail_url']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        const paymentsData = payments.map(payment => ({
            ...payment.toJSON(),
            formatted_amount: payment.getFormattedAmount(),
            can_refund: payment.canRefund()
        }));

        res.json({
            success: true,
            data: { payments: paymentsData }
        });

    } catch (error) {
        next(error);
    }
});

// @route   POST /api/payments/webhook
// @desc    Handle payment webhook from bank
// @access  Public (with signature verification)
router.post('/webhook', async (req, res, next) => {
    try {
        // TODO: Implement VietQR webhook verification
        // Verify webhook signature
        // Update payment status
        // Grant course access
        
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
