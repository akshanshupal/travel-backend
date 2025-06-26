/**
 * Leads Model Schema
 *
 */

module.exports = {

    attributes: {
        title: {
            type: 'string'
        },
        mobile: {
            type: 'string'
        },
        email: {
            type: 'string'
        },
        campaign: {
            model: 'campaign'
        },
        pipeline: {
            model: 'pipeline'
        },
        salesExecutive:{
            model: 'user'
        },
        otherOptions:{
            type: 'string'
        },
        status: {
            type: 'boolean'
        },
        company: {
            model: 'company'
        },
        source:{
            type: 'string'
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' }

    }
};
