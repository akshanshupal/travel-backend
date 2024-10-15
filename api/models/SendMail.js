/**
 * SendMail Model Schema
 *
 */

const { model } = require("mongoose");

module.exports = {

    attributes: {
       
        status: {
            type: 'boolean'
        },
        company: {
            model: 'company'
        },
        clientItinerary :{
           model: 'clientItinerary'
        },
        mail: {
            type:'string'
        },
        mobile: {
            type:'string'
        },
        clientName: {
            type:'string'
        },
        packageCost: {
            type:'string'
        },
        salesExecutive : {
            model: 'user'
        },
        tourDate: {
            type: 'ref', columnType: 'datetime'
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' }

    }
};
