/**
 * Itold Model Schema
 *
 */

// api/models/Package.js
module.exports = {
    attributes: {
      area: {
        model: 'area',
      },
      title: {
        type: 'string',
      },
      sqlId: {
        type: 'string',
      },
      params: {
        type: 'json',
      },

      company: {
        model: 'company',
      },
      sites: {
        type: 'json',
        required: true,
      },
      inclusion: {
        type: 'string',
        defaultsTo: '',
      },
      exclusion: {
        type: 'string',
        defaultsTo: '',
      },
      cost: {
        type: 'number',
        defaultsTo: 0,
      },
      st: {
        type: 'number',
        defaultsTo: 0,
      },
      public: {
        type: 'boolean',
        defaultsTo: false,
      },
      status: {
        type: 'number',
        defaultsTo: 0,
      },
      created_by: {
        type: 'number',
        required: true,
      },
      sent_by: {
        type: 'number',
        required: true,
      },
    },
  };
  
