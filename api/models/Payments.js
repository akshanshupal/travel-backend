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
            isIn: ['paymentToCustomer', 'hotel', 'vendor', 'other']
        },
        mode: {
            type: 'string',
            isIn: ['online', 'offline', 'netbanking', 'cash', 'neft', 'rtgs', 'cheque', 'other']
        },
        paymentType: {
            type: 'string',
            isIn: ['Dr', 'Cr']
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' }


    }
}
