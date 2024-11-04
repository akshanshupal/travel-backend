/**
 * MailTemplate Model Schema
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
        userIcon : {
            type: 'string',
            allowNull: true
        },
        bankIcon : {
            type: 'string',
            allowNull: true
        },
        paymentType :
        {
            type:'json'
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' },
    }
};
