/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/': { view: 'pages/homepage' },

  'POST /api/auth/signin': 'AuthController.signIn',
  'POST /api/auth/getAuthToken': 'AuthController.refreshToken',

  'GET /api/health': 'AuthController.health',
  'GET /api/i/version': 'AuthController.getApiVersion',


  'POST /api/file/upload': 'FileController.uploadFile',
  'POST /api/file/delete': 'FileController.deleteFile',
  'POST /api/update-hotel-images': 'FileController.updateHotelImages',

 

  'POST /api/user': 'UserController.create',
  'GET /api/user': 'UserController.find',
  'GET /api/user/:id': 'UserController.findOne',
  'PUT /api/user/:id': 'UserController.updateOne',
  'DELETE /api/user/:id': 'UserController.deleteOne',
  'GET /api/user-cache/:id': 'UserController.getCacheUser',

  'POST /api/company': 'CompanyController.create',
  'GET /api/company': 'CompanyController.find',
  'GET /api/company/:id': 'CompanyController.findOne',
  'PUT /api/company/:id': 'CompanyController.updateOne',
  'DELETE /api/company/:id': 'CompanyController.deleteOne',

  'POST /api/companyconfig': 'CompanyconfigController.create',
  'GET /api/companyconfig': 'CompanyconfigController.find',
  'GET /api/companyconfig/:id': 'CompanyconfigController.findOne',
  'PUT /api/companyconfig/:id': 'CompanyconfigController.updateOne',
  'DELETE /api/companyconfig/:id': 'CompanyconfigController.deleteOne',
  'PUT /api/companyconfig/update-company-config': 'CompanyconfigController.updateCompanyConfig',



  'POST /api/site': 'siteController.create',
  'GET /api/site': 'siteController.find',
  'GET /api/site/:id': 'siteController.findOne',
  'PUT /api/site/:id': 'siteController.updateOne',
  'DELETE /api/site/:id': 'siteController.deleteOne',
  'GET /api/site-cache/:id': 'UserController.getCacheSite',


  'POST /api/area': 'areaController.create',
  'GET /api/area': 'areaController.find',
  'GET /api/area/:id': 'areaController.findOne',
  'PUT /api/area/:id': 'areaController.updateOne',
  'DELETE /api/area/:id': 'areaController.deleteOne',

  'POST /api/hotelcategory': 'HotelCategoryController.create',
  'GET /api/hotelcategory': 'HotelCategoryController.find',
  'GET /api/hotelcategory/:id': 'HotelCategoryController.findOne',
  'PUT /api/hotelcategory/:id': 'HotelCategoryController.updateOne',
  'DELETE /api/hotelcategory/:id': 'HotelCategoryController.deleteOne',

  'POST /api/hotel': 'HotelController.create',
  'GET /api/hotel': 'HotelController.find',
  'GET /api/hotel/:id': 'HotelController.findOne',
  'PUT /api/hotel/:id': 'HotelController.updateOne',
  'DELETE /api/hotel/:id': 'HotelController.deleteOne',

  'POST /api/hotelimage': 'HotelImageController.create',
  'GET /api/hotelimage': 'HotelImageController.find',
  'GET /api/hotelimage/:id': 'HotelImageController.findOne',
  'PUT /api/hotelimage/:id': 'HotelImageController.updateOne',
  'DELETE /api/hotelimage/:id': 'HotelImageController.deleteOne',

  'POST /api/itinerary': 'ItineraryController.create',
  'GET /api/itinerary': 'ItineraryController.find',
  'GET /api/itinerary/:id': 'ItineraryController.findOne',
  'PUT /api/itinerary/:id': 'ItineraryController.updateOne',
  'DELETE /api/itinerary/:id': 'ItineraryController.deleteOne',

  'POST /api/packagedetails': 'PackageDetailsController.create',
  'GET /api/packagedetails': 'PackageDetailsController.find',
  'GET /api/packagedetails/:id': 'PackageDetailsController.findOne',
  'PUT /api/packagedetails/:id': 'PackageDetailsController.updateOne',
  'DELETE /api/packagedetails/:id': 'PackageDetailsController.deleteOne',


  'GET /api/dashboard/getSummary': 'DashboardController.getSummary',


  'POST /api/package': 'PackageController.create',
  'GET /api/package': 'PackageController.find',
  'GET /api/package/:id': 'PackageController.findOne',
  'PUT /api/package/:id': 'PackageController.updateOne',
  'DELETE /api/package/:id': 'PackageController.deleteOne',



  'POST /api/bookingstype': 'BookingsTypeController.create',
  'GET /api/bookingstype': 'BookingsTypeController.find',
  'GET /api/bookingstype/:id': 'BookingsTypeController.findOne',
  'PUT /api/bookingstype/:id': 'BookingsTypeController.updateOne',
  'DELETE /api/bookingstype/:id': 'BookingsTypeController.deleteOne',

  'POST /api/packagebooking': 'PackageBookingController.create',
  'GET /api/packagebooking': 'PackageBookingController.find',
  'GET /api/packagebooking/:id': 'PackageBookingController.findOne',
  'PUT /api/packagebooking/:id': 'PackageBookingController.updateOne',
  'DELETE /api/packagebooking/:id': 'PackageBookingController.deleteOne',

  'POST /api/clientitinerary': 'ClientItineraryController.create',
  'GET /api/clientitinerary': 'ClientItineraryController.find',
  'GET /api/clientitinerary/:id': 'ClientItineraryController.findOne',
  'PUT /api/clientitinerary/:id': 'ClientItineraryController.updateOne',
  'DELETE /api/clientitinerary/:id': 'ClientItineraryController.deleteOne',

  'POST /api/vendor': 'VendorController.create',
  'GET /api/vendor': 'VendorController.find',
  'GET /api/vendor/:id': 'VendorController.findOne',
  'PUT /api/vendor/:id': 'VendorController.updateOne',
  'DELETE /api/vendor/:id': 'VendorController.deleteOne',

  'POST /api/sendmail': 'SendMailController.create',
  'POST /api/sendmail/send-itinerary': 'SendMailController.sendWelcomeEmail',
  'GET /api/sendmail': 'SendMailController.find',
  'GET /api/sendmail/:id': 'SendMailController.findOne',
  'PUT /api/sendmail/:id': 'SendMailController.updateOne',
  'DELETE /api/sendmail/:id': 'SendMailController.deleteOne',


  'POST /api/mailtemplate': 'MailTemplateController.create',
  'GET /api/mailtemplate': 'MailTemplateController.find',
  'GET /api/mailtemplate/:id': 'MailTemplateController.findOne',
  'PUT /api/mailtemplate/:id': 'MailTemplateController.updateOne',
  'DELETE /api/mailtemplate/:id': 'MailTemplateController.deleteOne',

  'POST /api/assignment': 'AssignmentController.create',
  'GET /api/assignment': 'AssignmentController.find',
  'GET /api/assignment/:id': 'AssignmentController.findOne',
  'PUT /api/assignment/:id': 'AssignmentController.updateOne',
  'DELETE /api/assignment/:id': 'AssignmentController.deleteOne',

  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/


};
