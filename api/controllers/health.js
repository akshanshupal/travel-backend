module.exports = {
  friendlyName: 'Health Check',
  description: 'Simple health check endpoint for monitoring and load balancer',
  
  exits: {
    success: {
      statusCode: 200,
      description: 'Service is healthy'
    },
    serverError: {
      statusCode: 500,
      description: 'Service is unhealthy'
    }
  },

  fn: async function (inputs, exits) {
    try {
      // Check database connection by running a simple query
      let dbConnected = false;
      let dbError = null;
      try {
        // Try to perform a simple database operation
        await sails.getDatastore('mongodbA').sendNativeQuery('db.runCommand({ping: 1})');
        dbConnected = true;
      } catch (err) {
        dbConnected = false;
        dbError = err.message;
      }
      
      // Check Redis connection
      let redisConnected = false;
      let redisError = null;
      try {
        await sails.redis.ping();
        redisConnected = true;
      } catch (err) {
        redisConnected = false;
        redisError = err.message;
      }

      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          name: 'travel',
          status: dbConnected ? 'connected' : 'disconnected',
          error: dbError
        },
        redis: {
          status: redisConnected ? 'connected' : 'disconnected', 
          error: redisError
        },
        memory: process.memoryUsage(),
        version: process.version,
        environment: process.env.NODE_ENV || 'development'
      };

      if (dbConnected && redisConnected) {
        return exits.success(health);
      } else {
        health.status = 'degraded';
        return exits.serverError(health);
      }
    } catch (error) {
      return exits.serverError({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
        database: {
          name: 'travel',
          status: 'unknown'
        }
      });
    }
  }
}; 