module.exports = {
    find: function (ctx, filter = {}, params = {}) {
        return new Promise(async (resolve, reject) => {
            const where = { ...filter };
            const company = ctx?.session?.activeCompany?.id;
            if (company) where.company = company;
            if (!where.hasOwnProperty("isDeleted")) where.isDeleted = { "!=": true };
            if (where.name && String(where.name).trim()) where.name = { contains: String(where.name).trim() };
            if (where.phone && String(where.phone).trim()) where.phone = { contains: String(where.phone).trim() };

            const page = Number(params?.pagination?.page || 1) || 1;
            let limit = Number(params?.pagination?.limit || 10) || 10;
            if (String(params?.pagination?.limit || "").toLowerCase() === "all") limit = 0;

            const query = { where, sort: "createdAt DESC" };
            if (limit > 0) {
                query.skip = (page - 1) * limit;
                query.limit = limit;
            }
            if (params.select) query.select = params.select;

            try {
                const records = await PhotographyClient.find(query).meta({ makeLikeModifierCaseInsensitive: true });
                if (params.totalCount) {
                    const totalCount = await PhotographyClient.count(where).meta({ makeLikeModifierCaseInsensitive: true });
                    return resolve({ data: records, totalCount });
                }
                return resolve(records);
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },

    create: function (ctx, data) {
        return new Promise(async (resolve, reject) => {
            const payload = { ...(data || {}) };
            if (!payload.company) payload.company = ctx?.session?.activeCompany?.id;
            if (!payload.name) return reject({ statusCode: 400, error: { message: "Client name is required!" } });
            if (!payload.phone) return reject({ statusCode: 400, error: { message: "Phone number is required!" } });
            if (!payload.address) return reject({ statusCode: 400, error: { message: "Address is required!" } });
            try {
                const record = await PhotographyClient.create(payload).fetch();
                return resolve({ data: record });
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
                const record = await PhotographyClient.findOne(where);
                if (!record) return reject({ statusCode: 404, error: { message: "Client not found" } });
                return resolve({ data: record });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },

    updateOne: function (ctx, id, updtBody) {
        return new Promise(async (resolve, reject) => {
            const where = { id, isDeleted: { "!=": true } };
            const company = ctx?.session?.activeCompany?.id;
            if (company) where.company = company;
            try {
                const updated = await PhotographyClient.updateOne(where).set(updtBody);
                if (!updated) return reject({ statusCode: 404, error: { message: "Client not found" } });
                return resolve({ data: updated });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },
};
