// api/services/EmailService.js

const nodemailer = require('nodemailer');

module.exports = {
  sendEmail: function (ctx,to, subject, text, html,from,password) {
    return new Promise(async (resolve, reject) => {
        let transporter;
        let mailOptions
        if(ctx.session&&ctx.session.activeCompany&&ctx.session.activeCompany.id=='65fb18f4566f341facb8d1a9'){
                        // //tripzipper
                        // transporter = nodemailer.createTransport({
                        //     host: 'smtpout.secureserver.net',
                        //     port: 465,
                        //     secure: true,
                        //     auth: {
                        //         user: from,
                        //         pass: password,
                        //         // user: 'enquiry@tripzipper.co.in',
                        //         // pass: 'Nokia@5310',
                        //     },
                        // });
                
                        // // Configure mail options
                        // mailOptions = {
                        //     from: from,
                        //     // from: 'enquiry@tripzipper.co.in',
                        //     to,
                        //     subject,
                        //     text,
                        //     html,
                        // };

            transporter = nodemailer.createTransport({
                host: 'smtpout.secureserver.net',
                port: 465,
                secure: true,
                auth: {
                    user: 'sales@thetripbliss.com',
                    pass: 'Shalini@123',
                },
            });
    
            // Configure mail options
            mailOptions = {
                from: 'sales@thetripbliss.com',
                to,
                subject,
                text,
                html,
            };
        }
        if(ctx.session&&ctx.session.activeCompany&&ctx.session.activeCompany.id=='674f3fa327a4eb7981d4df5a'){
            //tripzipper
            transporter = nodemailer.createTransport({
                host: 'smtpout.secureserver.net',
                port: 465,
                secure: true,
                auth: {
                    user: 'enquiry@tripzipper.co.in',
                    pass: 'Nokia@5310',
                },
            });
    
            // Configure mail options
            mailOptions = {
                from: 'enquiry@tripzipper.co.in',
                to,
                subject,
                text,
                html,
            };
        }
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

        
        const email = data.email; // Assume email is sent in the request body
        const password = data.password; // Assume email is sent in the request body
        const subject = data?.subject || 'Welcome to Our Service';
        const text = data?.text || 'Thank you for signing up!';
        const html = data?.html || '<h1>Welcome!</h1><p>Thank you for signing up!</p>';

        try {
            await this.sendEmail(ctx,email, subject, text, html,from, password);
            return resolve({data: { message: 'Email sent successfully!' }});
        } catch (error) {
            return reject(error);
        }
    })
},

};
