const { Pool } = require('pg');

// Database configuration
const dbConfig = process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
} : {
    // Development fallback - won't work without local PostgreSQL
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

console.log('🔗 Database Config:', process.env.DATABASE_URL ? 'Azure PostgreSQL' : 'Local PostgreSQL');

// Create connection pool
const pool = new Pool(dbConfig);

// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err);
});

// Database initialization
const initializeDatabase = async () => {
    try {
        const client = await pool.connect();
        
        // Create users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                membership_tier VARCHAR(50) DEFAULT 'free',
                email_verified BOOLEAN DEFAULT true,
                is_active BOOLEAN DEFAULT true,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create courses table
        await client.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                title_chinese VARCHAR(255),
                description TEXT,
                level VARCHAR(50),
                hsk_level VARCHAR(20),
                required_tier VARCHAR(50) DEFAULT 'free',
                price_vnd INTEGER DEFAULT 0,
                is_featured BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert demo data if not exists
        const usersResult = await client.query('SELECT COUNT(*) FROM users');
        if (parseInt(usersResult.rows[0].count) === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('password123', 12);
            
            await client.query(`
                INSERT INTO users (email, password, full_name, membership_tier)
                VALUES ($1, $2, $3, $4)
            `, ['demo@mshoa.com', hashedPassword, 'Học viên Demo', 'free']);
        }

        const coursesResult = await client.query('SELECT COUNT(*) FROM courses');
        if (parseInt(coursesResult.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO courses (title, title_chinese, description, level, hsk_level, required_tier, price_vnd, is_featured)
                VALUES 
                    ($1, $2, $3, $4, $5, $6, $7, $8),
                    ($9, $10, $11, $12, $13, $14, $15, $16)
            `, [
                'Tiếng Trung Cơ Bản', '基础中文', 'Khóa học tiếng Trung cơ bản cho người mới bắt đầu', 
                'beginner', 'HSK 1-2', 'free', 0, true,
                'Tiếng Trung Nâng Cao', '高级中文', 'Khóa học tiếng Trung nâng cao cho học viên có kinh nghiệm', 
                'advanced', 'HSK 5-6', 'vip', 2000000, true
            ]);
        }

        client.release();
        console.log('✅ Database initialized successfully');
        
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    }
};

// User operations
const userOperations = {
    // Find user by email
    findByEmail: async (email) => {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    },

    // Find user by ID
    findById: async (id) => {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    },

    // Create new user
    create: async (userData) => {
        const { email, password, full_name, membership_tier = 'free' } = userData;
        const result = await pool.query(`
            INSERT INTO users (email, password, full_name, membership_tier)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, full_name, membership_tier, email_verified, is_active, created_at, updated_at
        `, [email, password, full_name, membership_tier]);
        return result.rows[0];
    },

    // Update last login
    updateLastLogin: async (id) => {
        await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    }
};

// Course operations
const courseOperations = {
    // Get all active courses
    getAll: async () => {
        const result = await pool.query('SELECT * FROM courses WHERE is_active = true ORDER BY is_featured DESC, id ASC');
        return result.rows;
    },

    // Get course by ID
    findById: async (id) => {
        const result = await pool.query('SELECT * FROM courses WHERE id = $1 AND is_active = true', [id]);
        return result.rows[0];
    }
};

module.exports = {
    pool,
    initializeDatabase,
    userOperations,
    courseOperations
};
