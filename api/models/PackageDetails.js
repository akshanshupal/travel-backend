/**
 * PackageDetails Model Schema
 *
 */

module.exports = {

    attributes: {
        title: {
            type: 'string'
        },
        list: {
            type: 'json'
        },
        type: {
            type: 'string' // INCLUSIONS, EXCLUSIONS
        },
        status: {
            type: 'boolean'
        },
        company: {
            model: 'company'
        }

    }
};
