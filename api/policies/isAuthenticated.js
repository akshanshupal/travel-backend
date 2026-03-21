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

    if (!tokenData?.user?.id) {
        return res.forbidden({ code: 'UnAuthorised', message: 'Please login again!' });
    }

    let user;
    try {
        user = await User.findOne({ id: tokenData.user.id, isDeleted: { '!=': true } }).populate('role');
    } catch (error) {
        console.log(error);
        return res.forbidden({ code: 'UnAuthorised', message: 'Please login again!' });
    }

    if (!user) {
        return res.forbidden({ code: 'UnAuthorised', message: 'Please login again!' });
    }
    if (user.blocked) {
        return res.forbidden({ code: 'UnAuthorised', message: 'Your account has been blocked.' });
    }

    const role = user?.type === "ADMIN" || !user?.role
        ? null
        : {
            id: user.role.id,
            title: user.role.title,
            permissions: user.role.permissions || {},
        };

    req.session.user = {
        id: user.id,
        name: user.name,
        username: user.username,
        company: user.company,
        email: user.email,
        mobile: user.mobile,
        type: user.type,
        role,
        profileImg: user.profileImg,
    };
    next();
};
