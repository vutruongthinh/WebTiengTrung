// Simple authentication system without database for MVP testing
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// In-memory user storage (will be lost on server restart)
let users = [];
let userIdCounter = 1;

class MockUser {
    constructor(email, password, full_name) {
        this.id = userIdCounter++;
        this.email = email;
        this.password = password; // Will be hashed
        this.full_name = full_name;
        this.membership_tier = 'free';
        this.membership_expires_at = null;
        this.is_active = true;
        this.email_verified = false;
        this.email_verification_token = null;
        this.password_reset_token = null;
        this.password_reset_expires = null;
        this.last_login = null;
        this.profile_image = null;
        this.created_at = new Date();
        this.updated_at = new Date();
    }

    async hashPassword() {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
    }

    async comparePassword(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
    }

    hasMembershipAccess(requiredTier) {
        const tierLevels = {
            'free': 0,
            'vip': 1
        };
        
        if (this.membership_expires_at && new Date() > this.membership_expires_at) {
            return false;
        }
        
        return tierLevels[this.membership_tier] >= tierLevels[requiredTier];
    }

    toSafeObject() {
        const safeUser = { ...this };
        delete safeUser.password;
        delete safeUser.email_verification_token;
        delete safeUser.password_reset_token;
        return safeUser;
    }

    toJSON() {
        return this.toSafeObject();
    }
}

// Mock database operations
const MockUserDB = {
    async create(userData) {
        // Check if user already exists
        const existingUser = users.find(u => u.email === userData.email);
        if (existingUser) {
            const error = new Error('User already exists');
            error.name = 'SequelizeUniqueConstraintError';
            throw error;
        }

        const user = new MockUser(userData.email, userData.password, userData.full_name);
        if (userData.email_verified !== undefined) {
            user.email_verified = userData.email_verified;
        }
        
        await user.hashPassword();
        users.push(user);
        return user;
    },

    async findOne(options) {
        if (options.where && options.where.email) {
            return users.find(u => u.email === options.where.email) || null;
        }
        return null;
    },

    async findByPk(id) {
        return users.find(u => u.id == id) || null;
    }
};

// Test connection function
const testConnection = async () => {
    console.log('✅ Mock database connection established successfully');
    return true;
};

// Initialize database function
const initializeDatabase = async () => {
    console.log('✅ Mock database tables synchronized');
    
    // Create a default test user if none exist
    if (users.length === 0) {
        try {
            await MockUserDB.create({
                email: 'test@example.com',
                password: 'password123',
                full_name: 'Người dùng thử nghiệm',
                email_verified: true
            });
            console.log('✅ Default test user created (test@example.com / password123)');
        } catch (error) {
            // Ignore if user already exists
        }
    }
};

module.exports = {
    MockUser,
    MockUserDB,
    testConnection,
    initializeDatabase,
    // Export for compatibility
    sequelize: {
        authenticate: testConnection,
        sync: initializeDatabase
    }
};
