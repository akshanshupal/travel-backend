const normalizePk = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "object") {
        if (typeof value.toHexString === "function") return value.toHexString();
        if (value._id) return normalizePk(value._id);
        if (value.id) return normalizePk(value.id);
    }
    return String(value);
};

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const resolvePaymentStatus = (pendingAmount, basePendingAmount = null) => {
    if (pendingAmount < 0) return "extra";
    if (pendingAmount === 0) return "paid";
    if (pendingAmount > 0) {
        if (basePendingAmount !== null && pendingAmount >= basePendingAmount) return "pending";
        return "partial";
    }
    return "pending";
};

const updateBookingPending = async (bookingId, deltaAmount = 0) => {
    const booking = await PhotographyBooking.findOne({ id: bookingId, isDeleted: { "!=": true } });
    if (!booking) return null;
    const nextPending = toNumber(booking.pendingAmount) - toNumber(deltaAmount);
    const basePending = toNumber(booking.totalAmount) - toNumber(booking.tokenAmount);
    const paymentStatus = resolvePaymentStatus(nextPending, basePending);
    return await PhotographyBooking.updateOne({ id: booking.id }).set({ pendingAmount: nextPending, paymentStatus });
};

const enrichPayments = async (records = []) => {
    const bookingIds = [...new Set(records.map((item) => normalizePk(item.photographyBooking)).filter(Boolean))];
    const clientIds = [...new Set(records.map((item) => normalizePk(item.client)).filter(Boolean))];
    const agentIds = [...new Set(records.map((item) => normalizePk(item.agent)).filter(Boolean))];
    const paymentStoreIds = [...new Set(records.map((item) => normalizePk(item.paymentStore)).filter(Boolean))];

    const [bookings, clients, agents, paymentStores] = await Promise.all([
        bookingIds.length ? PhotographyBooking.find({ where: { id: bookingIds }, select: ["id", "bookingNumber", "totalAmount", "pendingAmount"] }) : [],
        clientIds.length ? PhotographyClient.find({ where: { id: clientIds } }) : [],
        agentIds.length ? User.find({ where: { id: agentIds }, select: ["id", "name", "email", "mobile", "type"] }) : [],
        paymentStoreIds.length ? PaymentStore.find({ where: { id: paymentStoreIds } }) : [],
    ]);

    const bookingMap = bookings.reduce((acc, item) => {
        acc[String(item.id)] = item;
        return acc;
    }, {});
    const clientMap = clients.reduce((acc, item) => {
        acc[String(item.id)] = item;
        return acc;
    }, {});
    const agentMap = agents.reduce((acc, item) => {
        acc[String(item.id)] = item;
        return acc;
    }, {});
    const paymentStoreMap = paymentStores.reduce((acc, item) => {
        acc[String(item.id)] = item;
        return acc;
    }, {});

    return records.map((record) => ({
        ...record,
        photographyBooking: bookingMap[normalizePk(record.photographyBooking)] || record.photographyBooking,
        client: clientMap[normalizePk(record.client)] || record.client,
        agent: agentMap[normalizePk(record.agent)] || record.agent,
        paymentStore: paymentStoreMap[normalizePk(record.paymentStore)] || record.paymentStore,
    }));
};

module.exports = {
    find: function (ctx, filter = {}, params = {}) {
        return new Promise(async (resolve, reject) => {
            const where = { ...filter };
            const company = normalizePk(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id);
            if (company) where.company = company;
            if (!where.hasOwnProperty("isDeleted")) where.isDeleted = { "!=": true };
            if (where.photographyBooking) where.photographyBooking = normalizePk(where.photographyBooking);
            if (where.client) where.client = normalizePk(where.client);
            if (where.agent) where.agent = normalizePk(where.agent);
            if (where.from || where.to) {
                const dateFilter = {};
                if (where.from) dateFilter[">="] = sails.dayjs(where.from).startOf("day").toDate();
                if (where.to) dateFilter["<="] = sails.dayjs(where.to).endOf("day").toDate();
                where.paymentDate = dateFilter;
                delete where.from;
                delete where.to;
            }

            const page = Number(params?.pagination?.page || 1) || 1;
            let limit = Number(params?.pagination?.limit || 10) || 10;
            if (String(params?.pagination?.limit || "").toLowerCase() === "all") limit = 0;

            const query = { where, sort: "createdAt DESC" };
            if (limit > 0) {
                query.skip = (page - 1) * limit;
                query.limit = limit;
            }

            try {
                const records = await PhotographyPayment.find(query);
                const merged = await enrichPayments(records);
                if (params.totalCount) {
                    const totalCount = await PhotographyPayment.count(where);
                    return resolve({ data: merged, totalCount });
                }
                return resolve(merged);
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },

    create: function (ctx, data) {
        return new Promise(async (resolve, reject) => {
            const payload = { ...(data || {}) };
            payload.photographyBooking = normalizePk(payload.photographyBooking);
            payload.company = normalizePk(payload.company || ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id);
            payload.amount = toNumber(payload.amount);
            payload.paymentStore = normalizePk(payload.paymentStore);
            payload.paymentDate = payload.paymentDate ? new Date(payload.paymentDate) : new Date();
            payload.remarks = String(payload.remarks || "");

            if (!payload.photographyBooking) return reject({ statusCode: 400, error: { message: "Booking is required!" } });
            if (!payload.company) return reject({ statusCode: 400, error: { message: "Company is required!" } });
            if (!payload.amount || payload.amount <= 0) return reject({ statusCode: 400, error: { message: "Amount should be greater than 0" } });

            try {
                const booking = await PhotographyBooking.findOne({ id: payload.photographyBooking, isDeleted: { "!=": true } });
                if (!booking) return reject({ statusCode: 404, error: { message: "Booking not found" } });
                if (toNumber(payload.amount) > toNumber(booking.pendingAmount)) {
                    return reject({ statusCode: 400, error: { message: "Payment amount cannot be greater than pending amount" } });
                }
                if (payload.paymentStore) {
                    const paymentStore = await PaymentStore.findOne({
                        id: payload.paymentStore,
                        company: payload.company,
                        module: "photography",
                    });
                    if (!paymentStore) {
                        return reject({ statusCode: 400, error: { message: "Invalid photography payment store selected" } });
                    }
                }

                payload.client = normalizePk(payload.client || booking.client);
                payload.agent = normalizePk(payload.agent || booking.agent);

                await sails.redis.setnx("photography:payment:receipt:seq", 90000);
                const receiptSeq = await sails.redis.incr(`photography:payment:receipt:seq:${payload.company}`);
                const prefix = String(ctx?.session?.activeCompany?.paymentReceiptPrefix || "TZ");
                payload.receiptNo = payload.receiptNo || `${prefix}PH${String(receiptSeq).padStart(6, "0")}`;

                const created = await PhotographyPayment.create(payload).fetch();
                await updateBookingPending(booking.id, created.amount);
                return resolve({ data: created });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },

    findOne: function (ctx, id) {
        return new Promise(async (resolve, reject) => {
            const where = { id, isDeleted: { "!=": true } };
            const company = normalizePk(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id);
            if (company) where.company = company;
            try {
                const record = await PhotographyPayment.findOne(where);
                if (!record) return reject({ statusCode: 404, error: { message: "Payment not found" } });
                const [merged] = await enrichPayments([record]);
                return resolve({ data: merged });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },

    updateOne: function (ctx, id, data) {
        return new Promise(async (resolve, reject) => {
            const where = { id, isDeleted: { "!=": true } };
            const company = normalizePk(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id);
            if (company) where.company = company;
            const payload = { ...(data || {}) };
            if (payload.hasOwnProperty("amount")) payload.amount = toNumber(payload.amount);
            if (payload.paymentDate) payload.paymentDate = new Date(payload.paymentDate);
            if (payload.paymentStore) payload.paymentStore = normalizePk(payload.paymentStore);

            try {
                const oldRecord = await PhotographyPayment.findOne(where);
                if (!oldRecord) return reject({ statusCode: 404, error: { message: "Payment not found" } });
                const booking = await PhotographyBooking.findOne({ id: oldRecord.photographyBooking, isDeleted: { "!=": true } });
                if (!booking) return reject({ statusCode: 404, error: { message: "Booking not found" } });

                if (payload.hasOwnProperty("amount")) {
                    const diff = toNumber(payload.amount) - toNumber(oldRecord.amount);
                    if (diff > 0 && diff > toNumber(booking.pendingAmount)) {
                        return reject({ statusCode: 400, error: { message: "Updated amount exceeds pending amount" } });
                    }
                }
                if (payload.paymentStore) {
                    const paymentStore = await PaymentStore.findOne({
                        id: payload.paymentStore,
                        company,
                        module: "photography",
                    });
                    if (!paymentStore) {
                        return reject({ statusCode: 400, error: { message: "Invalid photography payment store selected" } });
                    }
                }

                const updated = await PhotographyPayment.updateOne(where).set(payload);
                if (!updated) return reject({ statusCode: 404, error: { message: "Payment not found" } });
                const adjustment = toNumber(updated.amount) - toNumber(oldRecord.amount);
                if (adjustment !== 0) await updateBookingPending(oldRecord.photographyBooking, adjustment);
                return resolve({ data: updated });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },

    deleteOne: function (ctx, id) {
        return new Promise(async (resolve, reject) => {
            const where = { id, isDeleted: { "!=": true } };
            const company = normalizePk(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id);
            if (company) where.company = company;
            try {
                const oldRecord = await PhotographyPayment.findOne(where);
                if (!oldRecord) return reject({ statusCode: 404, error: { message: "Payment not found" } });
                await PhotographyPayment.updateOne(where).set({
                    isDeleted: true,
                    deletedAt: new Date(),
                    deletedBy: normalizePk(ctx?.session?.user?.id || ctx?.session?.user?._id),
                });
                await updateBookingPending(oldRecord.photographyBooking, -toNumber(oldRecord.amount));
                return resolve({ data: { deleted: true } });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },

    getReceipt: function (ctx, id) {
        return new Promise(async (resolve, reject) => {
            try {
                const { data: payment } = await this.findOne(ctx, id);
                const [companyConfig] = await CompanyconfigService.find(ctx, {}, { populate: ["company"], pagination: { limit: 1 }, select: ["company", "address", "logo", "email"] });
                return resolve({ data: { payment: payment || {}, companyConfig: companyConfig || {} } });
            } catch (error) {
                return reject(error?.statusCode ? error : { statusCode: 500, error });
            }
        });
    },
};
