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
        email: {
            type: 'string'
        },
        password: {
            type: 'string'
        },
        emailCompany: {
             type: 'string'
        }
    }
};
