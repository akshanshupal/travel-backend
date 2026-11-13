/**
 * Cross-Origin Resource Sharing (CORS) settings
 * (sails.config.cors)
 *
 * For more information, see:
 * https://sailsjs.com/docs/concepts/security/cors
 */

module.exports.cors = {

  /***************************************************************************
   *                                                                          *
   * Enable CORS for all routes                                               *
   *                                                                          *
   ***************************************************************************/
  allRoutes: true,

  /***************************************************************************
   *                                                                          *
   * Allowed origins                                                          *
   *                                                                          *
   ***************************************************************************/
  allowOrigins: ['https://tripzipper.hospitalitygroup.in', 'https://admin.urbanyatras.in'],

  /***************************************************************************
   *                                                                          *
   * Allow credentials (cookies, authorization headers)                       *
   *                                                                          *
   ***************************************************************************/
  allowCredentials: true,

  /***************************************************************************
   *                                                                          *
   * Allowed HTTP methods                                                     *
   *                                                                          *
   ***************************************************************************/
  allowMethods: 'GET, POST, PUT, DELETE, OPTIONS, HEAD',

  /***************************************************************************
   *                                                                          *
   * Allowed request headers                                                  *
   *                                                                          *
   ***************************************************************************/
  allowHeaders: 'Content-Type, Authorization, X-Requested-With, api-key, apihost, origin, x-csrf-token, Accept',

  /***************************************************************************
   *                                                                          *
   * Exposed response headers                                                 *
   *                                                                          *
   ***************************************************************************/
  allowExposedHeaders: 'Content-Range, X-Content-Range',

  /***************************************************************************
   *                                                                          *
   * Max age for preflight cache (seconds)                                    *
   *                                                                          *
   ***************************************************************************/
  maxAge: 86400

};
