const { Sequelize } = require('sequelize');

// For quick MVP testing, use mock database
if (process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'development') {
    const { testConnection, initializeDatabase, sequelize } = require('./mockDatabase');
    module.exports = {
        sequelize,
        testConnection,
        initializeDatabase
    };
    return;
}

// Database configuration for production
let sequelize;

if (process.env.NODE_ENV === 'production') {
    // PostgreSQL for production
    sequelize = new Sequelize(
        process.env.DB_NAME || 'ms_hoa_chinese_db',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || '',
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            dialect: 'postgres',
            logging: false,
            
            pool: {
                max: 10,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            
            define: {
                timestamps: true,
                underscored: true
            }
        }
    );
} else {
    // In-memory SQLite for local development (no file/installation required)
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:', // In-memory database
        logging: false, // Set to console.log to see SQL queries
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        }
    });
}

// Test database connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully');
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to database:', error.message);
        return false;
    }
};

// Initialize database (create tables)
const initializeDatabase = async () => {
    try {
        await sequelize.sync({ force: false }); // Don't drop existing tables
        console.log('✅ Database tables synchronized');
    } catch (error) {
        console.error('❌ Error synchronizing database:', error);
        throw error;
    }
};

module.exports = { 
    sequelize,
    testConnection,
    initializeDatabase
};
