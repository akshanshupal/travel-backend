const companyIdOf = (ctx) =>
    String(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id || "");

const performedByOf = (ctx) =>
    String(ctx?.session?.user?.id || ctx?.session?.user?._id || "") || null;

const normalizeId = (value) => {
    if (!value) return value;
    if (typeof value === "object") return String(value.id || value._id || "");
    return String(value);
};

const IGNORED_DIFF_FIELDS = ["id", "_id", "company", "createdAt", "updatedAt", "isDeleted", "deletedAt", "deletedBy"];

module.exports = {
    /**
     * Record a campaign change log entry.
     * Never throws so logging failures cannot break the main operation.
     */
    log: async function (ctx, { campaign, action, description, changes }) {
        try {
            const company = companyIdOf(ctx);
            if (!company) return null;

            const entry = {
                campaign: normalizeId(campaign) || null,
                action,
                description: String(description || "").slice(0, 2000),
                changes: Array.isArray(changes) ? changes : [],
                performedBy: performedByOf(ctx),
                company,
            };

            if (!entry.campaign || !entry.action) return null;

            return await CampaignLog.create(entry).fetch();
        } catch (error) {
            sails.log.warn("CampaignLogService.log failed:", error?.message || error);
            return null;
        }
    },

    /**
     * Diff an update payload against the previous record.
     * Returns an array of { field, oldValue, newValue }.
     */
    diff: function (previous, updated) {
        const changes = [];
        if (!previous || !updated) return changes;

        Object.keys(updated).forEach((field) => {
            if (IGNORED_DIFF_FIELDS.includes(field)) return;

            let oldValue = previous[field];
            let newValue = updated[field];

            const isPlainValue = (value) =>
                value === null ||
                value === undefined ||
                ["string", "number", "boolean"].includes(typeof value);

            if (Array.isArray(oldValue) || Array.isArray(newValue) || !isPlainValue(oldValue) || !isPlainValue(newValue)) {
                const oldText = JSON.stringify(oldValue ?? null);
                const newText = JSON.stringify(newValue ?? null);
                if (oldText !== newText) {
                    changes.push({ field, oldValue: oldText, newValue: newText });
                }
                return;
            }

            if (String(oldValue) !== String(newValue)) {
                changes.push({ field, oldValue: String(oldValue), newValue: String(newValue) });
            }
        });

        return changes;
    },

    find: async function (ctx, params = {}) {
        const company = companyIdOf(ctx);
        if (!company) {
            throw { statusCode: 400, error: { message: "company id is required!" } };
        }

        const {
            totalCount,
            page,
            limit,
            sort,
            accessMode,
            accessPath,
            accessResource,
            accessAction,
            ...filters
        } = params || {};

        const where = { ...filters, company };
        if (!where.hasOwnProperty("isDeleted")) where.isDeleted = { "!=": true };
        if (where.campaign) where.campaign = normalizeId(where.campaign);

        const query = CampaignLog.find({ where, sort: sort || "createdAt DESC" })
            .populate("performedBy")
            .populate("campaign");

        const numericLimit = Number(limit);
        const numericPage = Number(page);
        if (limit && limit !== "all" && Number.isFinite(numericLimit) && numericLimit > 0) {
            query.limit(numericLimit);
            if (Number.isFinite(numericPage) && numericPage > 1) {
                query.skip((numericPage - 1) * numericLimit);
            }
        }

        const records = await query;

        if (totalCount === true || totalCount === "true") {
            return {
                data: records,
                totalCount: await CampaignLog.count(where),
            };
        }

        return records;
    },

    findOne: async function (ctx, id) {
        const company = companyIdOf(ctx);
        if (!company) {
            throw { statusCode: 400, error: { message: "company id is required!" } };
        }
        if (!id) {
            throw { statusCode: 400, error: { message: "id is required!" } };
        }

        const record = await CampaignLog.findOne({ id, company, isDeleted: { "!=": true } })
            .populate("performedBy")
            .populate("campaign");

        if (!record) {
            throw { statusCode: 404, error: { code: "Not Found", message: "Log not found!" } };
        }

        return { data: record };
    },
};
