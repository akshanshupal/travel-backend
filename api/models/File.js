module.exports = {
  attributes: {
    filename: {
      type: 'string',
      required: true
    },
    size: {
      type: 'number',
      required: true
    },
    type: {
      type: 'string',
      required: true
    },
    fd: {
      type: 'string',
      required: true
    }
  }
};