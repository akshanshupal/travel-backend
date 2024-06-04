/**
 * HotelCategory Model Schema
 *
 */

module.exports = {

    attributes: {
        title: {
            type: 'string'
        },
        alias: {
            type: 'string'
        },
        status: {
            type: 'boolean'
        },
        sqlId: {
            type: 'string'
        },
        company: {
            model: 'company'
        }

    }
};
