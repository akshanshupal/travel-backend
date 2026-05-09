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

const normalizeItems = (items) =>
    (Array.isArray(items) ? items : [])
        .map((item) => ({
            mainEventName: String(item?.mainEventName || "").trim(),
            eventDate: String(item?.eventDate || item?.date || "").trim(),
            timing: String(item?.timing || item?.time || "").trim(),
            duration: Number(item?.duration || 0),
            durationType: String(item?.durationType || "").trim(),
            address: String(item?.address || "").trim(),
            location: String(item?.location || "").trim(),
            deliverables: Array.isArray(item?.deliverables) ? item.deliverables : [],
            packageCost: Number(item?.packageCost || 0),
        }))
        .filter((item) => item.mainEventName);

module.exports = {
    find: function (ctx, filter = {}, params = {}) {
        return new Promise(async (resolve, reject) => {
            const where = { ...filter };
            const company = normalizePk(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id);
            if (company) where.company = company;
            if (!where.hasOwnProperty("isDeleted")) where.isDeleted = { "!=": true };

            const page = Number(params?.pagination?.page || 1) || 1;
            let limit = Number(params?.pagination?.limit || 10) || 10;
            if (String(params?.pagination?.limit || "").toLowerCase() === "all") limit = 0;

            const query = { where, sort: "createdAt DESC" };
            if (limit > 0) {
                query.skip = (page - 1) * limit;
                query.limit = limit;
            }

            try {
                const records = await PhotographyEstimate.find(query);
                const clientIds = [...new Set(records.map((item) => item.client).filter(Boolean))];
                const agentIds = [...new Set(records.map((item) => item.agent).filter(Boolean))];
                const bookingIds = [...new Set(records.map((item) => item.booking).filter(Boolean))];
                const [clients, agents, bookings] = await Promise.all([
                    clientIds.length ? PhotographyClient.find({ where: { id: clientIds } }) : [],
                    agentIds.length ? User.find({ where: { id: agentIds }, select: ["id", "name", "email", "mobile", "type"] }) : [],
                    bookingIds.length ? PhotographyBooking.find({ where: { id: bookingIds }, select: ["id", "bookingNumber"] }) : [],
                ]);
                const clientMap = clients.reduce((acc, item) => {
                    acc[item.id] = item;
                    return acc;
                }, {});
                const agentMap = agents.reduce((acc, item) => {
                    acc[item.id] = item;
                    return acc;
                }, {});
                const bookingMap = bookings.reduce((acc, item) => {
                    acc[item.id] = item;
                    return acc;
                }, {});

                const merged = records.map((record) => ({
                    ...record,
                    client: clientMap[String(record.client)] || record.client,
                    agent: agentMap[String(record.agent)] || record.agent,
                    booking: bookingMap[String(record.booking)] || record.booking,
                    items: Array.isArray(record.items) ? record.items : [],
                }));

                if (params.totalCount) {
                    const totalCount = await PhotographyEstimate.count(where);
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
            const normalizedItems = normalizeItems(payload.items);
            delete payload.items;

            if (!payload.client) return reject({ statusCode: 400, error: { message: "Client is required!" } });
            if (!payload.estimateDate) return reject({ statusCode: 400, error: { message: "Estimate date is required!" } });
            payload.client = normalizePk(payload.client);
            const sessionUser = ctx?.session?.user || {};
            const sessionUserId = normalizePk(sessionUser?.id || sessionUser?._id);
            const sessionUserType = String(sessionUser?.type || "").toUpperCase();
            payload.agent = normalizePk(payload.agent);
            if (sessionUserType === "AGENT" && sessionUserId) payload.agent = sessionUserId;
            if (!payload.agent) return reject({ statusCode: 400, error: { message: "Agent is required!" } });
            const agentRecord = await User.findOne({ id: payload.agent, isDeleted: { "!=": true } });
            if (!agentRecord || String(agentRecord?.type || "").toUpperCase() !== "AGENT") {
                return reject({ statusCode: 400, error: { message: "Selected user is not a valid agent" } });
            }

            const company = normalizePk(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id);
            payload.company = normalizePk(payload.company);
            if (!payload.company && company) payload.company = company;

            try {
                await sails.redis.setnx("photography:estimate:number:seq", 260000);
                const nextEstimateNumber = await sails.redis.incr("photography:estimate:number:seq");
                payload.estimateNumber = `EST_${String(nextEstimateNumber).padStart(6, "0")}`;
            } catch (error) {
                return reject({ statusCode: 500, error: { message: "Failed to generate estimate number", detail: error } });
            }

            const computedGrandTotal = normalizedItems.reduce((sum, item) => sum + Number(item.packageCost || 0), 0);
            payload.grandTotal = Number(payload.grandTotal ?? computedGrandTotal);
            payload.items = normalizedItems;

            try {
                const estimate = await PhotographyEstimate.create(payload).fetch();
                return resolve({ data: estimate });
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
                const record = await PhotographyEstimate.findOne(where);
                if (!record) return reject({ statusCode: 404, error: { message: "Estimate not found" } });
                const [client, agent, booking] = await Promise.all([
                    PhotographyClient.findOne({ id: record.client }),
                    record?.agent ? User.findOne({ id: record.agent }).select(["id", "name", "email", "mobile", "type"]) : null,
                    record?.booking ? PhotographyBooking.findOne({ id: record.booking, isDeleted: { "!=": true }, select: ["id", "bookingNumber"] }) : null,
                ]);
                return resolve({
                    data: {
                        ...record,
                        client,
                        agent,
                        booking,
                        items: Array.isArray(record.items) ? record.items : [],
                    },
                });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },

    updateOne: function (ctx, id, data) {
        return new Promise(async (resolve, reject) => {
            const payload = { ...(data || {}) };
            const normalizedItems = normalizeItems(payload.items);
            delete payload.items;
            delete payload.estimateNumber;

            const where = { id, isDeleted: { "!=": true } };
            const company = normalizePk(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id);
            if (company) where.company = company;

            if (payload.client) payload.client = normalizePk(payload.client);
            if (payload.company) payload.company = normalizePk(payload.company);
            if (payload.agent) payload.agent = normalizePk(payload.agent);

            const computedGrandTotal = normalizedItems.reduce((sum, item) => sum + Number(item.packageCost || 0), 0);
            payload.grandTotal = Number(payload.grandTotal ?? computedGrandTotal);
            payload.items = normalizedItems;

            try {
                const updated = await PhotographyEstimate.updateOne(where).set(payload);
                if (!updated) return reject({ statusCode: 404, error: { message: "Estimate not found" } });
                return resolve({ data: updated });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },
};
