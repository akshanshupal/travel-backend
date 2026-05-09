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

const resolvePaymentStatus = (pendingAmount) => {
    if (pendingAmount < 0) return "extra";
    if (pendingAmount === 0) return "paid";
    return "pending";
};

const createTokenPaymentForBooking = async (ctx, booking) => {
    const tokenAmount = toNumber(booking?.tokenAmount);
    if (tokenAmount <= 0) return null;
    const company = normalizePk(booking?.company || ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id);
    if (!company) return null;

    await sails.redis.setnx("photography:payment:receipt:seq", 90000);
    const receiptSeq = await sails.redis.incr(`photography:payment:receipt:seq:${company}`);
    const prefix = String(ctx?.session?.activeCompany?.paymentReceiptPrefix || "TZ");
    const receiptNo = `${prefix}PH${String(receiptSeq).padStart(6, "0")}`;

    return await PhotographyPayment.create({
        photographyBooking: normalizePk(booking.id),
        client: normalizePk(booking.client),
        agent: normalizePk(booking.agent),
        company,
        amount: tokenAmount,
        paymentDate: new Date(),
        remarks: "Token amount at booking creation",
        receiptNo,
    }).fetch();
};

const normalizeItems = (items = []) => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
        const deliverables = Array.isArray(item?.deliverables)
            ? item.deliverables.map((entry) => String(entry || "")).filter(Boolean)
            : item?.deliverables
              ? [String(item.deliverables)]
              : [];
        return {
            mainEventName: String(item?.mainEventName || ""),
            timing: String(item?.timing || item?.time || ""),
            eventDate: item?.eventDate ? String(item.eventDate) : item?.date ? String(item.date) : "",
            duration: toNumber(item?.duration),
            durationType: String(item?.durationType || ""),
            address: String(item?.address || ""),
            location: String(item?.location || ""),
            deliverables,
            packageCost: toNumber(item?.packageCost),
        };
    });
};

const normalizeEvents = (events = []) => {
    if (!Array.isArray(events)) return [];
    return events.map((event) => ({
        title: String(event?.title || event?.mainEventName || ""),
        deliverables: Array.isArray(event?.deliverables)
            ? event.deliverables.map((entry) => String(entry || "")).filter(Boolean)
            : Array.isArray(event?.dileverables)
              ? event.dileverables.map((entry) => String(entry || "")).filter(Boolean)
              : event?.deliverables
                ? [String(event.deliverables)]
                : event?.dileverables
                  ? [String(event.dileverables)]
                  : [],
        eventDate: event?.eventDate ? String(event.eventDate) : event?.date ? String(event.date) : "",
        timing: event?.timing ? String(event.timing) : event?.time ? String(event.time) : "",
        duration: toNumber(event?.duration),
        durationType: String(event?.durationType || ""),
        address: String(event?.address || event?.venueAddress || ""),
        location: String(event?.location || event?.venueLocation || ""),
    }));
};

const itemsToEvents = (items = []) => {
    return normalizeItems(items).map((item) => ({
        title: String(item?.mainEventName || ""),
        deliverables: Array.isArray(item?.deliverables) ? item.deliverables : [],
        eventDate: item?.eventDate ? String(item.eventDate) : "",
        timing: item?.timing ? String(item.timing) : "",
        duration: toNumber(item?.duration),
        durationType: String(item?.durationType || ""),
        address: String(item?.address || ""),
        location: String(item?.location || ""),
    }));
};

const eventsToItems = (events = []) => {
    return normalizeEvents(events).map((event) => ({
        mainEventName: String(event?.title || ""),
        timing: String(event?.timing || ""),
        eventDate: event?.eventDate ? String(event.eventDate) : "",
        duration: toNumber(event?.duration),
        durationType: String(event?.durationType || ""),
        address: String(event?.address || ""),
        location: String(event?.location || ""),
        deliverables: Array.isArray(event?.deliverables) ? event.deliverables : [],
        packageCost: 0,
    }));
};

const enrichBookings = async (records = []) => {
    const clientIds = [...new Set(records.map((item) => normalizePk(item.client)).filter(Boolean))];
    const agentIds = [...new Set(records.map((item) => normalizePk(item.agent)).filter(Boolean))];
    const estimateIds = [...new Set(records.map((item) => normalizePk(item.estimate)).filter(Boolean))];
    const [clients, agents, estimates] = await Promise.all([
        clientIds.length ? PhotographyClient.find({ where: { id: clientIds } }) : [],
        agentIds.length ? User.find({ where: { id: agentIds }, select: ["id", "name", "email", "mobile", "type"] }) : [],
        estimateIds.length ? PhotographyEstimate.find({ where: { id: estimateIds }, select: ["id", "estimateNumber"] }) : [],
    ]);
    const clientMap = clients.reduce((acc, item) => {
        acc[String(item.id)] = item;
        return acc;
    }, {});
    const agentMap = agents.reduce((acc, item) => {
        acc[String(item.id)] = item;
        return acc;
    }, {});
    const estimateMap = estimates.reduce((acc, item) => {
        acc[String(item.id)] = item;
        return acc;
    }, {});
    return records.map((record) => ({
        ...record,
        client: clientMap[normalizePk(record.client)] || record.client,
        agent: agentMap[normalizePk(record.agent)] || record.agent,
        estimate: estimateMap[normalizePk(record.estimate)] || record.estimate,
        event: normalizeEvents(record.event),
        items: eventsToItems(record.event),
    }));
};

module.exports = {
    find: function (ctx, filter = {}, params = {}) {
        return new Promise(async (resolve, reject) => {
            const where = { ...filter };
            const company = normalizePk(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id);
            if (company) where.company = company;
            if (!where.hasOwnProperty("isDeleted")) where.isDeleted = { "!=": true };
            if (where.bookingNumber && String(where.bookingNumber).trim()) where.bookingNumber = { contains: String(where.bookingNumber).trim() };
            if (where.client) where.client = normalizePk(where.client);
            if (where.agent) where.agent = normalizePk(where.agent);
            if (where.estimate) where.estimate = normalizePk(where.estimate);

            const page = Number(params?.pagination?.page || 1) || 1;
            let limit = Number(params?.pagination?.limit || 10) || 10;
            if (String(params?.pagination?.limit || "").toLowerCase() === "all") limit = 0;

            const query = { where, sort: "createdAt DESC" };
            if (limit > 0) {
                query.skip = (page - 1) * limit;
                query.limit = limit;
            }

            try {
                const records = await PhotographyBooking.find(query).meta({ makeLikeModifierCaseInsensitive: true });
                const merged = await enrichBookings(records);
                if (params.totalCount) {
                    const totalCount = await PhotographyBooking.count(where).meta({ makeLikeModifierCaseInsensitive: true });
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
            payload.client = normalizePk(payload.client);
            payload.agent = normalizePk(payload.agent);
            payload.estimate = normalizePk(payload.estimate);
            payload.company = normalizePk(payload.company || ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id);
            payload.event = normalizeEvents(payload.event);
            const payloadItems = normalizeItems(payload.items);
            if (!payload.event.length && payloadItems.length) payload.event = itemsToEvents(payloadItems);
            delete payload.items;
            payload.amount = toNumber(payload.amount);
            payload.gst = toNumber(payload.gst);
            payload.totalAmount = toNumber(payload.totalAmount, payload.amount + payload.gst);
            payload.tokenAmount = toNumber(payload.tokenAmount);
            payload.pendingAmount = toNumber(payload.pendingAmount, payload.totalAmount - payload.tokenAmount);
            payload.paymentStatus = resolvePaymentStatus(payload.pendingAmount);

            if (!payload.company) return reject({ statusCode: 400, error: { message: "Company is required!" } });
            if (!payload.estimate) return reject({ statusCode: 400, error: { message: "Estimate is required!" } });
            if (!payload.client) return reject({ statusCode: 400, error: { message: "Client is required!" } });
            if (!payload.agent) return reject({ statusCode: 400, error: { message: "Agent is required!" } });

            try {
                await sails.redis.setnx("photography:booking:number:seq", 310000);
                const seq = await sails.redis.incr("photography:booking:number:seq");
                payload.bookingNumber = payload.bookingNumber || `PBK_${String(seq).padStart(6, "0")}`;
                const created = await PhotographyBooking.create(payload).fetch();
                await createTokenPaymentForBooking(ctx, created);
                return resolve({ data: created });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },

    convertEstimate: function (ctx, estimateId, data = {}) {
        return new Promise(async (resolve, reject) => {
            const company = normalizePk(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id);
            const where = { id: estimateId, isDeleted: { "!=": true } };
            if (company) where.company = company;
            try {
                const estimate = await PhotographyEstimate.findOne(where);
                if (!estimate) return reject({ statusCode: 404, error: { message: "Estimate not found" } });

                if (estimate.booking) {
                    const existing = await PhotographyBooking.findOne({ id: estimate.booking, isDeleted: { "!=": true } });
                    if (existing) return resolve({ data: existing, alreadyConverted: true });
                }

                const editedItems = normalizeItems(data.items);
                const editedEvents = normalizeEvents(data.event);
                const hasEditedItems = editedItems.length > 0;
                const hasEditedEvents = editedEvents.length > 0;
                const estimateItems = normalizeItems(estimate.items);
                const estimateEvents = normalizeEvents(estimate.event);
                const bookingItems = hasEditedItems
                    ? editedItems
                    : hasEditedEvents
                      ? eventsToItems(editedEvents)
                      : estimateItems.length
                        ? estimateItems
                        : eventsToItems(estimateEvents);
                const bookingEvents = hasEditedEvents
                    ? editedEvents
                    : hasEditedItems
                      ? itemsToEvents(editedItems)
                      : estimateEvents.length
                        ? estimateEvents
                        : itemsToEvents(estimateItems);
                const amountFromItems = bookingItems.reduce((sum, item) => sum + toNumber(item.packageCost), 0);
                const amount = toNumber(data.amount, amountFromItems || toNumber(estimate.grandTotal));
                const gst = toNumber(data.gst);
                const tokenAmount = toNumber(data.tokenAmount);
                const totalAmount = toNumber(data.totalAmount, amount + gst);
                if (tokenAmount > totalAmount) {
                    return reject({ statusCode: 400, error: { message: "Token amount cannot be greater than total amount" } });
                }

                const payload = {
                    estimate: normalizePk(estimate.id),
                    client: normalizePk(estimate.client),
                    agent: normalizePk(estimate.agent),
                    company: normalizePk(estimate.company || company),
                    event: bookingEvents,
                    amount,
                    gst,
                    totalAmount,
                    tokenAmount,
                    pendingAmount: totalAmount - tokenAmount,
                    paymentStatus: resolvePaymentStatus(totalAmount - tokenAmount),
                };

                const { data: booking } = await this.create(ctx, payload);
                await PhotographyEstimate.updateOne({ id: estimate.id }).set({ booking: booking.id });
                return resolve({ data: booking });
            } catch (error) {
                return reject(error?.statusCode ? error : { statusCode: 500, error });
            }
        });
    },

    findOne: function (ctx, id) {
        return new Promise(async (resolve, reject) => {
            const where = { id, isDeleted: { "!=": true } };
            const company = normalizePk(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id);
            if (company) where.company = company;
            try {
                const record = await PhotographyBooking.findOne(where);
                if (!record) return reject({ statusCode: 404, error: { message: "Booking not found" } });
                const [merged] = await enrichBookings([record]);
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
            if (payload.client) payload.client = normalizePk(payload.client);
            if (payload.agent) payload.agent = normalizePk(payload.agent);
            if (payload.estimate) payload.estimate = normalizePk(payload.estimate);
            if (payload.company) payload.company = normalizePk(payload.company);
            const updateItems = normalizeItems(payload.items);
            const updateEvents = normalizeEvents(payload.event);
            if (!updateEvents.length && updateItems.length) payload.event = itemsToEvents(updateItems);
            if (updateEvents.length) payload.event = updateEvents;
            delete payload.items;
            if (payload.hasOwnProperty("amount")) payload.amount = toNumber(payload.amount);
            if (payload.hasOwnProperty("gst")) payload.gst = toNumber(payload.gst);
            if (payload.hasOwnProperty("totalAmount")) payload.totalAmount = toNumber(payload.totalAmount);
            if (payload.hasOwnProperty("tokenAmount")) payload.tokenAmount = toNumber(payload.tokenAmount);
            if (payload.hasOwnProperty("pendingAmount")) payload.pendingAmount = toNumber(payload.pendingAmount);
            if (payload.hasOwnProperty("pendingAmount")) payload.paymentStatus = resolvePaymentStatus(payload.pendingAmount);
            try {
                const updated = await PhotographyBooking.updateOne(where).set(payload);
                if (!updated) return reject({ statusCode: 404, error: { message: "Booking not found" } });
                return resolve({ data: updated });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },
};
