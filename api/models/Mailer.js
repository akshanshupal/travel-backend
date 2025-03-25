/**
 * Mailer Model Schema
 *
 */

module.exports = {

    attributes: {
        title: {
            type: 'string'
        },
        status: {
            type: 'boolean'
        },
        company: {
            model: 'company'
        },
        host: {
            type: 'string'
        },
        html : {
            type: 'string'
        },
        email: {
            type: 'string'
        },
        pass: {
            type: 'string'
        },
        emailCompany: {
             type: 'string'
        }
    }
};
