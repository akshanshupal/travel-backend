/**
 * Assignment Model Schema
 *
 */

module.exports = {

    attributes: {
        agent: {
            model: 'user'
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
              type: 'ref', columnType: 'datetime'
        },
        tourDate: {
               type: 'ref', columnType: 'datetime'
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
        tokenAmount:{
            type:'string'
        },
        paymentMode: {
            type: 'string'
        },
        mobile: {
            type: 'string'
        },
        email: {
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
        noOfRooms: {
            type: 'string'
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
        stayDate: {
            type: 'ref', columnType: 'datetime'
        },
        stayLocation: {
            type: 'string'
        },
        sightSeeing: {
            type: 'string'
        },
        pickUpAddress: {
            type: 'string'
        },
        pickUpDate: {
              type: 'ref', columnType: 'datetime'
        },
        dropDate: {
            type: 'ref', columnType: 'datetime'
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

        // totalCost: {
        //     type: 'string'
        // },
        idProof:{
            type:'json'
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' },

    }
};
