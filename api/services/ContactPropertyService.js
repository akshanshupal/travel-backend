const FIELD_TYPES = ["text", "number", "boolean", "date", "select", "multiSelect", "email", "phone", "url"];
const companyId = (ctx) => String(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id || "");
const activeWhere = (company) => ({ company, isDeleted: { "!=": true } });

const prepare = async (ctx, data, existing) => {
    const company = companyId(ctx);
    if (!company) throw { statusCode: 400, error: { message: "company id is required!" } };
    const payload = { ...(data || {}), company };
    if (!existing || payload.hasOwnProperty("label")) {
        payload.label = String(payload.label || "").trim();
        if (!payload.label) throw { statusCode: 400, error: { message: "label is required" } };
    }
    if (!existing) {
        payload.key = String(payload.key || payload.label || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
        if (!/^[a-z][a-z0-9_]*$/.test(payload.key)) throw { statusCode: 400, error: { message: "key must start with a letter and contain only lowercase letters, numbers and underscores" } };
        const duplicate = await ContactProperty.findOne({ key: payload.key, company });
        if (duplicate) throw { statusCode: 400, error: { message: "key already exists for this company" } };
    } else {
        delete payload.key;
    }
    const type = payload.fieldType || existing?.fieldType;
    if (!FIELD_TYPES.includes(type)) throw { statusCode: 400, error: { message: `fieldType must be one of: ${FIELD_TYPES.join(", ")}` } };
    if (["select", "multiSelect"].includes(type)) {
        const options = payload.hasOwnProperty("options") ? payload.options : existing?.options;
        if (!Array.isArray(options) || !options.length || options.some((value) => !String(value).trim())) {
            throw { statusCode: 400, error: { message: "select fields require a non-empty options array" } };
        }
        payload.options = [...new Set(options.map((value) => String(value).trim()))];
    } else if (payload.hasOwnProperty("options")) {
        payload.options = [];
    }
    if (payload.hasOwnProperty("required")) payload.required = payload.required === true || payload.required === "true";
    return payload;
};

module.exports = {
    find: async function (ctx, params = {}) {
        const company = companyId(ctx);
        if (!company) throw { statusCode: 400, error: { message: "company id is required!" } };

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
        const where = { ...filters, company, isDeleted: { "!=": true } };
        const query = ContactProperty.find({ where, sort: sort || "createdAt ASC" });
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
            return { data: records, totalCount: await ContactProperty.count(where) };
        }
        return records;
    },
    findOne: async function (ctx, id) {
        const company = companyId(ctx);
        const record = await ContactProperty.findOne({ id, ...activeWhere(company) });
        if (!record) throw { statusCode: 404, error: { message: "Contact property not found" } };
        return { data: record };
    },
    create: async function (ctx, data) {
        try { return { data: await ContactProperty.create(await prepare(ctx, data)).fetch() }; }
        catch (error) { throw error?.statusCode ? error : { statusCode: 500, error }; }
    },
    updateOne: async function (ctx, id, data) {
        const company = companyId(ctx);
        const existing = await ContactProperty.findOne({ id, ...activeWhere(company) });
        if (!existing) throw { statusCode: 404, error: { message: "Contact property not found" } };
        try { return { data: await ContactProperty.updateOne({ id, ...activeWhere(company) }).set(await prepare(ctx, data, existing)) }; }
        catch (error) { throw error?.statusCode ? error : { statusCode: 500, error }; }
    },
    deleteOne: async function (ctx, id) {
        const company = companyId(ctx);
        const record = await ContactProperty.updateOne({ id, ...activeWhere(company) }).set({ isDeleted: true, deletedAt: new Date(), deletedBy: ctx?.session?.user?.id });
        if (!record) throw { statusCode: 404, error: { message: "Contact property not found" } };
        return { data: { deleted: true } };
    },
};
