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
    const normalized = {};
    for (const key of Object.keys(values)) {
        if (!byKey[key]) throw { statusCode: 400, error: { message: `Unknown or inactive custom property: ${key}` } };
        normalized[key] = normalizeCustomValue(byKey[key], values[key]);
    }
    for (const definition of definitions) {
        if (definition.required && (normalized[definition.key] === undefined) && (existing[definition.key] === undefined || existing[definition.key] === "" || existing[definition.key] === null)) {
            throw { statusCode: 400, error: { message: `${definition.label || definition.key} is required` } };
        }
    }
    return { ...(existing || {}), ...normalized };
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
        return { data: updated };
    },

    deleteOne: async function (ctx, id) {
        const company = companyId(ctx);
        if (!id || !company) throw { statusCode: 400, error: { message: "Lead id and company are required" } };
        const record = await Leads.updateOne({ id, ...activeWhere(company) }).set({ isDeleted: true, deletedAt: new Date(), deletedBy: normalizeId(ctx?.session?.user?.id) });
        if (!record) throw { statusCode: 404, error: { message: "Lead not found" } };
        return { data: { deleted: true } };
    },
};
