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
        // dashboardUrl: {
        //     type: 'string',
        // },
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
        }
    }
};
