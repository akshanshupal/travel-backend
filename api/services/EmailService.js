// api/services/EmailService.js

const nodemailer = require('nodemailer');

module.exports = {
  sendEmail: function (ctx,to, subject, text, html) {
    return new Promise(async (resolve, reject) => {
        let transporter;
        let mailOptions
        if(ctx.session&&ctx.session.activeCompany&&ctx.session.activeCompany.id=='65fb18f4566f341facb8d1a9'){
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

            // transporter = nodemailer.createTransport({
            //     host: 'smtpout.secureserver.net',
            //     port: 465,
            //     secure: true,
            //     auth: {
            //         user: 'sales@thetripbliss.com',
            //         pass: 'Shalini@123',
            //     },
            // });
    
            // // Configure mail options
            // mailOptions = {
            //     from: 'sales@thetripbliss.com',
            //     to,
            //     subject,
            //     text,
            //     html,
            // };
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
}

};
