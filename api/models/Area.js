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
        function isBase64(str) {
            try {
                return btoa(atob(str)) === str;
            } catch (err) {
                return false;
            }
        }
        var obj = this;
        if (obj.description && isBase64(obj.description)) {
            let con = Buffer.from(obj.description, 'base64');
            obj.description = con.toString('utf8');
        }
        if (obj.headerContent && isBase64(obj.headerContent)) {
            let con = Buffer.from(obj.headerContent, 'base64');
            obj.headerContent = con.toString('utf8');
        }
        if (obj.footerContent && isBase64(obj.footerContent)) {
            let con = Buffer.from(obj.footerContent, 'base64');
            obj.footerContent = con.toString('utf8');
        }
        return obj;
    },
    beforeUpdate: function (values, next) {
        function isBase64(str) {
            try {
                return btoa(atob(str)) === str;
            } catch (err) {
                return false;
            }
        }
        if (values.description && values.description.trim() != '' && !isBase64(values.description)) {
            let pCon = Buffer.from(values.description);
            values.description = pCon.toString('base64');
        }
        if (values.headerContent && values.headerContent.trim() != '' && !isBase64(values.headerContent)) {
            let pCon = Buffer.from(values.headerContent);
            values.headerContent = pCon.toString('base64');
        }
        if (values.footerContent && values.footerContent.trim() != '' && !isBase64(values.footerContent)) {
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

