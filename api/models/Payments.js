/**
 * Payments Model Schema
 *
 */

module.exports = {

    attributes: {
        amount: {
            type: 'number'
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
        packageId: {
            type: 'string',
            allowNull: true
        },
        paymentDate: {
            type: 'ref',
            columnType: 'datetime'
        },
      
        paymentTo :{
            type: 'string',
            isIn: ['paymentToCompany', 'paymentForService']
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
        receiptNo: {
            type: 'string'
        },  
        paymentImg: {
            type: 'string'
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' }


    }
}
