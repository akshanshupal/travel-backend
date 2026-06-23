/**
 * isAuthenticated
 * @description :: Policy to inject user in req via JSON Web Token
 */
module.exports = async function (req, res, next) {
    if (!req.headers || !req.headers['token']) {
        return res.forbidden({ code: 'UnAuthorised', message: 'Please login!' });
    }
    console.log('authfile called')

    try {
        var tokenData = await CipherService.decodeToken(req.headers['token']);
    } catch (error) {
        console.log(error);
        return res.forbidden(error);
    }

    if (!tokenData?.user) {
        return res.forbidden({ code: 'UnAuthorised', message: 'Please login again!' });
    }
    if (tokenData.user?.type != 'ADMIN' && tokenData.user?.type != 'MANAGER' &&tokenData.user?.type != 'AGENT') {
        return res.forbidden({ code: 'Error', message: 'Not authorised!!' });
    }
    if (!tokenData.user.role) {
        tokenData.user.role = 'ROOT';
    }
    req.session.user = tokenData.user;
    next();
};
