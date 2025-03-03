/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */


module.exports.policies = {

  /***************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions, unless overridden.       *
  * (`true` allows public access)                                            *
  *                                                                          *
  ***************************************************************************/

  '*': ['isAuthenticated'],

  AuthController: {
      signIn: true,
      signout: true,
      refreshToken: true,
      health: true,
      getApiVersion: true,

  },

  CompanyController: {
    '*' : true
  },
  userController: {
    'create' : true
  },
  fileNewController: {
    'download' : true
  },
  SavedItineraryController: {
    'findOne' : true
  },
  HotelImageController: {
    'find' : true
  },
  HotelController: {
    'findOne' : true
  },
  hotelInfoController: {
    'find' : true
  },
  PackageTagController: {
    'find' : true,
    'findOne' : true,
  },
  PackageTypeController: {
    'find' : true,
    'findOne' : true,
  },
  LocationController: {
    'find' : true,
    'findOne' : true,
  }
};
