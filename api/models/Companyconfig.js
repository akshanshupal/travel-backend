/**
 * Companyconfig Model Schema
 *
 */

module.exports = {

    attributes: {
        company: {
            model: 'company'
        },
        panelUrl: {
            type: 'string',
            required: true,
        },

        websiteUrls : {
            type: 'json'
        },
        apiKey : {
            type: 'string'
        },
        logo : {
            type: 'string'
        },
        favicon : {
            type: 'string'
        },
        address:{
            type: 'string'
        },
        paymentReceiptPrefix : {
            type: 'string'
        },
        paymentReceiptLength : {
            type: 'number'
        },
        email: {
            type: 'string',
            // isEmail: true
        },
        packagePrefix : {
            type: 'string'
        },
        packageLength : {
            type: 'string'
        }
    }
};
