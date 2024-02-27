/**
 * isAuthenticated
 * @description :: Policy to inject user in req via JSON Web Token
 */
module.exports = async function (req, res, next) {
    if (!req.headers || !req.headers['token']) {
        return res.forbidden({ code: 'UnAuthorised', message: 'Please login!' });
    }

    try {
        var tokenData = await CipherService.decodeToken(req.headers['token']);
    } catch (error) {
        console.log(error);
        return res.forbidden(error);
    }

    if (!tokenData || !tokenData.user) {
        return res.forbidden({ code: 'UnAuthorised', message: 'Please login again!' });
    }
    if (tokenData.user?.type != 'ADMIN' && tokenData.user?.type != 'STAFF' && tokenData.user?.type != 'STUDENT' && tokenData.user?.type != 'FACULTY') {
        return res.forbidden({ code: 'Error', message: 'Not authorised!!' });
    }
    if (!tokenData.user.role) {
        tokenData.user.role = 'ROOT';
    }
    req.session.user = tokenData.user;

    if (tokenData.user.role == 'ROOT') {
        next();
    } else {
        let acl = sails.redis.hgetall('acl:' + req.session.activeClient.id + ':' + tokenData.user.role);
        if (!acl) {
            return next();
        }
        const actionArr = req.options.action.split('/');
        if (acl[actionArr[0]] && (acl[actionArr[0]].all || acl[actionArr[0]][actionArr[1]])) {
            next();
        } else {
            return res.forbidden({ code: 'Not Authorised', message: 'You are not authorised for this action!' });
        }
    }
};
