const crypto = require('crypto');

const OTP_TTL_SECONDS = 10 * 60;
const OTP_MAX_ATTEMPTS = 5;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const getOtpKey = (email, company) => `auth:otp:${company}:${email}`;
const getAttemptsKey = (email, company) => `auth:otp:attempts:${company}:${email}`;

// #region debug-point A-E:otp-request-checkpoints
const debugReport = (hypothesisId, location, msg, data = {}) => {
    const url = process.env.DEBUG_SERVER_URL || 'http://127.0.0.1:7778/event';
    const sessionId = process.env.DEBUG_SESSION_ID || 'otp-request-500';
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, runId: 'pre', hypothesisId, location, msg: `[DEBUG] ${msg}`, data, ts: Date.now() }),
    }).catch(() => {});
};
// #endregion

const getOutputUser = (user) => {
    const role = user?.type === 'ADMIN' || !user?.role
        ? null
        : {
            id: user.role.id,
            title: user.role.title,
            permissions: user.role.permissions || {},
        };

    return {
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
};

const createAuthResponse = (user) => {
    const outputUser = getOutputUser(user);
    return {
        token: CipherService.createToken({ user: outputUser }),
        refreshToken: CipherService.createToken({ user: outputUser }, 'refresh'),
        user: outputUser,
    };
};

module.exports = {
    requestOtp: async function (req, res) {
        const email = normalizeEmail(req.body.email);
        const company = req?.session?.activeCompany?.id;

        if (!email) return res.badRequest({ code: 400, message: 'Email is required.' });
        if (!company) return res.badRequest({ code: 400, message: 'Company could not be resolved.' });

        try {
            debugReport('A', 'OtpAuthController.requestOtp:entry', 'OTP request received', { hasEmail: Boolean(email), hasCompany: Boolean(company) });
            const user = await User.findOne({ email, company, isDeleted: { '!=': true } }).populate('role');
            debugReport('D', 'OtpAuthController.requestOtp:user-lookup', 'User lookup completed', { found: Boolean(user), blocked: Boolean(user?.blocked) });
            if (!user) return res.badRequest({ code: 404, message: 'No account was found for this email.' });
            if (user.blocked) return res.badRequest({ code: 401, message: 'Your account has been blocked.' });

            const [mailer] = await MailerService.find(req, {
                company,
                status: true,
                emailFunction: 'otpLogin',
            });
            debugReport('B', 'OtpAuthController.requestOtp:mailer-lookup', 'OTP mailer lookup completed', { found: Boolean(mailer), function: mailer?.emailFunction, active: mailer?.status });
            if (!mailer) return res.serverError({ code: 500, message: 'OTP email is not configured. Add an active mailer with emailFunction "otpLogin".' });

            const otp = crypto.randomInt(100000, 1000000).toString();
            const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
            const otpKey = getOtpKey(email, company);
            const attemptsKey = getAttemptsKey(email, company);

            await sails.redis.set(otpKey, otpHash, 'EX', OTP_TTL_SECONDS);
            await sails.redis.del(attemptsKey);
            debugReport('C', 'OtpAuthController.requestOtp:redis-write', 'OTP hash stored in Redis', { ttlSeconds: OTP_TTL_SECONDS });

            const subject = (mailer.subject || 'Your TripZipper login code')
                .replace(/\[\[otp\]\]/g, otp)
                .replace(/\[\[expiresInMinutes\]\]/g, '10');
            const html = (mailer.html || '<p>Your TripZipper verification code is <strong>[[otp]]</strong>.</p><p>This code expires in [[expiresInMinutes]] minutes.</p>')
                .replace(/\[\[otp\]\]/g, otp)
                .replace(/\[\[expiresInMinutes\]\]/g, '10');

            await EmailService.sendEmail(req, {
                email,
                subject,
                html,
                host: mailer.host,
                user: mailer.email,
                password: mailer.password,
            });
            debugReport('C', 'OtpAuthController.requestOtp:smtp-send', 'OTP email send completed', { host: mailer.host, hasUser: Boolean(mailer.email) });

            return res.json({ message: 'OTP sent successfully.' });
        } catch (error) {
            debugReport('E', 'OtpAuthController.requestOtp:error', 'OTP request failed', { name: error?.name, message: error?.message });
            return res.serverError(error);
        }
    },

    verifyOtp: async function (req, res) {
        const email = normalizeEmail(req.body.email);
        const otp = String(req.body.otp || '').trim();
        const company = req?.session?.activeCompany?.id;

        if (!email || !/^\d{6}$/.test(otp)) {
            return res.badRequest({ code: 400, message: 'A valid six-digit OTP is required.' });
        }
        if (!company) return res.badRequest({ code: 400, message: 'Company could not be resolved.' });

        const otpKey = getOtpKey(email, company);
        const attemptsKey = getAttemptsKey(email, company);

        try {
            const attempts = Number(await sails.redis.get(attemptsKey) || 0);
            if (attempts >= OTP_MAX_ATTEMPTS) {
                return res.forbidden({ code: 429, message: 'Too many incorrect attempts. Request a new OTP.' });
            }

            const storedHash = await sails.redis.get(otpKey);
            const submittedHash = crypto.createHash('sha256').update(otp).digest('hex');
            if (!storedHash || storedHash !== submittedHash) {
                await sails.redis.incr(attemptsKey);
                await sails.redis.expire(attemptsKey, OTP_TTL_SECONDS);
                return res.forbidden({ code: 400, message: 'Invalid or expired OTP.' });
            }

            const user = await User.findOne({ email, company, isDeleted: { '!=': true } }).populate('role');
            if (!user) return res.badRequest({ code: 404, message: 'No account was found for this email.' });
            if (user.blocked) return res.badRequest({ code: 401, message: 'Your account has been blocked.' });

            await sails.redis.del(otpKey, attemptsKey);
            return res.json(createAuthResponse(user));
        } catch (error) {
            return res.serverError(error);
        }
    },
};
