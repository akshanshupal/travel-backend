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
        walkInAt: { type: 'ref', columnType: 'datetime' },
        walkInLocation: { type: 'string' },
        visitorName: { type: 'string' },
        currentStageId: {
            type: 'string'
        },
        currentStageName: {
            type: 'string'
        },
        customProperties: {
            type: 'json',
            defaultsTo: {}
        },
        priority: {
            type: 'string'
        },
        leadStatus: {
            type: 'string'
        },
        convertedAt: { type: 'ref', columnType: 'datetime' },
        lostReason: {
            type: 'string'
        },
        enquiry: {
            model: 'enquiry'
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' }

    }
};
