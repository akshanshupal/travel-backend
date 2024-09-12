/**
 * Site Model Schema
 *
 */

module.exports = {

    attributes: {
        title: {
            type: 'string',
            required: true
        },
        alias: {
            type: 'string',
            required: true
        },
        description: {
            type: 'string'
        },
        company: {
            model : 'company',
            required: true
        },
        featureImg: {
            type: 'string'
        },
        area: {
            model: 'area',
        },
        status: {
            type: 'boolean',
            defaultsTo: true
        },
        sqlId: {
            type: 'string'
        },
        uploaded: {
            type: 'string'
        },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' },
    },

    customToJSON: function () {
        var obj = this;
        if (obj.description) {
            let qCon = Buffer.from(obj.description, 'base64');
            obj.description = qCon.toString('utf8');
        }
        return obj;
    },
    beforeUpdate: function (values, next) {
        if (values.description && values.description.trim() != '') {
            let pCon = Buffer.from(values.description);
            values.description = pCon.toString('base64');
        }
        next();
    },
    beforeCreate: function (values, next) {
        if (values.description && values.description.trim() != '') {
            let pCon = Buffer.from(values.description);
            values.description = pCon.toString('base64');
        }
        next();
    }
};

