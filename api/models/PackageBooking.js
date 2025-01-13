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
        location:{
            type: 'string'
        },
        checkInDate:{
            type: 'ref',
            columnType: 'datetime'
        },
        checkOutDate:{
            type: 'ref',
            columnType: 'datetime'
        },
        customParams : {
            type: 'json'
        },
        noOfNight:{
            type: 'string'
        },
        vendor:{
            model: 'vendor'
        },
        company: {
            model: 'company'
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' }

    }
};
