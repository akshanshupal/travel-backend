const normalizeId = (value) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "object") return normalizeId(value.id || value._id);
    return String(value);
};

const companyId = (ctx) => normalizeId(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id);
const activeWhere = (company) => ({ company, isDeleted: { "!=": true } });

const getStages = (pipeline) => {
    if (!pipeline) return [];
    return [
        { ...(pipeline.initialStage || {}), kind: "open", position: 0 },
        ...(Array.isArray(pipeline.otherStages) ? pipeline.otherStages : []).map((stage, index) => ({ ...stage, kind: "open", position: index + 1 })),
        { ...(pipeline.convertedStage || {}), kind: "converted", position: "converted" },
        { ...(pipeline.rejectedStage || {}), kind: "lost", position: "rejected" },
    ].filter((stage) => stage.name);
};

const stageId = (stage) => String(stage.id || stage._id || stage.key || stage.name);
const findStage = (pipeline, id, name) => getStages(pipeline).find((stage) =>
    (id && stageId(stage) === String(id)) || (name && String(stage.name).toLowerCase() === String(name).toLowerCase()),
);

const applyStage = (payload, stage) => {
    payload.currentStageId = stageId(stage);
    payload.currentStageName = String(stage.name);
    if (stage.kind === "converted") {
        payload.leadStatus = "converted";
        payload.convertedAt = payload.convertedAt || new Date();
        payload.lostReason = "";
    } else if (stage.kind === "lost") {
        payload.leadStatus = "lost";
        payload.convertedAt = null;
    } else {
        payload.leadStatus = payload.leadStatus === "converted" || payload.leadStatus === "lost" ? "open" : (payload.leadStatus || "open");
        payload.convertedAt = null;
        payload.lostReason = "";
    }
};

const assertRelation = async (Model, id, company, label) => {
    if (!id) return null;
    const record = await Model.findOne({ id, ...activeWhere(company) });
    if (!record) throw { statusCode: 400, error: { message: `${label} is invalid for the active company` } };
    return record;
};

const normalizeCustomValue = (definition, value) => {
    if (value === null || value === undefined || value === "") {
        if (definition.required) throw { statusCode: 400, error: { message: `${definition.label || definition.key} is required` } };
        return value;
    }
    switch (definition.fieldType) {
        case "number": {
            const parsed = Number(value);
            if (!Number.isFinite(parsed)) throw { statusCode: 400, error: { message: `${definition.label || definition.key} must be a number` } };
            return parsed;
        }
        case "boolean":
            if (![true, false, "true", "false", 1, 0, "1", "0"].includes(value)) throw { statusCode: 400, error: { message: `${definition.label || definition.key} must be a boolean` } };
            return value === true || value === "true" || value === 1 || value === "1";
        case "date": {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) throw { statusCode: 400, error: { message: `${definition.label || definition.key} must be a valid date` } };
            return date.toISOString();
        }
        case "select":
            if (!Array.isArray(definition.options) || !definition.options.map(String).includes(String(value))) {
                throw { statusCode: 400, error: { message: `${definition.label || definition.key} must be one of the configured options` } };
            }
            return String(value);
        case "multiSelect": {
            if (!Array.isArray(value)) throw { statusCode: 400, error: { message: `${definition.label || definition.key} must be an array` } };
            const options = Array.isArray(definition.options) ? definition.options.map(String) : [];
            const values = value.map(String);
            if (values.some((entry) => !options.includes(entry))) throw { statusCode: 400, error: { message: `${definition.label || definition.key} contains an invalid option` } };
            return values;
        }
        case "email":
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) throw { statusCode: 400, error: { message: `${definition.label || definition.key} must be a valid email` } };
            return String(value).trim();
        default:
            return String(value);
    }
};

const validateCustomProperties = async (company, values, existing = {}) => {
    if (values === undefined) return existing || {};
    if (!values || typeof values !== "object" || Array.isArray(values)) throw { statusCode: 400, error: { message: "customProperties must be an object" } };
    const definitions = await ContactProperty.find({ where: activeWhere(company) });
    const byKey = definitions.reduce((map, item) => { map[item.key] = item; return map; }, {});
    const carried = { ...(existing || {}) };
    const normalized = {};
    for (const key of Object.keys(values)) {
        if (values[key] === null) { delete carried[key]; continue; }
        if (!byKey[key]) throw { statusCode: 400, error: { message: `Unknown or inactive custom property: ${key}` } };
        normalized[key] = normalizeCustomValue(byKey[key], values[key]);
    }
    for (const definition of definitions) {
        if (definition.required && (normalized[definition.key] === undefined) && (carried[definition.key] === undefined || carried[definition.key] === "" || carried[definition.key] === null)) {
            throw { statusCode: 400, error: { message: `${definition.label || definition.key} is required` } };
        }
    }
    const activeCarried = Object.fromEntries(Object.entries(carried).filter(([key]) => byKey[key]));
    return { ...activeCarried, ...normalized };
};

const preparePayload = async (ctx, data, existing) => {
    const company = companyId(ctx);
    if (!company) throw { statusCode: 400, error: { message: "company id is required!" } };
    const payload = { ...(data || {}), company };
    for (const key of ["campaign", "pipeline", "salesExecutive", "enquiry"]) {
        if (payload.hasOwnProperty(key)) payload[key] = normalizeId(payload[key]);
    }

    let campaign = null;
    if (payload.campaign) {
        campaign = await assertRelation(Campaign, payload.campaign, company, "Campaign");
        payload.pipeline = normalizeId(campaign.pipeline);
    }
    if (payload.pipeline) await assertRelation(Pipeline, payload.pipeline, company, "Pipeline");
    if (payload.salesExecutive) await assertRelation(User, payload.salesExecutive, company, "Sales executive");
    if (payload.enquiry) await assertRelation(Enquiry, payload.enquiry, company, "Enquiry");

    const pipelineChanged = payload.hasOwnProperty("pipeline") && payload.pipeline !== normalizeId(existing?.pipeline);
    const pipelineId = payload.pipeline || normalizeId(existing?.pipeline);
    if (pipelineId) {
        const pipeline = await assertRelation(Pipeline, pipelineId, company, "Pipeline");
        const requestedStage = payload.currentStageId || payload.currentStageName;
        if (!existing || pipelineChanged || requestedStage) {
            const stage = requestedStage
                ? findStage(pipeline, payload.currentStageId, payload.currentStageName)
                : findStage(pipeline, null, pipeline.initialStage?.name);
            if (!stage) throw { statusCode: 400, error: { message: "Stage is not part of the selected pipeline" } };
            applyStage(payload, stage);
        }
    } else if (payload.currentStageId || payload.currentStageName) {
        throw { statusCode: 400, error: { message: "A pipeline is required to set a lead stage" } };
    }

    if (!existing && !payload.leadStatus) payload.leadStatus = "open";
    if (payload.priority && !["low", "medium", "high", "urgent"].includes(payload.priority)) {
        throw { statusCode: 400, error: { message: "priority must be low, medium, high or urgent" } };
    }
    if (payload.leadStatus && !["open", "converted", "lost"].includes(payload.leadStatus)) {
        throw { statusCode: 400, error: { message: "leadStatus must be open, converted or lost" } };
    }
    payload.customProperties = await validateCustomProperties(company, payload.customProperties, existing?.customProperties || {}, !existing);
    return payload;
};

module.exports = {
    preparePayload,

    find: async function (ctx, filter = {}, params = {}) {
        const company = companyId(ctx);
        if (!company) throw { statusCode: 400, error: { message: "company id is required!" } };
        const where = { ...filter, company };
        if (!where.hasOwnProperty("isDeleted")) where.isDeleted = { "!=": true };

        // Search-friendly filters (partial / multi-value matching)
        const toIn = (value) => String(value).split(",").map((item) => item.trim()).filter(Boolean);
        if (where.titleLike) { where.title = { contains: String(where.titleLike).trim() }; delete where.titleLike; }
        if (where.mobileLike) { where.mobile = { contains: String(where.mobileLike).trim() }; delete where.mobileLike; }
        if (where.emailLike) { where.email = { contains: String(where.emailLike).trim() }; delete where.emailLike; }
        if (where.campaignIn) { const ids = toIn(where.campaignIn); delete where.campaignIn; if (ids.length) where.campaign = ids; }
        if (where.sourceIn) { const values = toIn(where.sourceIn); delete where.sourceIn; if (values.length) where.source = values; }
        const report = where.report === true || where.report === "true";
        delete where.report;
        for (const [key, field] of [["userIn", "salesExecutive"], ["statusIn", "leadStatus"]]) {
            if (where[key]) where[field] = toIn(where[key]);
            delete where[key];
        }
        if (where.stageIn) {
            const values = toIn(where.stageIn);
            const stages = values.filter(value => value !== "__none__");
            const alternatives = stages.length ? [{ currentStageName: stages }] : [];
            if (values.includes("__none__")) alternatives.push({ currentStageName: "" }, { currentStageName: null });
            where.and = [...(where.and || []), { or: alternatives }];
        }
        delete where.stageIn;
        if (where.tagIn) {
            const tags = toIn(where.tagIn);
            const candidates = await Leads.find({ where: activeWhere(company), select: ["id", "otherOptions"] });
            const ids = candidates.filter(item => {
                try { const other = typeof item.otherOptions === "string" ? JSON.parse(item.otherOptions || "{}") : item.otherOptions || {}; return tags.includes(String(other.tag || "")); }
                catch { return false; }
            }).map(item => item.id);
            where.and = [...(where.and || []), { id: ids }];
        }
        delete where.tagIn;
        const range = {};
        for (const [key, operator] of [["createdFrom", ">="], ["createdTo", "<="]]) {
            if (where[key]) {
                const date = sails.dayjs(where[key]);
                if (!date.isValid()) throw { statusCode: 400, error: { message: "Invalid creation date" } };
                range[operator] = (operator === ">=" ? date.startOf("day") : date.endOf("day")).toDate();
            }
            delete where[key];
        }
        if (Object.keys(range).length) where.createdAt = range;
        if (where.latestDisposition) {
            const calls = await DialCallLog.find({ where: { company, isDeleted: { "!=": true } }, sort: "startedAt DESC" });
            const seen = new Set();
            const ids = [];
            for (const call of calls) {
                const lead = normalizeId(call.lead);
                if (seen.has(lead)) continue;
                seen.add(lead);
                if (String(call.disposition || call.outcome || "").toLowerCase().includes(String(where.latestDisposition).toLowerCase())) ids.push(lead);
            }
            where.and = [...(where.and || []), { id: ids }];
        }
        delete where.latestDisposition;
        if (where.customProps) {
            try {
                const props = JSON.parse(where.customProps);
                delete where.customProps;
                const definitions = await ContactProperty.find({ where: activeWhere(company) });
                for (const [key, value] of Object.entries(props || {})) {
                    const definition = definitions.find(item => item.key === key && item.status !== false);
                    if (!definition || value === "" || value === undefined || value === null) continue;
                    const field = `customProperties.${key}`;
                    if (definition.fieldType === "multiSelect") { if (Array.isArray(value) && value.length) where[field] = { in: value }; }
                    else if (definition.fieldType === "boolean") where[field] = value === true || value === "true";
                    else if (definition.fieldType === "number") where[field] = Number(value);
                    else if (definition.fieldType === "select") where[field] = String(value);
                    else where[field] = { contains: String(value) };
                }
            } catch (error) { /* ignore malformed customProps */ }
        }
        for (const dateKey of ["createdAt", "updatedAt"]) {
            if (where[dateKey]) where[dateKey] = { ">=": sails.dayjs(where[dateKey]).startOf("day").toDate(), "<=": sails.dayjs(where[dateKey]).endOf("day").toDate() };
        }
        const page = Number(params?.pagination?.page || 1) || 1;
        const requestedLimit = params?.pagination?.limit;
        const limit = String(requestedLimit || "").toLowerCase() === "all" ? 0 : (Number(requestedLimit || 10) || 10);
        const query = { where, sort: "createdAt DESC" };
        if (limit > 0) { query.skip = (page - 1) * limit; query.limit = limit; }
        if (params.select) query.select = params.select;
        try {
            let records = await Leads.find(query);
            if (params.populate) {
                for (const relation of params.populate) {
                    const association = sails.models.leads.associations.find((item) => item.alias === relation);
                    if (!association) continue;
                    const ids = [...new Set(records.map((item) => normalizeId(item[relation])).filter(Boolean))];
                    const select = params.populate_select?.[`select_${relation}`];
                    const related = ids.length ? await sails.models[association.model].find({ where: { id: ids, company }, ...(select ? { select } : {}) }) : [];
                    const map = related.reduce((acc, item) => { acc[normalizeId(item.id)] = item; return acc; }, {});
                    records = records.map((item) => ({ ...item, [relation]: map[normalizeId(item[relation])] || item[relation] }));
                }
            }
            if (report && records.length) {
                const leadIds = records.map(item => normalizeId(item.id));
                const [calls, followUps] = await Promise.all([
                    DialCallLog.find({ where: { company, lead: leadIds, isDeleted: { "!=": true } }, sort: "startedAt DESC" }),
                    LeadFollowUp.find({ where: { company, lead: leadIds, status: "pending", isDeleted: { "!=": true } }, sort: "dueAt ASC" }),
                ]);
                const callsByLead = calls.reduce((map, call) => {
                    const lead = normalizeId(call.lead);
                    if (!map[lead]) map[lead] = [];
                    map[lead].push(call);
                    return map;
                }, {});
                const followUpByLead = followUps.reduce((map, followUp) => {
                    const lead = normalizeId(followUp.lead);
                    if (!map[lead]) map[lead] = followUp;
                    return map;
                }, {});
                records = records.map(item => {
                    const leadId = normalizeId(item.id);
                    const leadCalls = callsByLead[leadId] || [];
                    return {
                        ...item,
                        followUpTime: followUpByLead[leadId]?.dueAt || null,
                        lastCallDate: leadCalls[0]?.startedAt || null,
                        totalDispositionCount: leadCalls.filter(call => call.disposition || call.outcome).length,
                        callAttemptCount: leadCalls.length,
                    };
                });
            }
            if (params.totalCount) return { data: records, totalCount: await Leads.count(where) };
            return records;
        } catch (error) {
            throw error?.statusCode ? error : { statusCode: 500, error };
        }
    },

    findOne: async function (ctx, id, params = {}) {
        const company = companyId(ctx);
        if (!id) throw { statusCode: 400, error: { message: "id is required!" } };
        if (!company) throw { statusCode: 400, error: { message: "company id is required!" } };
        let record = await Leads.findOne({ id, ...activeWhere(company) });
        if (!record) throw { statusCode: 404, error: { message: "Data not found!" } };
        if (params.populate) {
            for (const relation of params.populate) {
                const association = sails.models.leads.associations.find((item) => item.alias === relation);
                const relationId = normalizeId(record[relation]);
                if (!association || !relationId) continue;
                const select = params.populate_select?.[`select_${relation}`];
                record[relation] = await sails.models[association.model].findOne({ where: { id: relationId, company }, ...(select ? { select } : {}) }) || record[relation];
            }
        }
        return { data: record };
    },

    create: async function (ctx, data, avoidRecordFetch) {
        try {
            const payload = await preparePayload(ctx, data, null);
            const record = avoidRecordFetch ? await Leads.create(payload) : await Leads.create(payload).fetch();
            if (record?.id) {
                await LeadLogService.log(ctx, {
                    lead: record.id,
                    campaign: payload.campaign,
                    action: 'created',
                    description: `Lead "${record.title || 'Untitled'}" was created`,
                });
            }
            return { data: record || { created: true } };
        } catch (error) {
            throw error?.statusCode ? error : { statusCode: 500, error };
        }
    },

    updateOne: async function (ctx, id, data) {
        const company = companyId(ctx);
        if (!id) throw { statusCode: 400, error: { message: "id is required!" } };
        if (!company) throw { statusCode: 400, error: { message: "company id is required!" } };
        try {
            const existing = await Leads.findOne({ id, ...activeWhere(company) });
            if (!existing) throw { statusCode: 404, error: { message: "Lead not found" } };
            const payload = await preparePayload(ctx, data, existing);
            const record = await Leads.updateOne({ id, ...activeWhere(company) }).set(payload);
            const changes = LeadLogService.diff(existing, record || {});
            if (changes.length) {
                const stageChanged = changes.some(change => change.field === 'currentStageName');
                await LeadLogService.log(ctx, {
                    lead: id,
                    campaign: record?.campaign || existing.campaign,
                    action: stageChanged ? 'stage-changed' : 'updated',
                    description: `Lead "${record?.title || existing.title || 'Untitled'}" was ${stageChanged ? 'moved to stage ' + (record?.currentStageName || existing.currentStageName) : 'updated'}`,
                    changes,
                });
            }
            return { data: record };
        } catch (error) {
            throw error?.statusCode ? error : { statusCode: 500, error };
        }
    },

    transitionStage: async function (ctx, id, data = {}) {
        const company = companyId(ctx);
        if (!id || !company) throw { statusCode: 400, error: { message: "Lead id and company are required" } };
        const lead = await Leads.findOne({ id, ...activeWhere(company) });
        if (!lead) throw { statusCode: 404, error: { message: "Lead not found" } };
        const pipeline = await assertRelation(Pipeline, normalizeId(lead.pipeline), company, "Pipeline");
        const target = findStage(pipeline, normalizeId(data.currentStageId || data.stageId), data.currentStageName || data.stageName);
        if (!target) throw { statusCode: 400, error: { message: "Target stage is not part of this lead's pipeline" } };
        const current = findStage(pipeline, lead.currentStageId, lead.currentStageName) || findStage(pipeline, null, pipeline.initialStage?.name);
        const allowed = current?.additional?.transitions;
        if (Array.isArray(allowed) && allowed.length && !allowed.some((name) => String(name).toLowerCase() === String(target.name).toLowerCase())) {
            throw { statusCode: 400, error: { message: `Transition from ${current.name} to ${target.name} is not allowed` } };
        }
        const payload = { lostReason: data.lostReason ? String(data.lostReason).trim() : "" };
        applyStage(payload, target);
        if (target.kind === "lost" && !payload.lostReason) throw { statusCode: 400, error: { message: "lostReason is required for a lost lead" } };
        const updated = await Leads.updateOne({ id, ...activeWhere(company) }).set(payload);
        await LeadLogService.log(ctx, {
            lead: id,
            campaign: lead.campaign,
            action: 'stage-changed',
            description: `Lead "${lead.title || 'Untitled'}" stage moved from "${lead.currentStageName || 'N/A'}" to "${target.name}"`,
            changes: [{ field: 'currentStageName', oldValue: String(lead.currentStageName || ''), newValue: String(target.name) }],
        });
        return { data: updated };
    },

    deleteOne: async function (ctx, id) {
        const company = companyId(ctx);
        if (!id || !company) throw { statusCode: 400, error: { message: "Lead id and company are required" } };
        const record = await Leads.updateOne({ id, ...activeWhere(company) }).set({ isDeleted: true, deletedAt: new Date(), deletedBy: normalizeId(ctx?.session?.user?.id) });
        if (!record) throw { statusCode: 404, error: { message: "Lead not found" } };
        await LeadLogService.log(ctx, {
            lead: id,
            campaign: record.campaign,
            action: 'deleted',
            description: `Lead "${record.title || 'Untitled'}" was deleted`,
        });
        return { data: { deleted: true } };
    },
};
