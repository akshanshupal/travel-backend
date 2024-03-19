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

  'GET /api/health': 'AuthController.health',
  'GET /api/i/version': 'AuthController.getApiVersion',


  'POST /api/file/upload': 'FileController.uploadFile',
  'POST /api/file/delete': 'FileController.deleteFile',
 

  'POST /api/user': 'UserController.create',
  'GET /api/user': 'UserController.find',
  'GET /api/user/:id': 'UserController.findOne',
  'PUT /api/user/:id': 'UserController.updateOne',
  'DELETE /api/user/:id': 'UserController.deleteOne',

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
