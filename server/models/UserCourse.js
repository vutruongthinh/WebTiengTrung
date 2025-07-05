const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserCourse = sequelize.define('UserCourse', {
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
        allowNull: false,
        references: {
            model: 'courses',
            key: 'id'
        }
    },
    payment_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'payments',
            key: 'id'
        }
    },
    access_type: {
        type: DataTypes.ENUM('purchased', 'vip_membership', 'gift', 'trial'),
        allowNull: false
    },
    purchased_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'For time-limited access'
    },
    progress_percentage: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100
        }
    },
    last_watched_video_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'videos',
            key: 'id'
        }
    },
    completion_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    certificate_issued: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 5
        }
    },
    review: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'user_courses',
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['course_id']
        },
        {
            unique: true,
            fields: ['user_id', 'course_id']
        }
    ]
});

// Instance methods
UserCourse.prototype.hasAccess = function() {
    if (!this.is_active) return false;
    if (this.expires_at && new Date() > this.expires_at) return false;
    return true;
};

UserCourse.prototype.isCompleted = function() {
    return this.progress_percentage >= 100;
};

UserCourse.prototype.updateProgress = function(videosWatched, totalVideos) {
    this.progress_percentage = Math.floor((videosWatched / totalVideos) * 100);
    if (this.progress_percentage >= 100 && !this.completion_date) {
        this.completion_date = new Date();
    }
};

module.exports = UserCourse;
