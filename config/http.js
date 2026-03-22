/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */


module.exports.http = {

  /****************************************************************************
  *                                                                           *
  * Sails/Express middleware to run for every HTTP request.                   *
  * (Only applies to HTTP requests -- not virtual WebSocket requests.)        *
  *                                                                           *
  * https://sailsjs.com/documentation/concepts/middleware                     *
  *                                                                           *
  ****************************************************************************/

  middleware: {

    /***************************************************************************
    *                                                                          *
    * The order in which middleware should be run for HTTP requests.           *
    * (This Sails app's routes are handled by the "router" middleware below.)  *
    *                                                                          *
    ***************************************************************************/

    order: [
      // 'cookieParser',
      // 'session',
      'bodyParser',
      'parseCompany',
      'captureAccessContext',
      // 'setSessionUser',
      'compress',
      // 'poweredBy',
      'router',
      'www',
      // 'favicon',
    ],

    parseCompany: async function (req, res, next) {
      console.log('new req', req.url);
      if (req && req.headers && req.headers['api-key']) {
          let clientApiKey = req.headers['api-key'];
          let companyConfig
          try {
            companyConfig = await CompanyconfigService.find(req, {apiKey: clientApiKey});
          } catch (error) {
            return res.send(404, 'Sorry, No website found!'); 
          }
          if(!(companyConfig && companyConfig.length)){
            return res.send(404, 'Company not registered!'); 
          }
          let method = req.method;
          if (method === 'GET') {
              req.query = {...req.query,  company: companyConfig[0].company };
          } else {
              if (!Array.isArray(req.body)) {
                  req.body = {...req.body,  company: companyConfig[0].company };
              }
          }
          // clientConfig.path = path.resolve(__dirname, '../clients/' + clientConfig.publicDir);
          sails.activeClient = companyConfig[0].client;
          return next();
      } else if ((req && req.method === 'OPTIONS') || req.url === '/api/health' || (req.url && req.url.includes("/api/file/download/"))) {
          return next();
      } else if (req && req.headers && (req.headers.origin || req.headers.apihost)) {
          let url;
          if (req.headers.apihost) {
              url = new URL(req.headers.apihost);
          } else if (req.headers.origin) {
              url = new URL(req.headers.origin);
          }
          const hostname = url.hostname;
          console.log('hostname', hostname);
           var hostCompany
          try {
            hostCompany = await sails.redis.hgetall('host:' + hostname + ':company');
          } catch (error) {
              return res.status(403).send(error);
          }
          let method = req.method;
          if (hostCompany && hostCompany.reqHost === hostname) {
              if (method === 'GET') {
                  req.query = {...req.query, company: hostCompany.id};
              } else {
                  if (!Array.isArray(req.body)) {
                    req.body = {...req.body, company: hostCompany.id};
                  }
              }
              if(!req.session) {
                    req.session = {};
                }
              req.session.activeCompany = hostCompany;

              return next();
          } else {
              let companyConfig;
              try {
                [companyConfig] = await CompanyconfigService.find(req, {websiteUrls: hostname}, {pagination: {limit:1}, populate:['company']});
              } catch (error) {
                  return res.status(403).send(error);
              }
              if (!companyConfig) return res.status(404).send('No website found!!');
              let cacheConf = {...companyConfig};
              delete cacheConf.id
              cacheConf.id = cacheConf.company.id.toString();
              cacheConf.name = cacheConf.company.name;
              delete cacheConf.company
              cacheConf.host = hostname
    
              try {
                  await sails.redis.hset('host:' + hostname + ':company', cacheConf);
              } catch (error) {
                  console.log(error);
                  return res.status(403).send(error);
              }
              if(!req.session) {
                req.session = {};
                }
              req.session.activeCompany = cacheConf;
              let method = req.method;
              if (method === 'GET') {
                  req.query = {...req.query,  company: companyConfig.company.id };
              } else {
                  if (!Array.isArray(req.body)) {
                      req.body = {...req.body,  company: companyConfig.company.id };
                  }
              }
              return next();
          }
      } else {
          return res.status(403).send({ code: '403', message: 'Not authorised!' });
      }
  },

    captureAccessContext: function (req, res, next) {
      const query = (req && req.query) ? req.query : null;
      const body = (req && req.body && !Array.isArray(req.body)) ? req.body : null;
      const ctx = {};

      if (query) {
        if (query.accessMode) ctx.accessMode = query.accessMode;
        if (query.accessResource) ctx.accessResource = query.accessResource;
        if (query.accessAction) ctx.accessAction = query.accessAction;
        if (query.accessPath) ctx.accessPath = query.accessPath;

        if (query.accessMode) delete query.accessMode;
        if (query.accessResource) delete query.accessResource;
        if (query.accessAction) delete query.accessAction;
        if (query.accessPath) delete query.accessPath;
      }

      if (body) {
        if (body.accessMode && !ctx.accessMode) ctx.accessMode = body.accessMode;
        if (body.accessResource && !ctx.accessResource) ctx.accessResource = body.accessResource;
        if (body.accessAction && !ctx.accessAction) ctx.accessAction = body.accessAction;
        if (body.accessPath && !ctx.accessPath) ctx.accessPath = body.accessPath;

        if (body.accessMode) delete body.accessMode;
        if (body.accessResource) delete body.accessResource;
        if (body.accessAction) delete body.accessAction;
        if (body.accessPath) delete body.accessPath;
      }

      if (Object.keys(ctx).length) {
        req.accessContext = ctx;
      }

      return next();
    },


    /***************************************************************************
    *                                                                          *
    * The body parser that will handle incoming multipart HTTP requests.       *
    *                                                                          *
    * https://sailsjs.com/config/http#?customizing-the-body-parser             *
    *                                                                          *
    ***************************************************************************/

    // bodyParser: (function _configureBodyParser(){
    //   var skipper = require('skipper');
    //   var middlewareFn = skipper({ strict: true });
    //   return middlewareFn;
    // })(),

  },

};
