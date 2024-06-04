var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");

module.exports = {
    secret: sails.config.jwtSettings.secret,
    issuer: sails.config.jwtSettings.issuer,
    audience: sails.config.jwtSettings.audience,

    /**
     * Hash the password field of the passed user.
     */
    hashPassword: function (user) {
        if (user.password) {
            user.password = bcrypt.hashSync(user.password);
        }
    },

    getHashPassword: function (password) {
        return bcrypt.hashSync(password);
    },

    /**
     * Compare user password hash with unhashed password
     * @returns boolean indicating a match
     */
    comparePassword: function (password, passwordEnc) {
        return bcrypt.compareSync(password, passwordEnc);
    },

    /**
     * Create a token based on the passed user
     * @param user
     */
    createToken: function (body, refresh) {
        let params = {
            algorithm: sails.config.jwtSettings.algorithm,
            expiresIn: refresh? sails.config.jwtSettings.refreshRxpiresIn : sails.config.jwtSettings.expiresIn,
            issuer: sails.config.jwtSettings.issuer,
            audience: sails.config.jwtSettings.audience
        }
        const jwtSecretKey = refresh? sails.config.jwtSettings.refreshSecret :sails.config.jwtSettings.secret
        return jwt.sign(body,jwtSecretKey,params);
    },
    decodeToken: function (tkn, refresh) {
        
        return new Promise((resolve, reject)=>{
            const jwtSecretKey = refresh? sails.config.jwtSettings.refreshSecret :sails.config.jwtSettings.secret

            try {
                var decoded=jwt.verify(tkn, jwtSecretKey);
            } catch (error) {
                return reject('Invalid refresh token');
            }

            return resolve(decoded)
        })

    },
};
