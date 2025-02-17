/**
 * PackageBooking Model Schema
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
        package: {
            model: 'package'
        },
        bookingsType:{
            model: 'bookingsType'
          },
        bookingDate:{
             type: 'ref',
            columnType: 'date'
        },
        amount:{
            type: 'string'
        },
        startDate:{
            type: 'ref',
            columnType: 'datetime'
        },
        endDate:{
            type: 'ref',
            columnType: 'datetime'
        },
        customParams : {
            type: 'json'
        },
        vendor:{
            model: 'vendor'
        },
        company: {
            model: 'company'
        },
        nextPaymentDate: {
          type: 'ref',
          columnType: 'datetime'
        },
        bookedStatus:{
            type: 'string' ,
            allowNull: true,
            isIn : [ 'bookedWithPartialPayment', 'bookedWithFullPayment']
        },
        bookingStatus: {
            type: 'string',
            isIn : ['pending', 'booked']
        },
        pendingAmount: {
            type: 'string',
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' }

    }
};
