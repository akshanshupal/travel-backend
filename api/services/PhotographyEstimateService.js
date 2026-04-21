module.exports = {
    find: function (ctx, filter = {}, params = {}) {
        return new Promise(async (resolve, reject) => {
            const where = { ...filter };
            const company = ctx?.session?.activeCompany?.id;
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
                const estimateIds = records.map((item) => item.id);

                const [clients, items] = await Promise.all([
                    clientIds.length ? PhotographyClient.find({ where: { id: clientIds } }) : [],
                    estimateIds.length
                        ? PhotographyEstimateItem.find({
                              where: {
                                  estimate: estimateIds,
                                  isDeleted: { "!=": true },
                              },
                              sort: "createdAt ASC",
                          })
                        : [],
                ]);

                const clientMap = clients.reduce((acc, item) => {
                    acc[item.id] = item;
                    return acc;
                }, {});
                const itemsMap = items.reduce((acc, item) => {
                    const key = String(item.estimate || "");
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(item);
                    return acc;
                }, {});

                const merged = records.map((record) => ({
                    ...record,
                    client: clientMap[String(record.client)] || record.client,
                    items: itemsMap[String(record.id)] || [],
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
            const items = Array.isArray(payload.items) ? payload.items : [];
            delete payload.items;

            if (!payload.client) return reject({ statusCode: 400, error: { message: "Client is required!" } });
            if (!payload.estimateDate) return reject({ statusCode: 400, error: { message: "Estimate date is required!" } });
            if (!payload.estimateNumber) {
                payload.estimateNumber = `EST-${Date.now()}`;
            }

            const company = ctx?.session?.activeCompany?.id;
            if (!payload.company && company) payload.company = company;

            const normalizedItems = items.map((item) => ({
                mainEventName: String(item?.mainEventName || "").trim(),
                timing: String(item?.timing || "").trim(),
                deliverables: Array.isArray(item?.deliverables) ? item.deliverables : [],
                packageCost: Number(item?.packageCost || 0),
            }));

            const computedGrandTotal = normalizedItems.reduce((sum, item) => sum + Number(item.packageCost || 0), 0);
            payload.grandTotal = Number(payload.grandTotal ?? computedGrandTotal);

            try {
                const estimate = await PhotographyEstimate.create(payload).fetch();
                const createdItems = [];
                for (const item of normalizedItems) {
                    if (!item.mainEventName) continue;
                    const created = await PhotographyEstimateItem.create({
                        ...item,
                        estimate: estimate.id,
                        company: payload.company,
                    }).fetch();
                    createdItems.push(created);
                }
                return resolve({
                    data: {
                        ...estimate,
                        items: createdItems,
                    },
                });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },

    findOne: function (ctx, id) {
        return new Promise(async (resolve, reject) => {
            const where = { id, isDeleted: { "!=": true } };
            const company = ctx?.session?.activeCompany?.id;
            if (company) where.company = company;
            try {
                const record = await PhotographyEstimate.findOne(where);
                if (!record) return reject({ statusCode: 404, error: { message: "Estimate not found" } });
                const [client, items] = await Promise.all([
                    PhotographyClient.findOne({ id: record.client }),
                    PhotographyEstimateItem.find({
                        where: { estimate: record.id, isDeleted: { "!=": true } },
                        sort: "createdAt ASC",
                    }),
                ]);
                return resolve({ data: { ...record, client, items } });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },

    updateOne: function (ctx, id, data) {
        return new Promise(async (resolve, reject) => {
            const payload = { ...(data || {}) };
            const items = Array.isArray(payload.items) ? payload.items : [];
            delete payload.items;

            const where = { id, isDeleted: { "!=": true } };
            const company = ctx?.session?.activeCompany?.id;
            if (company) where.company = company;

            const normalizedItems = items.map((item) => ({
                mainEventName: String(item?.mainEventName || "").trim(),
                timing: String(item?.timing || "").trim(),
                deliverables: Array.isArray(item?.deliverables) ? item.deliverables : [],
                packageCost: Number(item?.packageCost || 0),
            }));
            const computedGrandTotal = normalizedItems.reduce((sum, item) => sum + Number(item.packageCost || 0), 0);
            payload.grandTotal = Number(payload.grandTotal ?? computedGrandTotal);

            try {
                const updated = await PhotographyEstimate.updateOne(where).set(payload);
                if (!updated) return reject({ statusCode: 404, error: { message: "Estimate not found" } });

                await PhotographyEstimateItem.update({
                    estimate: id,
                    isDeleted: { "!=": true },
                }).set({
                    isDeleted: true,
                    deletedAt: new Date(),
                    deletedBy: ctx?.user?.id,
                });

                const createdItems = [];
                for (const item of normalizedItems) {
                    if (!item.mainEventName) continue;
                    const created = await PhotographyEstimateItem.create({
                        ...item,
                        estimate: id,
                        company: updated.company || company,
                    }).fetch();
                    createdItems.push(created);
                }
                return resolve({
                    data: {
                        ...updated,
                        items: createdItems,
                    },
                });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },
};
