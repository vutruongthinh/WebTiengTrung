const { DataTypes } = require('sequelize');

// For MVP testing, use mock database
if (process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'development') {
    const { MockUserDB } = require('../config/mockDatabase');
    module.exports = MockUserDB;
    return;
}

const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [6, 100]
        }
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 100]
        }
    },
    membership_tier: {
        type: DataTypes.ENUM('free', 'vip'),
        defaultValue: 'free'
    },
    membership_expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    email_verification_token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password_reset_token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password_reset_expires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: true
    },
    profile_image: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'users',
    hooks: {
        beforeSave: async (user) => {
            // Hash password if it's being created or changed
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(12);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.hasMembershipAccess = function(requiredTier) {
    const tierLevels = {
        'free': 0,
        'vip': 1
    };
    
    // Check if membership is still valid
    if (this.membership_expires_at && new Date() > this.membership_expires_at) {
        return false;
    }
    
    return tierLevels[this.membership_tier] >= tierLevels[requiredTier];
};

User.prototype.toSafeObject = function() {
    const user = this.toJSON();
    delete user.password;
    delete user.email_verification_token;
    delete user.password_reset_token;
    return user;
};

module.exports = User;
