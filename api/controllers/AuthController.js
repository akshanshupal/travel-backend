/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
module.exports = {
    // signIn: async function (req, res) {
    //     if (!req.body.username || !req.body.password) {
    //         return res.badRequest({ code: '400', message: 'Missing username or password!' });
    //     }
    //     let un = req.body.username.trim().toLowerCase();

    //     try {
    //         var user = await User.findOne({ username: un, isDeleted: { '!=': true } });
    //     } catch (error) {
    //         return res.serverError(error);
    //     }

    //     if (!user) {
    //         return res.badRequest({ code: 404, message: 'Wrong username or password!' });
    //     }

    //     if (user.blocked) {
    //         return res.badRequest({
    //             code: 401,
    //             message: 'Your account has been blocked.',
    //         });
    //     }

    //     let passed = CipherService.comparePassword(req.body.password, user.password);
    //     if (!passed) {
    //         return res.forbidden({ code: 'Oops!', message: 'Wrong username or password!' });
    //     }
    //     const token = CipherService.createToken({
    //         user: {
    //             id: user.id,
    //             name: user.name,
    //             lastName: user.lastName,
    //             username: user.username,
    //             role: user.role,
    //             type: user?.type
    //         },
    //     });

    //     return res.json({
    //         // TODO: replace with new type of cipher service
    //         token: token,
    //         user: user,
    //     });
    // },
    signout: async function (req, res) {
        const token = req.headers['token'];
        var allowed = CipherService.decodeToken(token);
        const user = allowed.user;
        let code = 'USER_JWT:' + user.id + ':expiredOn';
        let newExpiredOn = new Date().getTime();
        // const data = sails.rediscompany.set(code, newExpiredOn);
        return res.json({ done: true });
    },
    health: async function (req, res) {
        return res.send('ok');
    },
    signin: async function(req, res) {
        let { username, password } = req.allParams(); // Assuming you're using parameters
        if (!username || !password) {
            return res.badRequest({ code: '400', message: 'Missing username or password!' });
        }
        try {
            username = username.trim().toLowerCase();

            var user = await User.findOne({ username: username, isDeleted: { '!=': true } });
            if (!user) {
                return res.badRequest({ code: 404, message: 'Wrong username or password!' });
            }
    
            if (user.blocked) {
                return res.badRequest({code: 401,message: 'Your account has been blocked.'});
            }

            let validPassword = CipherService.comparePassword(req.body.password, user.password);
            if (!validPassword) {
                return res.forbidden({ code: 400, message: 'Wrong username or password!!' });
            }
            const outputUser = {
                id: user.id,
                name: user.name,
                username: user.username,
                company: user.company,
                email: user.email,
                mobile: user.mobile,
                type: user.type,
                role: user.role,
                profileImg: user.profileImg,
            }

            
        const token = CipherService.createToken({user:outputUser});
        const refreshToken = CipherService.createToken({user:outputUser}, 'refresh');
        let companyConfig
        try{
            const [data] = await CompanyconfigService.findOne({company:outputUser.company});
            if(data){
                companyConfig = data[0]
            }
        }catch(error){
            return res.status(500).json({ error: 'Internal server error' });
        }
          
          return res.json({
            token,
            refreshToken,
            user:  outputUser,
            companyConfig: {logo: companyConfig?.logo, favicon: companyConfig?.favicon}
          });
        } catch (error) {
          return res.status(500).json({ error: 'Internal server error' });
        }
    },
    refreshToken: async function(req, res) {
        const { refreshToken } = req.allParams(); // Assuming you're sending refreshToken in the request body
        try {
            const decoded = await CipherService.decodeToken(refreshToken,'refresh');

            if(decoded){

                const token = CipherService.createToken({user:decoded.user});        
                return res.json({token});
            }
        } catch (error) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
      },
};

