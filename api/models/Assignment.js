/**
 * Assignment Model Schema
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
        agentName: {
            type: 'string'
        },
       
        bookingDate: {
              type: 'ref', columnType: 'datetime'
        },
        totalCost: {
            type: 'string'
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
        travelDate: {
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
        finalPackageCost: {
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
            model: 'hotelcategory'
        },
        selectedFood: {
             type:'json'
        },
        specialInclusion:{
            type: 'string'
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
        tollParkingAdded: {
            type: 'boolean'
        },
        sendMail: {
            model: 'sendmail'
        },
        waveLink: {
            type: 'string'
        },
       idProof:{
           type:'json'
       },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' },

    }
};
