/**
 * ClientItinerary Model Schema
 *
 */

module.exports = {

    attributes: {
        title: {
            type: 'string'
        },
        clientName: {
            type: 'string'
        },
        status: {
            type: 'boolean'
        },
        itinerary:{
            model: 'itinerary'
        },
        user:{
            model: 'user'
        },
        hotelcategory:{
            model: 'hotelcategory'
        },
        email:{
            type:'string'
        },
        mobile:{
            type:'string'
        },
        tourDate:{
            type:'ref',
            columnType: 'date'
        },
        noOfAdults:{
            type:'string'
        },
        noOfKids:{
            type:'string'
        },
        kidsAges:{
            type:'json'
        },
        selectedFood:{
            type:'json',
        },
        selectedTransport:{
            type:'json'
        },
        noOfPackageDays:{
            type:'string'
        },
        noOfPackageNights:{
            type:'string'
        },
        packageCost:{
            type:'string'
        },
        taxes:{
            type:'string'
        },
        salesExecutive:{
            model:'user'
        },
        noOfRooms:{
            type:'string'
        },
        company: {
            model: 'company'
        },
        
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' }

    }
};
