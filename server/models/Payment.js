const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    course_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'courses',
            key: 'id'
        },
        comment: 'Null for membership purchases'
    },
    payment_type: {
        type: DataTypes.ENUM('course', 'membership'),
        allowNull: false
    },
    membership_tier: {
        type: DataTypes.ENUM('vip'),
        allowNull: true,
        comment: 'Only VIP for membership payments'
    },
    amount_vnd: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
    },
    payment_method: {
        type: DataTypes.ENUM('vietqr', 'bank_transfer', 'cash'),
        defaultValue: 'vietqr'
    },
    qr_code_data: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'VietQR code data'
    },
    transaction_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Bank transaction ID'
    },
    bank_reference: {
        type: DataTypes.STRING,
        allowNull: true
    },
    payment_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'QR code expiration'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'payments',
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['transaction_id']
        }
    ]
});

// Instance methods
Payment.prototype.getFormattedAmount = function() {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.amount_vnd);
};

Payment.prototype.isExpired = function() {
    if (!this.expires_at) return false;
    return new Date() > this.expires_at;
};

Payment.prototype.canRefund = function() {
    return this.status === 'completed' && 
           new Date() - this.payment_date < (7 * 24 * 60 * 60 * 1000); // 7 days
};

module.exports = Payment;
