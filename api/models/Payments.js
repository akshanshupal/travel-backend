/**
 * Payments Model Schema
 *
 */

module.exports = {

    attributes: {
        amount: {
            type: 'string'
        },
        status: {
            type: 'boolean'
        },
        company: {
            model: 'company'
        },
        assignment: {
            model: 'assignment'
        },
        remarks: {
            type: 'string'
        },
        paymentDate: {
            type: 'ref',
            columnType: 'date'
        },
        paymentTo :{
            type: 'string',
            isIn: ['paymentToCompany', 'hotel', 'vendor', 'other']
        },
        paymentStore: {
            model: 'paymentStore'
        },

        paymentType: {
            type: 'string',
            isIn: ['Dr', 'Cr']
        },
        packageBooking: {
            model: 'packageBooking'
        },
        
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' }


    }
}
