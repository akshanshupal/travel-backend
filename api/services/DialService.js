const LeadsService = require("./LeadsService");
const idOf = (v) => v && typeof v === "object" ? String(v.id || v._id || "") : String(v || "");
const walkInSource = (value) => {
    const source = String(value || "walk-in").trim().toLowerCase();
    if (["walkin", "walk_in", "walk-in"].includes(source)) return "walk-in";
    return source;
};
const walkInWhere = (ctx, q = {}) => {
    const company = companyOf(ctx);
    if (!company) fail("company id is required");
    const where = { company, source: "walk-in", isDeleted: { "!=": true } };
    if (q.search) where.or = [{ title: { contains: q.search } }, { mobile: { contains: q.search } }, { email: { contains: q.search } }];
    if (q.campaign) where.campaign = idOf(q.campaign);
    if (q.salesExecutive || q.agent) where.salesExecutive = idOf(q.salesExecutive || q.agent);
    if (q.leadStatus || q.status) where.leadStatus = q.leadStatus || q.status;
    if (q.dateFrom || q.dateTo) where.createdAt = { ...(q.dateFrom ? { ">=": date(q.dateFrom, "dateFrom") } : {}), ...(q.dateTo ? { "<=": date(q.dateTo, "dateTo") } : {}) };
    return { company, where };
};
const companyOf = (ctx) => idOf(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id);
const userOf = (ctx) => ctx?.session?.user || {};
const isAdmin = (ctx) => String(userOf(ctx).type || "").toUpperCase() === "ADMIN";
const active = (company) => ({ company, isDeleted: { "!=": true } });
const date = (v, label) => { if (v === undefined || v === null || v === "") return undefined; const d = new Date(v); if (Number.isNaN(d.getTime())) throw { statusCode: 400, error: { message: `${label} must be a valid date` } }; return d; };
const pageArgs = (q) => { const page = Math.max(1, Number(q.page) || 1); const limit = Math.min(100, Math.max(1, Number(q.limit) || 25)); return { page, limit, skip: (page - 1) * limit }; };
const fail = (message, statusCode = 400) => { throw { statusCode, error: { message } }; };
const relation = async (Model, id, company, label) => { if (!id) return null; const r = await Model.findOne({ id: idOf(id), ...active(company) }); if (!r) fail(`${label} is invalid for the active company`); return r; };
const scope = (ctx, q = {}) => { const company = companyOf(ctx); if (!company) fail("company id is required"); const user = userOf(ctx); const where = { company, isDeleted: { "!=": true } }; if (!isAdmin(ctx)) where.salesExecutive = idOf(user.id || user._id); else if (q.agent || q.userId) where.salesExecutive = idOf(q.agent || q.userId); if (q.campaign) where.campaign = idOf(q.campaign); if (q.status) { if (!["open", "converted", "lost"].includes(String(q.status))) fail("status must be open, converted or lost"); where.leadStatus = q.status; } if (q.stage) where.currentStageName = q.stage; if (q.search) where.or = [{ title: { contains: q.search } }, { mobile: { contains: q.search } }, { email: { contains: q.search } }]; return { company, where }; };
const decorateLeads = async (ctx, leads) => { const company = companyOf(ctx); const result = []; for (const lead of leads) { const [campaign, pipeline, followups, calls] = await Promise.all([lead.campaign ? Campaign.findOne({ id: idOf(lead.campaign), company }) : null, lead.pipeline ? Pipeline.findOne({ id: idOf(lead.pipeline), company }) : null, LeadFollowUp.find({ where: { lead: lead.id, company, isDeleted: { "!=": true }, status: "pending" }, sort: "dueAt ASC", limit: 1 }), DialCallLog.count({ lead: lead.id, company, isDeleted: { "!=": true } })]); result.push({ lead, campaign, pipeline, stage: { id: lead.currentStageId, name: lead.currentStageName }, pendingFollowUp: followups[0] || null, callAttemptCount: calls }); } return result; };
const activeCampaignWhere = (company, id) => ({ ...active(company), status: true, pause: { "!=": true }, ...(id ? { id: idOf(id) } : {}) });

module.exports = {
    walkInLeads: async (ctx, q = {}) => {
        const { where, company } = walkInWhere(ctx, q);
        const { page, limit, skip } = pageArgs(q);
        const [data, totalCount] = await Promise.all([Leads.find({ where, sort: "createdAt DESC", skip, limit }), Leads.count(where)]);
        const result = [];
        for (const lead of data) {
            const [campaign, pipeline, salesExecutive] = await Promise.all([
                lead.campaign ? Campaign.findOne({ id: idOf(lead.campaign), company }) : null,
                lead.pipeline ? Pipeline.findOne({ id: idOf(lead.pipeline), company }) : null,
                lead.salesExecutive ? User.findOne({ id: idOf(lead.salesExecutive), company }) : null,
            ]);
            result.push({ ...lead, campaign, pipeline, salesExecutive });
        }
        return { data: result, totalCount, page, limit };
    },
    walkInLead: async (ctx, id) => {
        const lead = await Leads.findOne({ id: idOf(id), ...walkInWhere(ctx).where });
        if (!lead) fail("Walk-in lead not found", 404);
        return lead;
    },
    createWalkInLead: async (ctx, body = {}) => {
        if (!String(body.title || "").trim()) fail("title is required");
        if (!String(body.mobile || "").trim() && !String(body.email || "").trim()) fail("mobile or email is required");
        const payload = { ...body, source: "walk-in", leadStatus: body.leadStatus || "open", status: body.status === undefined ? true : body.status };
        return (await LeadsService.create(ctx, payload)).data;
    },
    updateWalkInLead: async (ctx, id, body = {}) => {
        const lead = await module.exports.walkInLead(ctx, id);
        const payload = { ...body, source: "walk-in" };
        return (await LeadsService.updateOne(ctx, lead.id, payload)).data;
    },
    deleteWalkInLead: async (ctx, id) => {
        await module.exports.walkInLead(ctx, id);
        return (await LeadsService.deleteOne(ctx, id)).data;
    },
    assignWalkInLead: async (ctx, id, body = {}) => {
        const lead = await module.exports.walkInLead(ctx, id);
        const user = userOf(ctx);
        const assignedTo = idOf(body.salesExecutive || body.agent || user.id || user._id);
        await relation(User, assignedTo, companyOf(ctx), "salesExecutive");
        return (await LeadsService.updateOne(ctx, lead.id, { salesExecutive: assignedTo, source: "walk-in" })).data;
    },
    convertWalkInLead: async (ctx, id, body = {}) => {
        const lead = await module.exports.walkInLead(ctx, id);
        if (body.stage || body.stageId || body.currentStageName || body.currentStageId) {
            return (await LeadsService.transitionStage(ctx, lead.id, body)).data;
        }
        return (await LeadsService.updateOne(ctx, lead.id, { leadStatus: "converted", convertedAt: new Date(), source: "walk-in" })).data;
    },
    createWalkInCall: async (ctx, id, body = {}) => {
        const lead = await module.exports.walkInLead(ctx, id);
        const user = userOf(ctx);
        if (!lead.salesExecutive && user.id) await LeadsService.updateOne(ctx, lead.id, { salesExecutive: idOf(user.id), source: "walk-in" });
        return module.exports.createCall(ctx, { ...body, lead: lead.id });
    },
    queue: async (ctx, q = {}) => { const { where, company } = scope(ctx, q); const campaigns = await Campaign.find({ where: activeCampaignWhere(company, q.campaign), select: ["id"] }); where.campaign = campaigns.map(item => item.id); const { page, limit, skip } = pageArgs(q); const sort = String(q.sort || "createdAt DESC").replace(/[^a-zA-Z0-9_ ]/g, ""); const [leads, totalCount] = await Promise.all([Leads.find({ where, sort, skip, limit }), Leads.count(where)]); return { data: await decorateLeads(ctx, leads), totalCount, page, limit }; },
    queueSummary: async (ctx, q = {}) => { const { where, company } = scope(ctx, q); const activeCampaigns = await Campaign.find({ where: activeCampaignWhere(company, q.campaign), select: ["id", "title"] }); where.campaign = activeCampaigns.map(item => item.id); const leads = await Leads.find({ where, select: ["id", "leadStatus", "campaign"] }); const now = new Date(); const [calls, followups] = await Promise.all([DialCallLog.find({ where: { company, isDeleted: { "!=": true }, lead: leads.map(x => x.id) }, select: ["lead", "connected"] }), LeadFollowUp.find({ where: { company, isDeleted: { "!=": true }, status: "pending", lead: leads.map(x => x.id) }, select: ["lead", "dueAt"] })]); const campaigns = activeCampaigns; const connected = new Set(calls.filter(x => x.connected).map(x => idOf(x.lead))); const due = new Set(followups.filter(x => new Date(x.dueAt) <= now).map(x => idOf(x.lead))); return { ready: leads.filter(x => x.leadStatus === "open" && !due.has(x.id)).length, followUpDue: due.size, notConnected: leads.filter(x => !connected.has(x.id)).length, connected: connected.size, converted: leads.filter(x => x.leadStatus === "converted").length, campaignTotals: campaigns.map(c => ({ campaign: c, leadCount: leads.filter(l => idOf(l.campaign) === c.id).length })) }; },
    createCall: async (ctx, body = {}) => { const company = companyOf(ctx); if (!company) fail("company id is required"); const lead = await relation(Leads, body.lead, company, "lead"); if (lead.isDeleted) fail("lead is deleted", 404); const campaign = await relation(Campaign, body.campaign || lead.campaign, company, "campaign"); const startedAt = date(body.startedAt || new Date(), "startedAt"); const endedAt = date(body.endedAt, "endedAt"); if (endedAt && endedAt < startedAt) fail("endedAt must be after startedAt"); const duration = body.durationSeconds === undefined ? (endedAt ? Math.max(0, Math.round((endedAt - startedAt) / 1000)) : 0) : Number(body.durationSeconds); if (!Number.isFinite(duration) || duration < 0) fail("durationSeconds must be a non-negative number"); const user = userOf(ctx); if (!isAdmin(ctx) && idOf(lead.salesExecutive) !== idOf(user.id || user._id)) fail("lead is not assigned to the current agent", 403); const outcome = String(body.outcome || body.disposition || "").trim(); if (!outcome) fail("outcome is required"); const log = await DialCallLog.create({ lead: lead.id, campaign: campaign?.id, initiatedBy: idOf(user.id || user._id), agent: idOf(user.id || user._id), company, outcome, disposition: body.disposition, startedAt, endedAt, durationSeconds: duration, notes: body.notes, nextFollowUpAt: date(body.nextFollowUpAt, "nextFollowUpAt"), connected: Boolean(body.connected), metadata: body.metadata || {} }).fetch(); if (body.nextFollowUpAt) await LeadFollowUp.create({ lead: lead.id, assignedTo: idOf(lead.salesExecutive || user.id), type: "call", dueAt: date(body.nextFollowUpAt, "nextFollowUpAt"), status: "pending", notes: body.notes, outcome, company }); const update = {}; if (body.stage || body.currentStageName || body.currentStageId) { update.currentStageName = body.stage || body.currentStageName; if (body.currentStageId) update.currentStageId = idOf(body.currentStageId); } if (body.leadStatus && ["open", "converted", "lost"].includes(body.leadStatus)) update.leadStatus = body.leadStatus; if (Object.keys(update).length) await Leads.updateOne({ id: lead.id, company }).set(update); return log; },
    callLogs: async (ctx, q = {}) => { const company = companyOf(ctx); if (!company) fail("company id is required"); const where = { company, isDeleted: { "!=": true } }; if (!isAdmin(ctx)) where.initiatedBy = idOf(userOf(ctx).id || userOf(ctx)._id); ["lead", "campaign", "outcome", "initiatedBy", "agent"].forEach(k => { if (q[k]) where[k] = idOf(q[k]); }); if (q.connected !== undefined) where.connected = q.connected === "true" || q.connected === true; if (q.dateFrom || q.dateTo) where.startedAt = { ...(q.dateFrom ? { ">=": date(q.dateFrom, "dateFrom") } : {}), ...(q.dateTo ? { "<=": date(q.dateTo, "dateTo") } : {}) }; const { page, limit, skip } = pageArgs(q); const [data, totalCount] = await Promise.all([DialCallLog.find({ where, sort: "startedAt DESC", skip, limit }), DialCallLog.count(where)]); return { data, totalCount, page, limit }; },
    callLog: async (ctx, id) => { const r = await DialCallLog.findOne({ id: idOf(id), ...active(companyOf(ctx)) }); if (!r) fail("Call log not found", 404); if (!isAdmin(ctx) && idOf(r.initiatedBy) !== idOf(userOf(ctx).id || userOf(ctx)._id)) fail("Not authorised", 403); return r; },
    updateCall: async (ctx, id, body) => { await module.exports.callLog(ctx, id); const data = { ...body }; ["startedAt", "endedAt", "nextFollowUpAt"].forEach(k => { if (data[k]) data[k] = date(data[k], k); }); delete data.company; delete data.lead; delete data.initiatedBy; return DialCallLog.updateOne({ id: idOf(id), company: companyOf(ctx) }).set(data); },
    deleteCall: async (ctx, id) => { await module.exports.callLog(ctx, id); return DialCallLog.updateOne({ id: idOf(id), company: companyOf(ctx) }).set({ isDeleted: true, deletedAt: new Date(), deletedBy: idOf(userOf(ctx).id || userOf(ctx)._id) }); },
    tasks: async (ctx, q = {}) => { const company = companyOf(ctx); if (!company) fail("company id is required"); const where = { company, isDeleted: { "!=": true } }; if (!isAdmin(ctx)) where.assignedTo = idOf(userOf(ctx).id || userOf(ctx)._id); else if (q.assignedTo) where.assignedTo = idOf(q.assignedTo); ["status", "type", "campaign", "lead"].forEach(k => { if (q[k]) where[k] = ["campaign", "lead"].includes(k) ? idOf(q[k]) : q[k]; }); if (q.dueFrom || q.dueTo) where.dueAt = { ...(q.dueFrom ? { ">=": date(q.dueFrom, "dueFrom") } : {}), ...(q.dueTo ? { "<=": date(q.dueTo, "dueTo") } : {}) }; const { page, limit, skip } = pageArgs(q); const [data, totalCount] = await Promise.all([DialTask.find({ where, sort: "dueAt ASC", skip, limit }), DialTask.count(where)]); return { data, totalCount, page, limit }; },
    createTask: async (ctx, body = {}) => { const company = companyOf(ctx); const user = userOf(ctx); if (!company) fail("company id is required"); const assignedTo = idOf(body.assignedTo || user.id || user._id); if (!isAdmin(ctx) && assignedTo !== idOf(user.id || user._id)) fail("Only ADMIN may assign tasks", 403); await relation(User, assignedTo, company, "assignedTo"); if (body.lead) await relation(Leads, body.lead, company, "lead"); if (body.campaign) await relation(Campaign, body.campaign, company, "campaign"); const dueAt = date(body.dueAt, "dueAt"); if (!dueAt) fail("dueAt is required"); return DialTask.create({ ...body, company, assignedTo, lead: body.lead && idOf(body.lead), campaign: body.campaign && idOf(body.campaign), dueAt }).fetch(); },
    task: async (ctx, id) => { const r = await DialTask.findOne({ id: idOf(id), ...active(companyOf(ctx)) }); if (!r) fail("Task not found", 404); if (!isAdmin(ctx) && idOf(r.assignedTo) !== idOf(userOf(ctx).id || userOf(ctx)._id)) fail("Not authorised", 403); return r; },
    updateTask: async (ctx, id, body) => { await module.exports.task(ctx, id); const data = { ...body }; if (data.dueAt) data.dueAt = date(data.dueAt, "dueAt"); delete data.company; return DialTask.updateOne({ id: idOf(id), company: companyOf(ctx) }).set(data); },
    deleteTask: async (ctx, id) => { await module.exports.task(ctx, id); return DialTask.updateOne({ id: idOf(id), company: companyOf(ctx) }).set({ isDeleted: true, deletedAt: new Date() }); },
    assignTask: async (ctx, id) => { await module.exports.task(ctx, id); return DialTask.updateOne({ id: idOf(id), company: companyOf(ctx) }).set({ assignedTo: idOf(userOf(ctx).id || userOf(ctx)._id) }); },
    completeTask: async (ctx, id, body = {}) => { await module.exports.task(ctx, id); return DialTask.updateOne({ id: idOf(id), company: companyOf(ctx) }).set({ status: "completed", completedAt: new Date(), ...(body.notes ? { description: body.notes } : {}) }); },
    campaigns: async (ctx, id) => { const company = companyOf(ctx); if (!company) fail("company id is required"); const campaigns = await Campaign.find({ where: activeCampaignWhere(company, id), sort: "createdAt DESC" }); const result = []; for (const campaign of campaigns) { const where = scope(ctx, { campaign: campaign.id }).where; result.push({ ...campaign, leadCount: await Leads.count(where), queueCount: await Leads.count({ ...where, leadStatus: "open" }) }); } if (id && !result.length) fail("Campaign not found", 404); return id ? result[0] : result; },
    reports: async (ctx, q = {}) => { const company = companyOf(ctx); const where = { company, isDeleted: { "!=": true } }; if (!isAdmin(ctx)) where.initiatedBy = idOf(userOf(ctx).id || userOf(ctx)._id); else if (q.agent) where.initiatedBy = idOf(q.agent); if (q.campaign) where.campaign = idOf(q.campaign); if (q.dateFrom || q.dateTo) where.startedAt = { ...(q.dateFrom ? { ">=": date(q.dateFrom, "dateFrom") } : {}), ...(q.dateTo ? { "<=": date(q.dateTo, "dateTo") } : {}) }; const calls = await DialCallLog.find({ where, sort: "startedAt ASC" }); const connected = calls.filter(x => x.connected); const leads = new Set(calls.map(x => idOf(x.lead))); const converted = new Set(); for (const lead of leads) { const r = await Leads.findOne({ id: lead, company }); if (r?.leadStatus === "converted") converted.add(lead); } const outcomes = calls.reduce((a, x) => { a[x.outcome] = (a[x.outcome] || 0) + 1; return a; }, {}); const daily = calls.reduce((a, x) => { const k = new Date(x.startedAt).toISOString().slice(0, 10); a[k] = (a[k] || 0) + 1; return a; }, {}); const totalDurationSeconds = calls.reduce((n, x) => n + Number(x.durationSeconds || 0), 0); return { totalCalls: calls.length, connectedCalls: connected.length, uniqueLeads: leads.size, convertedLeads: converted.size, followUpsCreated: calls.filter(x => x.nextFollowUpAt).length, totalDurationSeconds, averageDurationSeconds: calls.length ? totalDurationSeconds / calls.length : 0, outcomeBreakdown: outcomes, dailyTrend: daily, agentBreakdown: calls.reduce((a, x) => { const k = idOf(x.agent || x.initiatedBy); a[k] = (a[k] || 0) + 1; return a; }, {}) }; }
};
