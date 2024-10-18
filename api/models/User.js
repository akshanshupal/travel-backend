/**
 * User Model Schema
 *
 */

module.exports = {

    attributes: {
        username: {
            type: 'string',
            required: true

        },
        name: {
            type: 'string',
            required: true

        },
        company: {
            model: 'company',
            required: true

        },
        email: {
            type: 'string',
            isEmail: true,
        },
        mobile: {
            type: 'string',
        },
        password: { type: 'string',  required: true},
        type: {type: 'string',  required: true}, //"ADMIN", "AGENT", "MANAGER"
        role: {
            type: 'string',
        },
        profileImg: { type: 'string' },
        isDeleted: { type: 'boolean'},
        deletedAt: { type: 'ref', columnType: 'datetime'},
        deletedBy: { model: 'user'},
        blocked: { type: 'boolean' },
        donNotHashPassword: {type: 'ref'},
        status : {type: 'boolean'},

    },
    beforeUpdate: function (user, next) {
        if (user.username) {
            user.username = user.username.trim().toLowerCase();
            // user.clientUsername=user.client+"_"+user.username;
        }
        if (user.email) {
            user.email = user.email.trim().toLowerCase();
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
    afterCreate: async function (user, proceed) {
        let key= 'user:'+user.id
        try {
            await sails.redis.pipeline().hset(key, user).expire(key, sails.config.redis.expire).exec()
            // await sails.redis.hset(key, user);
        } catch (error) {
            console.log(error);
        }
        let setvalue= await sails.redis.hgetall(key)
        console.log(setvalue,'setvalue')

        proceed();
    },
    afterUpdate: async function(user, proceed){
        let key= 'user:'+user.id
        try {
            await sails.redis.del(key)
            await sails.redis.pipeline().hset(key, user).expire(key, sails.config.redis.expire).exec()
        } catch (error) {
            console.log(error);
        }
        proceed();

    },
    afterDestroy: async function(user, proceed){
        let key= 'user:'+user.id;
        try {
            await sails.redis.DEL(key)
        } catch (error) {
            console.log(error);
        }


    }
};
