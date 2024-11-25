/**
 * GeneralData Model Schema
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
        code:{
            type: 'string'
        },
        value : {
            type: 'json'
        },
        alias:{
            type: 'string'
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' }

    }
};
