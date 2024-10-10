/**
 * HotelImage Model Schema
 *
 */

module.exports = {

    attributes: {
        hotel: {
            model: 'hotel'
        },
        status: {
            type: 'boolean'
        },
        url: {
            type: 'string'
        },
        sqlId: {
            type: 'string'
        },
        company: {
            model: 'company'
        },
        uploaded: {
            type: 'boolean'
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' }

    }
};
