const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email transporter configuration
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// Generate verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Send email verification
const sendVerificationEmail = async (user, token) => {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
    
    const mailOptions = {
        from: {
            name: 'Ms. Hoa - Trung tâm tiếng Trung',
            address: process.env.SMTP_USER
        },
        to: user.email,
        subject: 'Xác nhận địa chỉ email - Ms. Hoa Chinese Learning',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #c41e3a; margin-bottom: 10px;">Ms. Hoa 华老师</h1>
                    <p style="color: #666; font-size: 16px;">Trung tâm học tiếng Trung chuyên nghiệp</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Chào mừng ${user.full_name}!</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                        Cảm ơn bạn đã đăng ký tài khoản tại Ms. Hoa Chinese Learning Platform. 
                        Để hoàn tất quá trình đăng ký, vui lòng xác nhận địa chỉ email của bạn.
                    </p>
                    
                    <div style="text-align: center;">
                        <a href="${verificationUrl}" 
                           style="background: #c41e3a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            Xác nhận Email
                        </a>
                    </div>
                </div>
                
                <div style="border-top: 1px solid #eee; padding-top: 20px;">
                    <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
                        Nếu bạn không thể nhấp vào nút trên, hãy sao chép và dán liên kết sau vào trình duyệt:
                    </p>
                    <p style="color: #666; font-size: 14px; word-break: break-all;">
                        ${verificationUrl}
                    </p>
                </div>
                
                <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
                    <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                    <p>© 2025 Ms. Hoa Chinese Learning Platform</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Không thể gửi email xác nhận');
    }
};

// Send password reset email
const sendPasswordResetEmail = async (user, token) => {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    
    const mailOptions = {
        from: {
            name: 'Ms. Hoa - Trung tâm tiếng Trung',
            address: process.env.SMTP_USER
        },
        to: user.email,
        subject: 'Đặt lại mật khẩu - Ms. Hoa Chinese Learning',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #c41e3a; margin-bottom: 10px;">Ms. Hoa 华老师</h1>
                    <p style="color: #666; font-size: 16px;">Trung tâm học tiếng Trung chuyên nghiệp</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Đặt lại mật khẩu</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                        Chào ${user.full_name},<br><br>
                        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. 
                        Nhấp vào nút bên dưới để tạo mật khẩu mới.
                    </p>
                    
                    <div style="text-align: center;">
                        <a href="${resetUrl}" 
                           style="background: #c41e3a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            Đặt lại mật khẩu
                        </a>
                    </div>
                    
                    <p style="color: #e74c3c; font-size: 14px; margin-top: 20px; padding: 15px; background: #fdf2f2; border-radius: 5px;">
                        ⚠️ Liên kết này sẽ hết hạn sau 1 giờ vì lý do bảo mật.
                    </p>
                </div>
                
                <div style="border-top: 1px solid #eee; padding-top: 20px;">
                    <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
                        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                    </p>
                    <p style="color: #666; font-size: 14px; word-break: break-all;">
                        Liên kết đặt lại: ${resetUrl}
                    </p>
                </div>
                
                <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
                    <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                    <p>© 2025 Ms. Hoa Chinese Learning Platform</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Không thể gửi email đặt lại mật khẩu');
    }
};

// Send welcome email (after email verification)
const sendWelcomeEmail = async (user) => {
    const transporter = createTransporter();
    
    const mailOptions = {
        from: {
            name: 'Ms. Hoa - Trung tâm tiếng Trung',
            address: process.env.SMTP_USER
        },
        to: user.email,
        subject: 'Chào mừng bạn đến với Ms. Hoa Chinese Learning!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #c41e3a; margin-bottom: 10px;">Ms. Hoa 华老师</h1>
                    <p style="color: #666; font-size: 16px;">Trung tâm học tiếng Trung chuyên nghiệp</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Chào mừng ${user.full_name}!</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                        Tài khoản của bạn đã được xác nhận thành công! Bạn đã sẵn sàng bắt đầu hành trình học tiếng Trung cùng Ms. Hoa.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #c41e3a; margin-bottom: 15px;">🎯 Bắt đầu học ngay:</h3>
                        <ul style="color: #666; line-height: 1.8;">
                            <li>Khám phá các khóa học miễn phí</li>
                            <li>Nâng cấp VIP để truy cập toàn bộ nội dung</li>
                            <li>Theo dõi tiến độ học tập của bạn</li>
                            <li>Nhận chứng chỉ hoàn thành khóa học</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL}/courses" 
                           style="background: #c41e3a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            Khám phá khóa học
                        </a>
                    </div>
                </div>
                
                <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
                    <p>Chúc bạn học tập hiệu quả!</p>
                    <p>© 2025 Ms. Hoa Chinese Learning Platform</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        // Don't throw error for welcome email as it's not critical
        return false;
    }
};

module.exports = {
    generateVerificationToken,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail
};
