/**
 * User Model Schema
 *
 */

module.exports = {

    attributes: {
        username: {
            type: 'string'
        },
        firstName: {
            type: 'string'
        },
        lastName: {
            type: 'string'
        },
        company: {
            model: 'company'
        },
        email: {
            type: 'string',
            isEmail: true,
        },
        mobile: {
            type: 'string',
        },
        password: { type: 'string' },
        role: {
            type: 'string',
        },
        profileImg: { type: 'string' },
        isDeleted: { type: 'boolean' },
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' },
        blocked: { type: 'boolean' },
        donNotHashPassword: {type: 'ref'},
        status : {type: 'boolean'},

    },
    beforeUpdate: function (values, next) {
        if (values.username) {
            values.username = values.username.trim().toLowerCase();
            // values.clientUsername=values.client+"_"+values.username;
        }
        if (values.email) {
            values.email = values.email.trim().toLowerCase();
        }

        // values.clientUsername=values.client+"_"+values.username;

        // if(values.password){
        //     CipherService.hashPassword(values);
        // }

        next();
    },
    beforeCreate: async function (values, next) {
        if (values.username) {
            values.username = values.username.trim().toLowerCase();
        }
        if (values.email) {
            values.email = values.email.trim().toLowerCase();
        }
        if (!values.donNotHashPassword) {
            CipherService.hashPassword(values);
        }


        return next();
    },
    customToJSON: function () {
        // Return a shallow copy of this record with the password removed.
        return _.omit(this, ['password']);
    },
};
