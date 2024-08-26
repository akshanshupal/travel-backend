/**
 * Itold Model Schema
 *
 */

// api/models/Package.js
module.exports = {
    attributes: {
      title: {
        type: 'string',
      },
      sqlId: {
        type: 'string',
      },
      params: {
        type: 'json',
      },
      area: {
        model: 'area',
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
        type: 'boolean',
        defaultsTo: true,
      },
      created_by: {
        type: 'number',
        required: true,
      },
      sent_by: {
        type: 'number',
        required: true,
      },
      isDeleted: { type: 'boolean'},
      deletedAt: { type: 'ref', columnType: 'datetime' },
      deletedBy: { model: 'user' }
    },
  };
  
