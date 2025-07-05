const { Sequelize } = require('sequelize');

// Database configuration
const sequelize = new Sequelize(
    process.env.DB_NAME || 'ms_hoa_chinese_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        
        // Pool configuration for connection management
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        
        // Support for Vietnamese characters
        define: {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
            timestamps: true,
            underscored: true
        }
    }
);

module.exports = { sequelize };
