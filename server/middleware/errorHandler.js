// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('Error:', err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'ID không hợp lệ';
        error = { message, statusCode: 400 };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Dữ liệu đã tồn tại';
        error = { message, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
    }

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        const message = err.errors.map(e => e.message).join(', ');
        error = { message, statusCode: 400 };
    }

    // Sequelize unique constraint error
    if (err.name === 'SequelizeUniqueConstraintError') {
        const message = 'Dữ liệu đã tồn tại trong hệ thống';
        error = { message, statusCode: 400 };
    }

    // Sequelize foreign key constraint error
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        const message = 'Dữ liệu tham chiếu không hợp lệ';
        error = { message, statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token không hợp lệ';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token đã hết hạn';
        error = { message, statusCode: 401 };
    }

    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'File quá lớn. Vui lòng chọn file nhỏ hơn 100MB';
        error = { message, statusCode: 400 };
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        const message = 'Định dạng file không được hỗ trợ';
        error = { message, statusCode: 400 };
    }

    // Default error response
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Lỗi server, vui lòng thử lại sau',
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            error: err 
        })
    });
};

module.exports = errorHandler;
