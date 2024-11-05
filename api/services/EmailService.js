// api/services/EmailService.js

const nodemailer = require('nodemailer');

module.exports = {
  sendEmail: function (to, subject, text, html) {
    return new Promise(async (resolve, reject) => {
        // Set up transporter configuration
        const transporter = nodemailer.createTransport({
            host: 'smtpout.secureserver.net',
            port: 465,
            secure: true,
            auth: {
                user: 'sales@thetripbliss.com',
                pass: 'Shalini@123',
            },
        });

        // Configure mail options
        const mailOptions = {
            from: 'sales@thetripbliss.com',
            to,
            subject,
            text,
            html,
        };

        // Attempt to send email
        try {
            const info = await transporter.sendMail(mailOptions);
            sails.log.info('Email sent: ' + info.response);
            return resolve(info);
        } catch (error) {
            sails.log.error('Error sending email: ' + error);
            return reject({ statusCode: 500, error });
        }
    });
}

};
