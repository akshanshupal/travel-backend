/**
 * Mailer Model Schema
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
        company: {
            model: 'company'
        },
        host: {
            type: 'string'
        },
        html : {
            type: 'string'
        },
        email: {
            type: 'string'
        },
        html: {
            type: 'string'
        },
        subject: {
            type: 'string'
        },
        password: {
            type: 'string'
        },
        emailFunction: {
             type: 'string'
        }
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
        if (obj.html && isBase64(obj.html)) {
            let con = Buffer.from(obj.html, 'base64');
            obj.html = con.toString('utf8');
        }
        if (obj.subject && isBase64(obj.subject)) {
            let con = Buffer.from(obj.subject, 'base64');
            obj.subject = con.toString('utf8');
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
        if (values.html && values.html.trim() != '' && !isBase64(values.html)) {
            let pCon = Buffer.from(values.html);
            values.html = pCon.toString('base64');
        }
        if (values.subject && values.subject.trim() != '' && !isBase64(values.subject)) {
            let pCon = Buffer.from(values.subject);
            values.subject = pCon.toString('base64');
        }

        next();
    },
    beforeCreate: function (values, next) {
        if (values.html && values.html.trim() != '') {
            let pCon = Buffer.from(values.html);
            values.html = pCon.toString('base64');
        }
        if (values.subject && values.subject.trim() != '') {
            let pCon = Buffer.from(values.subject);
            values.subject = pCon.toString('base64');
        }

        next();
    }

};
