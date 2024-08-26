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
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' }

    }
};
