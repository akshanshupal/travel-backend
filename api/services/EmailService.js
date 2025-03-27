// api/services/EmailService.js

const nodemailer = require('nodemailer');

module.exports = {
  sendEmail: function (ctx,to, subject, html,host,user,password) {
    return new Promise(async (resolve, reject) => {
        let transporter;
        let mailOptions
        transporter = nodemailer.createTransport({
            host: host,
            port: 465,
            secure: true,
            auth: {
                user: user,
                pass: password,
            },
         
        });
    
            // Configure mail options
        mailOptions = {
            from: user,
            to,
            subject,
            // text,
            html,
        };
        // Set up transporter configuration

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
},
  sendWelcomeEmail: async function (ctx,data) {
    return new Promise(async (resolve, reject) => {
        if (!data.email) {
            return reject({ statusCode: 400, error: { message: 'email is required!' } });
        }
        if (!data.password) {
            return reject({ statusCode: 400, error: { message: 'password is required!' } });
        }   
        const email = data?.email; // Assume email is sent in the request body
        const subject = data?.subject || 'Welcome to Our Service';
        // const text = data?.text || 'Thank you for signing up!';
        const html = data?.html || '<h1>Welcome!</h1><p>Thank you for signing up!</p>';
        const host = data?.host;
        const user = data?.user ;
        const password = data?.password; // Assume email is sent in the request body
       
        try {
            await this.sendEmail(ctx,email, subject, html, host , user, password);
            return resolve({data: { message: 'Email sent successfully!' }});
        } catch (error) {
            return reject(error);
        }
    })
},

};
