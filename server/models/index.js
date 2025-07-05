// Models
const User = require('./User');
const Course = require('./Course');
const Video = require('./Video');
const Payment = require('./Payment');
const UserCourse = require('./UserCourse');

// Define associations
const setupAssociations = () => {
    // User associations
    User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
    User.hasMany(UserCourse, { foreignKey: 'user_id', as: 'enrolledCourses' });

    // Course associations
    Course.hasMany(Video, { foreignKey: 'course_id', as: 'videos' });
    Course.hasMany(Payment, { foreignKey: 'course_id', as: 'payments' });
    Course.hasMany(UserCourse, { foreignKey: 'course_id', as: 'enrollments' });

    // Video associations
    Video.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

    // Payment associations
    Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
    Payment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

    // UserCourse associations
    UserCourse.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
    UserCourse.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
    UserCourse.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });
    UserCourse.belongsTo(Video, { foreignKey: 'last_watched_video_id', as: 'lastWatchedVideo' });

    // Many-to-many through UserCourse
    User.belongsToMany(Course, { 
        through: UserCourse, 
        foreignKey: 'user_id',
        otherKey: 'course_id',
        as: 'courses'
    });
    
    Course.belongsToMany(User, { 
        through: UserCourse, 
        foreignKey: 'course_id',
        otherKey: 'user_id',
        as: 'students'
    });
};

// Initialize associations
setupAssociations();

module.exports = {
    User,
    Course,
    Video,
    Payment,
    UserCourse,
    setupAssociations
};
