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
        logo: {
            type: 'string',
            allowNull: true
        },
        website: {
            type: 'string',
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
        emailIcon : {
            type: 'string',
            allowNull: true
        },
        disclaimer:{
            type:'string'
        },
        hotlineNumber:{
            type:'string'

        },
        mailId:{
            type:'json',
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' },
    }
};
