// Simple test app without database dependencies
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('Starting test app...');
console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

app.use(express.json());

// Basic health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Chinese Learning API - Test Version',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            DATABASE_CONFIGURED: !!process.env.DATABASE_URL
        }
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(Test server running on port );
    console.log('Environment:', process.env.NODE_ENV);
});

// Error handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
