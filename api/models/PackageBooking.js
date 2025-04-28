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
      
        bookingsType:{
            model: 'bookingsType'
          },
        bookingDate:{
             type: 'ref',
            columnType: 'date'
        },
        amount:{
            type: 'number'
        },
        startDate:{
            type: 'ref',
            columnType: 'datetime'
        },
        hasStartTime: {
            type: 'boolean',
            defaultsTo: false
        },
        endDate:{
            type: 'ref',
            columnType: 'datetime'
        },
        hasEndTime: {
            type: 'boolean',
            defaultsTo: false
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
        package: {
            model: 'package'
        },
        pendingAmount: {
            type: 'number',
        },
       
        assignment: {
            model: 'assignment'
        },
        packageId: {
            type: 'string',
            allowNull: true
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' }

    }
};
