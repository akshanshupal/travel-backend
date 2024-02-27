/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
module.exports = {
    signIn: async function (req, res) {
        if (!req.body.username || !req.body.password) {
            return res.badRequest({ code: '400', message: 'Missing username or password!' });
        }
        let un = req.body.username.trim().toLowerCase();

        try {
            var user = await User.findOne({ username: un, isDeleted: { '!=': true } });
        } catch (error) {
            return res.serverError(error);
        }

        if (!user) {
            return res.badRequest({ code: 404, message: 'Wrong username or password!' });
        }

        if (user.blocked) {
            return res.badRequest({
                code: 401,
                message: 'Your account has been blocked.',
            });
        }

        let passed = CipherService.comparePassword(req.body.password, user.password);
        if (!passed) {
            return res.forbidden({ code: 'Oops!', message: 'Wrong username or password!' });
        }
        const token = CipherService.createToken({
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                role: user.role,
            },
        });

        return res.json({
            // TODO: replace with new type of cipher service
            token: token,
            user: user,
        });
    },
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
};

