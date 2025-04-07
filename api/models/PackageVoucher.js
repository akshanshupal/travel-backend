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
            model: 'assignment'
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
