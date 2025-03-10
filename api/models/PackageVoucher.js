/**
 * PackageVoucher Model Schema
 *
 */

module.exports = {

    attributes: {
       
        innerHtml:{
            type: 'string'
        },
        assignmentId:{
            type: 'string'
        },
        isDefault:{
          type: 'boolean'
        },
        status: {
            type: 'boolean'
        },
        company: {
            model: 'company'
        }

    }
};
