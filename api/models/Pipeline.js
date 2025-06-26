/**
 * Pipeline Model Schema
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
        initialStage:{
            type:'json'
        },
        otherStages:{
                type: 'json'
        },
        convertedStage:{
            type:'json'
        },
        rejectedStage:{
            type:'json'
        },

        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' }

    }
};
