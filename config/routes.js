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

  'POST /api/auth/signin': 'AuthController.signin',
  'POST /api/auth/request-otp': 'OtpAuthController.requestOtp',
  'POST /api/auth/verify-otp': 'OtpAuthController.verifyOtp',
  
  'POST /api/auth/signout': 'AuthController.signout',
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

  'POST /api/role': 'RoleController.create',
  'GET /api/role': 'RoleController.find',
  'GET /api/role/:id': 'RoleController.findOne',
  'PUT /api/role/:id': 'RoleController.updateOne',
  'DELETE /api/role/:id': 'RoleController.deleteOne',

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
  'POST /api/site/duplicate': 'siteController.duplicate',
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
  'GET /api/hotel/export-no-hotel-image': 'HotelController.exportNoHotelImageCsv',
  'GET /api/hotel/:id': 'HotelController.findOne',
  'PUT /api/hotel/:id': 'HotelController.updateOne',
  'DELETE /api/hotel/:id': 'HotelController.deleteOne',

  'POST /api/hotelimage': 'HotelImageController.create',
  'GET /api/hotelimage': 'HotelImageController.find',
  'GET /api/hotelimage/:id': 'HotelImageController.findOne',
  'PUT /api/hotelimage/:id': 'HotelImageController.updateOne',
  'DELETE /api/hotelimage/:id': 'HotelImageController.deleteOne',

  'POST /api/itinerary': 'ItineraryController.create',
  'POST /api/itinerary/duplicate': 'ItineraryController.duplicate',
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
  'GET /api/package-by-url/:url': 'PackageController.findByUrl',
  'GET /api/package/:id': 'PackageController.findOne',
  'PUT /api/package/:id': 'PackageController.updateOne',
  'DELETE /api/package/:id': 'PackageController.deleteOne',



  'POST /api/bookingstype': 'BookingsTypeController.create',
  'GET /api/bookingstype': 'BookingsTypeController.find',
  'GET /api/bookingstype/:id': 'BookingsTypeController.findOne',
  'PUT /api/bookingstype/:id': 'BookingsTypeController.updateOne',
  'DELETE /api/bookingstype/:id': 'BookingsTypeController.deleteOne',

  'POST /api/packagebooking': 'PackageBookingController.create',
  'POST /api/packagebooking/send-sms': 'PackageBookingController.sendSms',
  'GET /api/packagebooking': 'PackageBookingController.find',
  'GET /api/packagebooking/:id': 'PackageBookingController.findOne',
  'PUT /api/packagebooking/:id': 'PackageBookingController.updateOne',
  'DELETE /api/packagebooking/:id': 'PackageBookingController.deleteOne',

  'POST /api/clientitinerary': 'ClientItineraryController.create',
  'GET /api/clientitinerary': 'ClientItineraryController.find',
  'GET /api/clientitinerary/:id': 'ClientItineraryController.findOne',
  'GET /api/client-itinerary/agent-wise-summary': 'ClientItineraryController.agentWiseClientItineraries',
  'GET /api/client-itinerary/agent-duration-wise-summary': 'ClientItineraryController.agentDurationWiseClientItineraries',
  'PUT /api/clientitinerary/:id': 'ClientItineraryController.updateOne',
  'DELETE /api/clientitinerary/:id': 'ClientItineraryController.deleteOne',

  'POST /api/vendor': 'VendorController.create',
  'GET /api/vendor': 'VendorController.find',
  'GET /api/vendor/:id': 'VendorController.findOne',
  'PUT /api/vendor/:id': 'VendorController.updateOne',
  'DELETE /api/vendor/:id': 'VendorController.deleteOne',

  'POST /api/saved-itinerary': 'SavedItineraryController.create',
  'POST /api/saved-itinerary/send-itinerary/:id': 'SavedItineraryController.sendItineraryMail',
  'GET /api/saved-itinerary': 'SavedItineraryController.find',
  'GET /api/saved-itinerary/:id': 'SavedItineraryController.findOne',
  'GET /api/saved-itinerary/agent-wise-saved-itinerary': 'SavedItineraryController.agentWiseSavedItineraries',
  'GET /api/saved-itinerary/agent-duration-wise-saved-itinerary': 'SavedItineraryController.agentDurationWiseSavedItineraries',
  'PUT /api/saved-itinerary/:id': 'SavedItineraryController.updateOne',
  'DELETE /api/saved-itinerary/:id': 'SavedItineraryController.deleteOne',


  'POST /api/mailtemplate': 'MailTemplateController.create',
  'GET /api/mailtemplate': 'MailTemplateController.find',
  'GET /api/mailtemplate/:id': 'MailTemplateController.findOne',
  'PUT /api/mailtemplate/:id': 'MailTemplateController.updateOne',
  'DELETE /api/mailtemplate/:id': 'MailTemplateController.deleteOne',

  'POST /api/assignment': 'AssignmentController.create',
  'GET /api/assignment': 'AssignmentController.find',
  'GET /api/assignment/:id': 'AssignmentController.findOne',
  'GET /api/assignment/agent-wise-summary': 'AssignmentController.agentWiseSummary',
  'GET /api/assignment/finished-package-wise-summary': 'AssignmentController.finishedPackageWiseSummary',
  'GET /api/assignment/profit-reports': 'AssignmentController.profitReports',
  'GET /api/assignment/agent-duration-wise-summary': 'AssignmentController.agentDurationWiseSummary',
  'POST /api/assignment/send-assignmentMail/:id': 'AssignmentController.sendAssignmentMail',
  'POST /api/mail/send-welcome-mail/:id': 'AssignmentController.sendWelcomeMail',
  'PUT /api/assignment/verify/:id': 'AssignmentController.verifyAssignment',
  'PUT /api/assignment/finished/:id': 'AssignmentController.finishedAssignment',
  'PUT /api/assignment/bookingStatus/:id': 'AssignmentController.bookingStatus',
  'PUT /api/assignment/adjustment/:id': 'AssignmentController.adjustment',
  'PUT /api/assignment/paymentStatus/:id': 'AssignmentController.paymentStatus',
  'PUT /api/assignment/:id': 'AssignmentController.updateOne',
  'DELETE /api/assignment/:id': 'AssignmentController.deleteOne',
  'DELETE /api/assignment/adjustment/:id': 'AssignmentController.adjustmentDeleteOne',


  'POST /api/sendmail': 'SendmailController.create',
  'GET /api/sendmail': 'SendmailController.find',
  'GET /api/sendmail/:id': 'SendmailController.findOne',
  'GET /api/sendmail/agent-wise-send-mails': 'SendmailController.agentWiseSendMails',
  'GET /api/sendmail/agent-duration-wise-send-mails': 'SendmailController.agentDurationWiseSendMails',
  'PUT /api/sendmail/:id': 'SendmailController.updateOne',
  'DELETE /api/sendmail/:id': 'SendmailController.deleteOne',


  'POST /api/generaldata': 'GeneralDataController.create',
  'GET /api/generaldata': 'GeneralDataController.find',
  'GET /api/generaldata/:id': 'GeneralDataController.findOne',
  'PUT /api/generaldata/:id': 'GeneralDataController.updateOne',
  'DELETE /api/generaldata/:id': 'GeneralDataController.deleteOne',

  'GET /api/custom-columns': 'DataController.findCustomColumn',
  'PUT /api/custom-columns': 'DataController.saveCustomColumn',


  'POST /api/payments': 'PaymentsController.create',
  'GET /api/payments': 'PaymentsController.find',
  'GET /api/payments/summary': 'PaymentsController.getSummary',
  'GET /api/payments/:id': 'PaymentsController.findOne',
  'GET /api/payments/agent-wise-payments': 'PaymentsController.agentWisePayments',
  'GET /api/payments/receipt/:id': 'PaymentsController.getReceipt',
  'POST /api/payments/receipt-mail/:id': 'PaymentsController.sendPaymentReceiptMail',
  'POST /api/payments-reminder/:id': 'PaymentsController.sendPaymentReminderMail',
  'POST /api/payments-delete-multi': 'PaymentsController.multiPaymentsDelete',
  'PUT /api/payments/:id': 'PaymentsController.updateOne',
  'DELETE /api/payments/:id': 'PaymentsController.deleteOne',
  

  'POST /api/reports': 'ReportsController.create',
  'GET /api/reports': 'ReportsController.find',
  'GET /api/lead-dashboard': 'ReportsController.leadDashboard',
  'POST /api/lead-dashboard/pins': 'ReportsController.pinCampaign',
  'GET /api/reports/lead-funnel': 'ReportsController.leadFunnel',
  'GET /api/reports/all-agent-performance': 'ReportsController.allAgentPerformance',
  'GET /api/reports/campaign/:id/dashboard': 'ReportsController.campaignDashboard',
  'GET /api/campaign/:id/dashboard': 'ReportsController.campaignDashboard',
  'GET /api/lead-reports/funnel': 'ReportsController.leadFunnel',
  'GET /api/lead-reports/agents': 'ReportsController.allAgentPerformance',
  'GET /api/reports/:id': 'ReportsController.findOne',
  'PUT /api/reports/:id': 'ReportsController.updateOne',
  'DELETE /api/reports/:id': 'ReportsController.deleteOne',

  'POST /api/paymentstore': 'PaymentStoreController.create',
  'GET /api/paymentstore': 'PaymentStoreController.find',
  'GET /api/paymentstore/:id': 'PaymentStoreController.findOne',
  'PUT /api/paymentstore/:id': 'PaymentStoreController.updateOne',
  'DELETE /api/paymentstore/:id': 'PaymentStoreController.deleteOne',

  'POST /api/location': 'LocationController.create',
  'GET /api/location': 'LocationController.find',
  'GET /api/location/:id': 'LocationController.findOne',
  'PUT /api/location/:id': 'LocationController.updateOne',
  'DELETE /api/location/:id': 'LocationController.deleteOne',

  'POST /api/packagetype': 'PackageTypeController.create',
  'GET /api/packagetype': 'PackageTypeController.find',
  'GET /api/packagetype/:id': 'PackageTypeController.findOne',
  'PUT /api/packagetype/:id': 'PackageTypeController.updateOne',
  'DELETE /api/packagetype/:id': 'PackageTypeController.deleteOne',

  'POST /api/packagetag': 'PackageTagController.create',
  'GET /api/packagetag': 'PackageTagController.find',
  'GET /api/packagetag/:id': 'PackageTagController.findOne',
  'PUT /api/packagetag/:id': 'PackageTagController.updateOne',
  'DELETE /api/packagetag/:id': 'PackageTagController.deleteOne',

  'POST /api/packagevoucher': 'PackageVoucherController.create',
  'GET /api/packagevoucher': 'PackageVoucherController.find',
  'GET /api/packagevoucher/:id': 'PackageVoucherController.findOne',
  'POST /api/packagevoucher/send-paymentVoucher/:id': 'PackageVoucherController.sendPaymentVoucherMail',
  'PUT /api/packagevoucher/:id': 'PackageVoucherController.updateOne',
  'DELETE /api/packagevoucher/:id': 'PackageVoucherController.deleteOne',

  //not in use

  'POST /api/settings': 'SettingsController.create',
  'GET /api/settings': 'SettingsController.find',
  'GET /api/settings/:id': 'SettingsController.findOne',
  'PUT /api/settings/:id': 'SettingsController.updateOne',
  'DELETE /api/settings/:id': 'SettingsController.deleteOne',
   
  //not in use

  'POST /api/mailer': 'MailerController.create',
  'GET /api/mailer': 'MailerController.find',
  'GET /api/mailer/:id': 'MailerController.findOne',
  'PUT /api/mailer/:id': 'MailerController.updateOne',
  'DELETE /api/mailer/:id': 'MailerController.deleteOne',
  
  // Lead Api start 
  'POST /api/pipeline': 'PipelineController.create',
  'GET /api/pipeline': 'PipelineController.find',
  'GET /api/pipeline/:id': 'PipelineController.findOne',
  'PUT /api/pipeline/:id': 'PipelineController.updateOne',
  'DELETE /api/pipeline/:id': 'PipelineController.deleteOne',

  'POST /api/campaign': 'CampaignController.create',
  'GET /api/campaign': 'CampaignController.find',
  'GET /api/campaign/:id': 'CampaignController.findOne',
  'PUT /api/campaign/:id': 'CampaignController.updateOne',
  'PUT /api/campaign/pause': 'CampaignController.pauseFunction',
  'DELETE /api/campaign/:id': 'CampaignController.deleteOne',
  'POST /api/campaign/:id/copy': 'CampaignController.copy',

  'GET /api/campaign-logs': 'CampaignLogController.find',
  'GET /api/campaign-logs/:id': 'CampaignLogController.findOne',

  'GET /api/lead-logs': 'LeadLogController.find',
  'GET /api/lead-logs/:id': 'LeadLogController.findOne',

  'POST /api/leads': 'LeadsController.create',
  'POST /api/leads/bulk': 'LeadsController.bulk',
  'GET /api/leads': 'LeadsController.find',
  'GET /api/leads/:id': 'LeadsController.findOne',
  'PUT /api/leads/:id': 'LeadsController.updateOne',
  'PUT /api/leads/:id/stage': 'LeadsController.transitionStage',
  'DELETE /api/leads/:id': 'LeadsController.deleteOne',

  'POST /api/contact-property': 'ContactPropertyController.create',
  'GET /api/contact-property': 'ContactPropertyController.find',
  'GET /api/contact-property/:id': 'ContactPropertyController.findOne',
  'PUT /api/contact-property/:id': 'ContactPropertyController.updateOne',
  'DELETE /api/contact-property/:id': 'ContactPropertyController.deleteOne',
  'POST /api/lead-contact-properties': 'ContactPropertyController.create',
  'GET /api/lead-contact-properties': 'ContactPropertyController.find',
  'GET /api/lead-contact-properties/:id': 'ContactPropertyController.findOne',
  'PUT /api/lead-contact-properties/:id': 'ContactPropertyController.updateOne',
  'DELETE /api/lead-contact-properties/:id': 'ContactPropertyController.deleteOne',

  'POST /api/lead-follow-up': 'LeadFollowUpController.create',
  'GET /api/lead-follow-up': 'LeadFollowUpController.find',
  'GET /api/lead-follow-up/:id': 'LeadFollowUpController.findOne',
  'PUT /api/lead-follow-up/:id': 'LeadFollowUpController.updateOne',
  'DELETE /api/lead-follow-up/:id': 'LeadFollowUpController.deleteOne',
  'POST /api/lead-follow-ups': 'LeadFollowUpController.create',
  'GET /api/lead-follow-ups': 'LeadFollowUpController.find',
  'GET /api/lead-follow-ups/:id': 'LeadFollowUpController.findOne',
  'PUT /api/lead-follow-ups/:id': 'LeadFollowUpController.updateOne',
  'DELETE /api/lead-follow-ups/:id': 'LeadFollowUpController.deleteOne',

  'GET /api/dial/queue': 'DialController.queue',
  'GET /api/dial/queue/summary': 'DialController.summary',
  'POST /api/dial/call-logs': 'DialController.createCallLog',
  'GET /api/dial/call-logs': 'DialController.callLogs',
  'GET /api/dial/call-logs/:id': 'DialController.callLog',
  'PUT /api/dial/call-logs/:id': 'DialController.updateCallLog',
  'DELETE /api/dial/call-logs/:id': 'DialController.deleteCallLog',
  'POST /api/dial/tasks': 'DialController.createTask',
  'GET /api/dial/tasks': 'DialController.tasks',
  'GET /api/dial/tasks/:id': 'DialController.task',
  'PUT /api/dial/tasks/:id': 'DialController.updateTask',
  'DELETE /api/dial/tasks/:id': 'DialController.deleteTask',
  'POST /api/dial/tasks/:id/assign-to-me': 'DialController.assignTask',
  'PUT /api/dial/tasks/:id/complete': 'DialController.completeTask',
  'GET /api/dial/reports': 'DialController.reports',
  'GET /api/dial/campaigns': 'DialController.campaigns',
  'GET /api/dial/campaigns/:id': 'DialController.campaigns',
  'GET /api/dial/walk-in-leads': 'DialController.walkInLeads',
  'POST /api/dial/walk-in-leads': 'DialController.createWalkInLead',
  'GET /api/dial/walk-in-leads/:id': 'DialController.walkInLead',
  'PUT /api/dial/walk-in-leads/:id': 'DialController.updateWalkInLead',
  'DELETE /api/dial/walk-in-leads/:id': 'DialController.deleteWalkInLead',
  'POST /api/dial/walk-in-leads/:id/assign': 'DialController.assignWalkInLead',
  'POST /api/dial/walk-in-leads/:id/convert': 'DialController.convertWalkInLead',
  'POST /api/dial/walk-in-leads/:id/call-logs': 'DialController.createWalkInCallLog',

  'POST /api/enquiry': 'EnquiryController.create',
  'POST /api/enquiry/:id/convert-to-lead': 'EnquiryController.convertToLead',
  'GET /api/enquiry': 'EnquiryController.find',
  'GET /api/enquiry/:id': 'EnquiryController.findOne',
  'PUT /api/enquiry/:id': 'EnquiryController.updateOne',

  // Photography estimate APIs
  'POST /api/photography-client': 'PhotographyClientController.create',
  'GET /api/photography-client': 'PhotographyClientController.find',
  'GET /api/photography-client/:id': 'PhotographyClientController.findOne',
  'PUT /api/photography-client/:id': 'PhotographyClientController.updateOne',
  'POST /api/photography-estimate': 'PhotographyEstimateController.create',
  'GET /api/photography-estimate': 'PhotographyEstimateController.find',
  'GET /api/photography-estimate/:id': 'PhotographyEstimateController.findOne',
  'PUT /api/photography-estimate/:id': 'PhotographyEstimateController.updateOne',
  'POST /api/photography-booking/convert/:id': 'PhotographyBookingController.convertEstimate',
  'POST /api/photography-booking': 'PhotographyBookingController.create',
  'GET /api/photography-booking': 'PhotographyBookingController.find',
  'GET /api/photography-booking/:id': 'PhotographyBookingController.findOne',
  'PUT /api/photography-booking/:id': 'PhotographyBookingController.updateOne',
  'POST /api/photography-payment': 'PhotographyPaymentController.create',
  'GET /api/photography-payment': 'PhotographyPaymentController.find',
  'GET /api/photography-payment/receipt/:id': 'PhotographyPaymentController.getReceipt',
  'GET /api/photography-payment/:id': 'PhotographyPaymentController.findOne',
  'PUT /api/photography-payment/:id': 'PhotographyPaymentController.updateOne',
  'DELETE /api/photography-payment/:id': 'PhotographyPaymentController.deleteOne',
  'POST /api/photography-deliverable': 'PhotographyDeliverableController.create',
  'GET /api/photography-deliverable': 'PhotographyDeliverableController.find',
  'GET /api/photography-deliverable/:id': 'PhotographyDeliverableController.findOne',
  'PUT /api/photography-deliverable/:id': 'PhotographyDeliverableController.updateOne',
  'DELETE /api/photography-deliverable/:id': 'PhotographyDeliverableController.deleteOne',

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
