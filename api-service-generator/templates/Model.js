/**
 * <%=modelProperName%> Model Schema
 *
 */

module.exports = {

    attributes: {
        title: {
            type: 'string'
        },
        status: {
            type: 'boolean'
        },
        client: {
            model: 'client'
        }

    }
};
