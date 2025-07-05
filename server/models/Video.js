const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Video = sequelize.define('Video', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    course_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'courses',
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [3, 200]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    video_url: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Azure Blob Storage URL'
    },
    thumbnail_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    duration_seconds: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    order_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    is_preview: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Can be watched without purchasing course'
    },
    transcript: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Video transcript in Vietnamese'
    },
    resources: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Additional resources, PDFs, etc.'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'videos',
    indexes: [
        {
            fields: ['course_id']
        },
        {
            fields: ['order_index']
        },
        {
            fields: ['is_preview']
        }
    ]
});

// Instance methods
Video.prototype.getFormattedDuration = function() {
    const minutes = Math.floor(this.duration_seconds / 60);
    const seconds = this.duration_seconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

Video.prototype.canUserAccess = function(user, course) {
    // Preview videos are always accessible
    if (this.is_preview) return true;
    
    // User must have access to the course
    if (!user || !course) return false;
    return course.canUserAccess(user);
};

module.exports = Video;
