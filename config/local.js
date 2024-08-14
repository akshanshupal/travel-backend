module.exports = {
    // Any configuration settings may be overridden below, whether it's built-in Sails
    // options or custom configuration specifically for your app (e.g. Stripe, Sendgrid, etc.)
    port: 1333,
    datastores: {
        mongodbA: {
          adapter: 'sails-mongo',
          url: 'mongodb+srv://akshanshu:ashuMongo1234@cluster0.wygca.mongodb.net/travel?retryWrites=true&w=majority'
        },
    },
    models: {
        datastore: "mongodbA",
        migrate: "safe",
    },
    jwtSettings: {
        secret: "4ukI0uIVnB3iI1yxj646fVXSE3ZVk4doZgz6fTbNg7jO41EAtl20J5F7Trtwe7OM",
        refreshSecret: "4ukI0uIVnB3iI1yxj646fVXSE3ZVk4doZgz6fTbNg7jO41EAtl20J5F7Txprw7OM",
        algorithm: "HS256",
        refreshRxpiresIn: '180d', //30 days='30d'
        expiresIn: '1d',//15 mins='15m'
        issuer: "TRAVEL",
        audience: "tripbliss.com",
    },
    bunnyCDN : {
      HOSTNAME : 'sg.storage.bunnycdn.com',
      BASE_URL: 'https://storage.bunnycdn.com',
      STORAGE_ZONE_NAME : 'travelimg',
      PASSWORD : '49faa86c-ff53-471b-86bb699c3e44-8aa9-433b',
      baseUrl: "https://travelimg.b-cdn.net"
    },
    redis: {
        // url:'redis://:edukit339master@216.48.178.79:6379'
        url: "redis://127.0.0.1:6379",
        expire: 6*30*24*60*60,//6 months expiry
    },
    cdnUrl: "http://localhost:1337",
  };