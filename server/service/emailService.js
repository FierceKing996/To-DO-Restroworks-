const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendSuperAdminAlert = async (userData) => {
    try {
        const mailOptions = {
            from: `"AgencyOS Alerts" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL, // This sends it to you
            subject: `🚨 New Super Admin Request from ${userData.username}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #2563eb;">New Super Admin Request</h2>
                    <p>Hello Aditya,</p>
                    <p>A user has just requested Super Admin access from the dashboard.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p><strong>Username:</strong> ${userData.username}</p>
                    <p><strong>Email:</strong> ${userData.email}</p>
                    <p><strong>User ID:</strong> ${userData.userId}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #666; font-size: 12px;">
                        To approve this, log into your MongoDB database and change this user's role to 'admin'.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("📧 Real email sent successfully! Message ID:", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Email sending failed:", error);
        throw error;
    }
};