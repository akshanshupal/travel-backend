/**
 * Package Model Schema
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
        mobile: {
            type: 'string',
        },
        tourDate: {
            type: 'ref',
            columnType: 'date'
        },
        dateOfBooking: {
            type: 'ref',
            columnType: 'date'
        },
        travelLocation: {
            type: 'string'
        },
        homeLocation: {
            type: 'string'
        },
        packageCost: {
            type: 'string'
        },
        finalPackageCost: {
            type: 'string'
        },
        totalPaidCost: {
            type: 'string'
        },
        pendingAmount: {
            type: 'string'
        },
        receivedPaymentRatio: {
            type: 'string'
        },
        noOfDays: {
            type: 'string'
        },
        noOfAdult: {
            type: 'string'
        },
        noOfKids: {
            type: 'string'
        },
        carSeater: {
            type: 'string'
        },
        noOfRooms: {
            type: 'string'
        },
        hotelCategory: {
            type: 'string'
        },
        selectedFood:{
            type:'json',
        },
        specialInclusion: {
            type: 'string'
        },
        textForBookingTeam: {
            type: 'string'
        },
        stayDate: {
            type: 'string'
        },
        stayLocation: {
            type: 'string'
        },
        sightseeing: {
            type: 'string'
        },
        pickUpAddress: {
            type: 'string'
        },
        dropAddress: {
            type: 'string'
        },
        companyPayment: {
            type: 'string'
        },
        hotelPayment: {
            type: 'string'
        },
        cabPayment: {
            type: 'string'
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' }

    }
};


