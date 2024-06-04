/**
 * Area Model Schema
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
        featureImg: {
            type: 'string',
            required: true
        },
        hotelImg: {
            type: 'string',
            allowNull: true
        },
        company: {
            model : 'company',
            required: true
        },
        description: {
            type: 'string',
            required: true

        },
        headerContent: {
            type: 'string',
            allowNull: true
        },
        footerContent: {
            type: 'string',
            allowNull: true
        },
        status: {
            type: 'boolean',
            defaultsTo: true
        },
        sqlId: {
            type: 'string'
        },
        hotelImgUploaded: {
            type: 'boolean',
        },
        featureImgUploaded: {
            type: 'boolean',
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
        if (obj.headerContent) {
            let qCon = Buffer.from(obj.headerContent, 'base64');
            obj.headerContent = qCon.toString('utf8');
        }
        if (obj.footerContent) {
            let qCon = Buffer.from(obj.footerContent, 'base64');
            obj.footerContent = qCon.toString('utf8');
        }
        return obj;
    },
    beforeUpdate: function (values, next) {
        if (values.description && values.description.trim() != '') {
            let pCon = Buffer.from(values.description);
            values.description = pCon.toString('base64');
        }
        if (values.headerContent && values.headerContent.trim() != '') {
            let pCon = Buffer.from(values.headerContent);
            values.headerContent = pCon.toString('base64');
        }
        if (values.footerContent && values.footerContent.trim() != '') {
            let pCon = Buffer.from(values.footerContent);
            values.footerContent = pCon.toString('base64');
        }
        next();
    },
    beforeCreate: function (values, next) {
        if (values.description && values.description.trim() != '') {
            let pCon = Buffer.from(values.description);
            values.description = pCon.toString('base64');
        }
        if (values.headerContent && values.headerContent.trim() != '') {
            let pCon = Buffer.from(values.headerContent);
            values.headerContent = pCon.toString('base64');
        }
        if (values.footerContent && values.footerContent.trim() != '') {
            let pCon = Buffer.from(values.footerContent);
            values.footerContent = pCon.toString('base64');
        }
        next();
    }
};

