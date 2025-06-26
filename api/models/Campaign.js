/**
 * Campaign Model Schema
 *
 */


module.exports = {

    attributes: {
        title: {
            type: 'string'
        },
        pipeline: {
            model : 'pipeline'
        },
        managingCampaign: {
            type : "json"
        },
        salesExecutive: {
            type : "json"
        },
        distributionType:{
          type : 'string'
        },
        additionalSetting:{
          type : 'json'
        },
        status: {
          type: 'boolean'
        },
        company: {
            model: 'company'
        },
        pause:{
            type : "boolean"
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' },

    }
};
