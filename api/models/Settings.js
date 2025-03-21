/**
 * Settings Model Schema
 *
 */

module.exports = {

    attributes: {
        key: {
            type: 'string'
        },
        value: {
            type: 'string'
        },
        more: {
            type: 'string'
        },
        status: {
            type: 'boolean'
        },
        company: {
            model: 'company'
        }

    }
};
