const { MongoClient } = require('mongodb');

const mongoUrl = process.env.MONGO_URL || 'mongodb://root:TravelSafe2025%21%40%23@127.0.0.1:27018/travel?authSource=admin';
const companyId = process.env.COMPANY_ID;
const smtpHost = process.env.SMTP_HOST;
const smtpEmail = process.env.SMTP_EMAIL;
const smtpPassword = process.env.SMTP_PASSWORD;

if (!companyId || !smtpHost || !smtpEmail || !smtpPassword) {
    console.error('Required environment variables: COMPANY_ID, SMTP_HOST, SMTP_EMAIL, SMTP_PASSWORD');
    process.exit(1);
}

const subject = 'Your TripZipper login code';
const html = '<div style="font-family: Arial, sans-serif; padding: 24px"><h2>Login verification</h2><p>Your OTP is <strong>[[otp]]</strong>.</p><p>This code expires in [[expiresInMinutes]] minutes.</p><p>If you did not request this code, you can ignore this email.</p></div>';

const encode = (value) => Buffer.from(value, 'utf8').toString('base64');

(async () => {
    const client = new MongoClient(mongoUrl);
    try {
        await client.connect();
        const db = client.db();
        const mailer = {
            title: 'OTP Login Mail',
            emailFunction: 'otpLogin',
            status: true,
            company: companyId,
            host: smtpHost,
            email: smtpEmail,
            password: smtpPassword,
            subject: encode(subject),
            html: encode(html),
            updatedAt: new Date(),
        };

        const result = await db.collection('mailer').findOneAndUpdate(
            { company: companyId, emailFunction: 'otpLogin' },
            { $set: mailer, $setOnInsert: { createdAt: new Date() } },
            { upsert: true, returnDocument: 'after' },
        );

        console.log(`OTP mailer is active for company ${companyId}. Mailer id: ${result.value?._id || result._id}`);
    } finally {
        await client.close();
    }
})().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
