/**
 * Sendmail Model Schema
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
        email:{
            type: 'string',

        },
        subject:{
            type: 'string',
        },
        html:{
            type: 'string',
        },
        savedItinerary:{
            model: 'savedItinerary'
        },
        sendBy:{
            model: 'user'
        }

    }
};
