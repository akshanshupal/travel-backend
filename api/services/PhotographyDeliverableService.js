module.exports = {
    find: function (ctx, filter = {}, params = {}) {
        return new Promise(async (resolve, reject) => {
            const where = { ...filter };
            const company = ctx?.session?.activeCompany?.id;
            if (company) where.company = company;
            if (!where.hasOwnProperty("isDeleted")) where.isDeleted = { "!=": true };
            if (where.title && String(where.title).trim()) where.title = { contains: String(where.title).trim() };

            const page = Number(params?.pagination?.page || 1) || 1;
            let limit = Number(params?.pagination?.limit || 20) || 20;
            if (String(params?.pagination?.limit || "").toLowerCase() === "all") limit = 0;

            const query = { where, sort: "createdAt DESC" };
            if (limit > 0) {
                query.skip = (page - 1) * limit;
                query.limit = limit;
            }

            try {
                const records = await PhotographyDeliverable.find(query).meta({ makeLikeModifierCaseInsensitive: true });
                if (params.totalCount) {
                    const totalCount = await PhotographyDeliverable.count(where).meta({ makeLikeModifierCaseInsensitive: true });
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
            payload.title = String(payload.title || "").trim();

            if (!payload.title) return reject({ statusCode: 400, error: { message: "Deliverable title is required!" } });

            try {
                const record = await PhotographyDeliverable.create(payload).fetch();
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
                const record = await PhotographyDeliverable.findOne(where);
                if (!record) return reject({ statusCode: 404, error: { message: "Deliverable not found" } });
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

            const payload = { ...(updtBody || {}) };
            if (payload.hasOwnProperty("title")) payload.title = String(payload.title || "").trim();
            if (payload.hasOwnProperty("title") && !payload.title) {
                return reject({ statusCode: 400, error: { message: "Deliverable title is required!" } });
            }

            try {
                const updated = await PhotographyDeliverable.updateOne(where).set(payload);
                if (!updated) return reject({ statusCode: 404, error: { message: "Deliverable not found" } });
                return resolve({ data: updated });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },

    deleteOne: function (ctx, id) {
        return new Promise(async (resolve, reject) => {
            const where = { id, isDeleted: { "!=": true } };
            const company = ctx?.session?.activeCompany?.id;
            if (company) where.company = company;
            try {
                const updated = await PhotographyDeliverable.updateOne(where).set({
                    isDeleted: true,
                    deletedAt: new Date(),
                    deletedBy: ctx?.user?.id,
                });
                if (!updated) return reject({ statusCode: 404, error: { message: "Deliverable not found" } });
                return resolve({ data: { deleted: true } });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
        });
    },
};
