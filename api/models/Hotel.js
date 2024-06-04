/**
 * Hotel Model Schema
 *
 */


module.exports = {

    attributes: {
        name: {
            type: 'string'
        },
        location: {
            type: 'string'
        },
        address: {
            type: 'string'
        },
        category: {
            model: 'hotelcategory'
        },
        sqlId: {
            type: 'string'
        },
        company: {
            model: 'company'
        },
        status: {
            type: 'boolean'
        },


    }
};
