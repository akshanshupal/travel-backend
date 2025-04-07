/**
 * Assignment Model Schema
 *
 */

const { type } = require("os");

module.exports = {

    attributes: {
        agentName: {
            model: 'user'
        },
        clientName: {
            type: 'string'
        },
        title: {
            type: 'string'
        },
        status: {
            type: 'boolean'
        },
        company: {
            model: 'company'
        },
        bookingDate: {
              type: 'ref', columnType: 'date'
        },
        tourDate: {
               type: 'ref', columnType: 'date'
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
        taxes:{
            type:'string'
        },
        finalPackageCost: {
            type: 'string'
        },
        tokenPayment: {
            model: 'payments'
        },
        mobile: {
            type: 'string'
        },
        email: {
            type: 'string'
        },
        // noOfDays: {
        //     type: 'string'
        // },
        noOfAdult: {
            type: 'string'
        },
        noOfKids: {
            type: 'string'
        },
        noOfRooms: {
            type: 'string'
        },
        noOfPackageDays:{
            type:'string'
        },
        noOfPackageNights:{
            type:'string'
        },
        hotelCategory: {
            model: 'hotelcategory'
        },
        carSeater: {
            type: 'string'
        },
        specialInclusion:{
            type: 'string'
        },
        selectedFood: {
            type:'json'
        },
        textForBookingTeam: {
           type: 'string'
        },
    
        stayInformation:{
            type : 'json',
        },
        siteSeeing: {
            type: 'string'
        },
        pickUpAddress: {
            type: 'string'
        },
        pickUpDate: {
              type: 'ref', columnType: 'datetime'
        },
        pickUpTime: {
              type: 'ref', columnType: 'time'
        },
        dropDate: {
            type: 'ref', columnType: 'datetime'
        },
        dropTime: {
            type: 'ref', columnType: 'time'
        },
        dropAddress: {
            type: 'string'
        },    
        whatsappSent: {
            type: "boolean"
        },
        itineraryLink:{
            type:'string'
        },
        emailSent: {
            type: "boolean"
        },
        tollParkingAdded: {
            type: 'boolean'
        },
        waveLink: {
            type: 'string'
        },
        savedItinerary: {
            model: 'savedItinerary'
        },
        kidsAges: {
            type: 'json'
        },
        verify: {
            type: 'boolean'
        },
        verifyTime:{
            type: 'ref', columnType: 'datetime'
        },
        idProof:{
            type:'json'
        },
        packageId:{
           type : 'string'
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' },

    }
};
