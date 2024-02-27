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
    createToken: function (body) {
        return jwt.sign(
            body,
            sails.config.jwtSettings.secret,
            {
                algorithm: sails.config.jwtSettings.algorithm,
                expiresIn: sails.config.jwtSettings.expiresInSecs,
                issuer: sails.config.jwtSettings.issuer,
                audience: sails.config.jwtSettings.audience,
            }
        );
    },
    decodeToken: function (tkn) {
        return new Promise((resolve, reject)=>{
            try {
                var decoded=jwt.verify(tkn, sails.config.jwtSettings.secret);
            } catch (error) {
                return reject(error);
            }

            return resolve(decoded)
        })

    },
};
