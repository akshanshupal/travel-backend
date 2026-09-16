const companyId = (ctx) => String(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id || "");
const normalizeId = (value) => value && typeof value === "object" ? String(value.id || value._id || "") : String(value || "");
const activeWhere = (company) => ({ company, isDeleted: { "!=": true } });

const prepare = async (ctx, data, existing) => {
    const company = companyId(ctx);
    if (!company) throw { statusCode: 400, error: { message: "company id is required!" } };
    const payload = { ...(data || {}), company };
    for (const key of ["lead", "assignedTo"]) if (payload.hasOwnProperty(key)) payload[key] = normalizeId(payload[key]);
    const lead = payload.lead || normalizeId(existing?.lead);
    const assignedTo = payload.assignedTo || normalizeId(existing?.assignedTo);
    if (!lead) throw { statusCode: 400, error: { message: "lead is required" } };
    if (!assignedTo) throw { statusCode: 400, error: { message: "assignedTo is required" } };
    const [leadRecord, userRecord] = await Promise.all([
        Leads.findOne({ id: lead, ...activeWhere(company) }),
        User.findOne({ id: assignedTo, ...activeWhere(company) }),
    ]);
    if (!leadRecord) throw { statusCode: 400, error: { message: "lead is invalid for the active company" } };
    if (!userRecord) throw { statusCode: 400, error: { message: "assignedTo is invalid for the active company" } };
    if (!existing || payload.hasOwnProperty("type")) {
        payload.type = String(payload.type || "").trim();
        if (!payload.type) throw { statusCode: 400, error: { message: "type is required" } };
    }
    if (!existing || payload.hasOwnProperty("dueAt")) {
        const dueAt = new Date(payload.dueAt);
        if (Number.isNaN(dueAt.getTime())) throw { statusCode: 400, error: { message: "dueAt must be a valid date" } };
        payload.dueAt = dueAt;
    }
    const status = payload.status || existing?.status || "pending";
    if (!["pending", "completed", "cancelled"].includes(status)) throw { statusCode: 400, error: { message: "status must be pending, completed or cancelled" } };
    payload.status = status;
    if (status === "completed") payload.completedAt = payload.completedAt ? new Date(payload.completedAt) : (existing?.completedAt || new Date());
    else payload.completedAt = null;
    return payload;
};

module.exports = {
    find: async function (ctx, filter = {}) {
        const company = companyId(ctx);
        if (!company) throw { statusCode: 400, error: { message: "company id is required!" } };
        const where = { ...filter, company };
        if (!where.hasOwnProperty("isDeleted")) where.isDeleted = { "!=": true };
        if (where.lead) where.lead = normalizeId(where.lead);
        if (where.assignedTo) where.assignedTo = normalizeId(where.assignedTo);
        return LeadFollowUp.find({ where, sort: "dueAt ASC" });
    },
    findOne: async function (ctx, id) {
        const record = await LeadFollowUp.findOne({ id, ...activeWhere(companyId(ctx)) });
        if (!record) throw { statusCode: 404, error: { message: "Follow-up not found" } };
        return { data: record };
    },
    create: async function (ctx, data) {
        try { return { data: await LeadFollowUp.create(await prepare(ctx, data)).fetch() }; }
        catch (error) { throw error?.statusCode ? error : { statusCode: 500, error }; }
    },
    updateOne: async function (ctx, id, data) {
        const company = companyId(ctx);
        const existing = await LeadFollowUp.findOne({ id, ...activeWhere(company) });
        if (!existing) throw { statusCode: 404, error: { message: "Follow-up not found" } };
        try { return { data: await LeadFollowUp.updateOne({ id, ...activeWhere(company) }).set(await prepare(ctx, data, existing)) }; }
        catch (error) { throw error?.statusCode ? error : { statusCode: 500, error }; }
    },
    deleteOne: async function (ctx, id) {
        const company = companyId(ctx);
        const record = await LeadFollowUp.updateOne({ id, ...activeWhere(company) }).set({ isDeleted: true, deletedAt: new Date(), deletedBy: ctx?.session?.user?.id });
        if (!record) throw { statusCode: 404, error: { message: "Follow-up not found" } };
        return { data: { deleted: true } };
    },
};
