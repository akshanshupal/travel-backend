module.exports.skipper = {
    gridfs: {
      adapter: require('skipper-gridfs'),
      uri: 'mongodb://localhost:27017/videoUploadDB',
      bucket: 'uploads', // Ensure this matches your configuration
      chunkSizeBytes: 255 * 1024 // Optional, defaults to 255KB
    }
  };