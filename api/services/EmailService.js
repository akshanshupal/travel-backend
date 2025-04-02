// api/services/EmailService.js

const nodemailer = require('nodemailer');

module.exports = {
    sendEmail: function (ctx, { email, subject, html, host, user, password }) {
        console.log(1)
        return new Promise(async (resolve, reject) => {
            try {
                // Validate required fields
                if (!email) return reject({ statusCode: 400, error: { message: "Email is required!" } });
                if (!password) return reject({ statusCode: 400, error: { message: "Password is required!" } });
                if (!host) return reject({ statusCode: 400, error: { message: "Host is required!" } });
    
                // Default values for welcome email
                subject = subject || "Welcome to Our Service";
                html = html || "<h1>Welcome!</h1><p>Thank you for signing up!</p>";
    
                // Configure Nodemailer
                const transporter = nodemailer.createTransport({
                    host: host,
                    port: 465, // Secure SMTP
                    secure: true,
                    auth: {
                        user: user,
                        pass: password,
                    },
                });
    
                // Email options
                const mailOptions = {
                    from: user,
                    to: email,
                    subject: subject,
                    html: html,
                };
    
                const info = await transporter.sendMail(mailOptions);
                sails.log.info("Email sent: " + info.response);
                return resolve({ data: { message: "Email sent successfully!" } });
            } catch (error) {
                sails.log.error("Error sending email: " + error);
                return reject({ statusCode: 500, error: { message: "Incorrect Mailer Configuration" } });
            }
        });
    }
    

};
