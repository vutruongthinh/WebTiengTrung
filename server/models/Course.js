const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Course = sequelize.define('Course', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [5, 200]
        }
    },
    title_chinese: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Course title in Chinese characters'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    short_description: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    level: {
        type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'specialized', 'exam', 'online'),
        allowNull: false
    },
    hsk_level: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'HSK 1-2, HSK 3-4, etc.'
    },
    required_tier: {
        type: DataTypes.ENUM('free', 'vip'),
        defaultValue: 'free',
        comment: 'Free courses or VIP-only courses'
    },
    price_vnd: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Individual course price in Vietnamese Dong (0 for free courses)'
    },
    vip_price_vnd: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'VIP membership price in Vietnamese Dong (set by admin)'
    },
    can_purchase_individually: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this course can be purchased separately'
    },
    duration_weeks: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Course duration in weeks'
    },
    sessions_per_week: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Number of sessions per week'
    },
    max_students: {
        type: DataTypes.INTEGER,
        defaultValue: 4,
        comment: 'Maximum students per class'
    },
    thumbnail_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    order_index: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'For ordering courses in listings'
    },
    total_videos: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    total_duration_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    learning_outcomes: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Array of learning outcomes in Vietnamese'
    },
    prerequisites: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    certificate_available: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'courses',
    indexes: [
        {
            fields: ['level']
        },
        {
            fields: ['required_tier']
        },
        {
            fields: ['is_active']
        },
        {
            fields: ['order_index']
        }
    ]
});

// Instance methods
Course.prototype.getFormattedPrice = function() {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.price_vnd);
};

Course.prototype.getFormattedVipPrice = function() {
    if (!this.vip_price_vnd) return null;
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.vip_price_vnd);
};

Course.prototype.getPurchaseOptions = function() {
    const options = [];
    
    // Individual course purchase
    if (this.can_purchase_individually && this.price_vnd > 0) {
        options.push({
            type: 'individual',
            price: this.price_vnd,
            formatted_price: this.getFormattedPrice(),
            description: `Mua khóa học ${this.title}`
        });
    }
    
    // VIP membership option
    if (this.vip_price_vnd && this.required_tier === 'vip') {
        options.push({
            type: 'vip_membership',
            price: this.vip_price_vnd,
            formatted_price: this.getFormattedVipPrice(),
            description: 'Nâng cấp VIP - Truy cập toàn bộ khóa học'
        });
    }
    
    return options;
};

Course.prototype.canUserAccess = function(user) {
    if (!user) return this.required_tier === 'free';
    
    // VIP users have access to all content
    if (user.membership_tier === 'vip' && user.hasMembershipAccess('vip')) {
        return true;
    }
    
    // Check if user has purchased this specific course
    // This will be checked in the controller with UserCourse model
    
    // Free courses are accessible to everyone
    return this.required_tier === 'free';
};

Course.prototype.toPublicObject = function() {
    const course = this.toJSON();
    // Remove sensitive admin data
    return course;
};

module.exports = Course;
