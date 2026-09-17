const { ObjectId } = require("mongodb");

const reportMatch = (ctx, filter = {}) => {
    const company = ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id;
    if (!company || !ObjectId.isValid(String(company))) throw { statusCode: 400, error: { message: "company id is required!" } };
    const match = { company: new ObjectId(String(company)), isDeleted: { $ne: true } };
    if (filter.from || filter.to) {
        match.createdAt = {};
        if (filter.from) match.createdAt.$gte = sails.dayjs(filter.from).startOf("day").toDate();
        if (filter.to) match.createdAt.$lte = sails.dayjs(filter.to).endOf("day").toDate();
    }
    return match;
};

module.exports = {
    leadDashboard: async function (ctx, filter = {}) {
        try {
            const company = String(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id || "");
            const match = reportMatch(ctx, filter);
            if (filter.pipeline) {
                if (!ObjectId.isValid(String(filter.pipeline))) throw { statusCode: 400, error: { message: "pipeline is invalid" } };
                match.pipeline = new ObjectId(String(filter.pipeline));
            }
            if (filter.campaign) {
                if (!ObjectId.isValid(String(filter.campaign))) throw { statusCode: 400, error: { message: "campaign is invalid" } };
                match.campaign = new ObjectId(String(filter.campaign));
            }
            const manager = Leads.getDatastore().manager;
            const callMatch = { company: new ObjectId(company), isDeleted: { $ne: true } };
            if (match.createdAt) callMatch.createdAt = match.createdAt;
            if (match.campaign) callMatch.campaign = match.campaign;

            const currentUser = String(ctx?.session?.user?.id || ctx?.session?.user?._id || "");
            const [stageRows, callRows, agents, pipelines, campaigns, userRecord] = await Promise.all([
                manager.collection(Leads.tableName || "leads").aggregate([
                    { $match: match },
                    { $group: { _id: { name: { $ifNull: ["$currentStageName", "Unspecified"] }, status: { $ifNull: ["$leadStatus", "open"] } }, count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                ]).toArray(),
                manager.collection(DialCallLog.tableName || "dialcalllog").aggregate([
                    { $match: callMatch },
                    { $group: { _id: null, total: { $sum: 1 }, connected: { $sum: { $cond: [{ $or: [{ $eq: ["$connected", true] }, { $eq: ["$status", "connected"] }] }, 1, 0] } } } },
                ]).toArray(),
                User.find({ where: { company, isDeleted: { "!=": true }, type: ["AGENT", "MANAGER", "ADMIN"] }, select: ["id", "status", "type"] }),
                Pipeline.find({ where: { company, isDeleted: { "!=": true } }, select: ["id", "title"] }).sort("createdAt DESC"),
                Campaign.find({ where: { company, isDeleted: { "!=": true } }, select: ["id", "title", "pipeline", "createdAt"] }).sort("createdAt DESC"),
                currentUser ? User.find({ where: { id: currentUser }, select: ["id", "pinnedCampaigns"] }) : Promise.resolve([]),
            ]);
            const leadTotal = stageRows.reduce((sum, row) => sum + Number(row.count || 0), 0);
            const stages = stageRows.map((row) => ({
                name: row._id?.name || "Unspecified",
                status: row._id?.status || "open",
                count: Number(row.count || 0),
                percentage: leadTotal ? Number(((Number(row.count || 0) / leadTotal) * 100).toFixed(1)) : 0,
            }));
            const calls = callRows[0] || {};
            const total = Number(calls.total || 0);
            const connected = Number(calls.connected || 0);
            const onBreak = 0;
            const active = agents.filter((user) => user.status === true).length;
            const campaignById = new Map(campaigns.map((campaign) => [String(campaign.id), campaign]));
            const rawPins = userRecord?.[0]?.pinnedCampaigns;
            const hasCustomPins = Array.isArray(rawPins);
            const savedPins = hasCustomPins ? rawPins.map(String) : [];
            const pinnedCampaigns = hasCustomPins
                ? savedPins.map((id) => campaignById.get(id)).filter(Boolean).map((campaign) => ({ id: campaign.id, title: campaign.title, createdAt: campaign.createdAt }))
                : campaigns.slice(0, 5).map((campaign) => ({ id: campaign.id, title: campaign.title, createdAt: campaign.createdAt }));
            return { data: {
                callOverview: { connected, total, percentage: total ? Number(((connected / total) * 100).toFixed(1)) : 0 },
                agentActivity: { active, total: agents.length, onBreak },
                stages,
                pipelines: pipelines.map((pipeline) => ({ id: pipeline.id, title: pipeline.title })),
                campaigns: campaigns.map((campaign) => ({ id: campaign.id, title: campaign.title, pipeline: campaign.pipeline })),
                pinnedCampaigns,
            } };
        } catch (error) {
            throw error?.statusCode ? error : { statusCode: 500, error };
        }
    },

    pinCampaign: async function (ctx, { campaignId, pinned = true }) {
        try {
            const company = String(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id || "");
            const userId = String(ctx?.session?.user?.id || ctx?.session?.user?._id || "");
            if (!userId) throw { statusCode: 401, error: { message: "user is not logged in" } };
            if (!campaignId || !ObjectId.isValid(String(campaignId))) throw { statusCode: 400, error: { message: "campaign id is invalid" } };
            const campaign = await Campaign.findOne({ id: String(campaignId), isDeleted: { "!=": true }, company });
            if (!campaign) throw { statusCode: 404, error: { message: "campaign not found" } };
            const user = await User.findOne({ id: userId }).select(["id", "pinnedCampaigns"]);
            const current = Array.isArray(user?.pinnedCampaigns) ? user.pinnedCampaigns.map(String) : [];
            const next = pinned ? Array.from(new Set([...current, String(campaignId)])) : current.filter((id) => id !== String(campaignId));
            await User.updateOne({ id: userId }).set({ pinnedCampaigns: next });
            const campaigns = await Campaign.find({ where: { company, isDeleted: { "!=": true } }, select: ["id", "title", "createdAt"] }).sort("createdAt DESC");
            const campaignById = new Map(campaigns.map((item) => [String(item.id), item]));
            const pinnedCampaigns = next.map((id) => campaignById.get(id)).filter(Boolean).map((item) => ({ id: item.id, title: item.title, createdAt: item.createdAt }));
            return { data: { pinnedCampaigns } };
        } catch (error) {
            throw error?.statusCode ? error : { statusCode: 500, error };
        }
    },

    leadFunnel: async function (ctx, filter = {}) {
        try {
            const manager = Leads.getDatastore().manager;
            const match = reportMatch(ctx, filter);
            if (filter.pipeline) {
                if (!ObjectId.isValid(String(filter.pipeline))) throw { statusCode: 400, error: { message: "pipeline is invalid" } };
                match.pipeline = new ObjectId(String(filter.pipeline));
            }
            if (filter.campaign) {
                if (!ObjectId.isValid(String(filter.campaign))) throw { statusCode: 400, error: { message: "campaign is invalid" } };
                match.campaign = new ObjectId(String(filter.campaign));
            }
            const stages = await manager.collection(Leads.tableName || "leads").aggregate([
                { $match: match },
                { $group: { _id: { name: { $ifNull: ["$currentStageName", "Unspecified"] }, status: { $ifNull: ["$leadStatus", "open"] } }, count: { $sum: 1 } } },
                { $project: { _id: 0, stageName: "$_id.name", leadStatus: "$_id.status", count: 1 } },
                { $sort: { count: -1, stageName: 1 } },
            ]).toArray();
            const totals = stages.reduce((result, row) => {
                result.total += row.count;
                result[row.leadStatus] = (result[row.leadStatus] || 0) + row.count;
                return result;
            }, { total: 0, open: 0, converted: 0, lost: 0 });
            return { data: { stages, totals, conversionRate: totals.total ? Number(((totals.converted / totals.total) * 100).toFixed(2)) : 0 } };
        } catch (error) {
            throw error?.statusCode ? error : { statusCode: 500, error };
        }
    },

    campaignDashboard: async function (ctx, campaignId) {
        try {
            const company = String(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id || "");
            if (!company || !ObjectId.isValid(company)) {
                throw { statusCode: 400, error: { message: "company id is required!" } };
            }
            if (!campaignId || !ObjectId.isValid(String(campaignId))) {
                throw { statusCode: 400, error: { message: "campaign is invalid" } };
            }

            const campaign = await Campaign.findOne({ id: String(campaignId), company, isDeleted: { "!=": true } });
            if (!campaign) {
                throw { statusCode: 404, error: { message: "Campaign not found!" } };
            }

            const manager = Leads.getDatastore().manager;
            const leadMatch = {
                company: new ObjectId(company),
                campaign: new ObjectId(String(campaignId)),
                isDeleted: { $ne: true },
            };
            const callMatch = {
                company: new ObjectId(company),
                campaign: new ObjectId(String(campaignId)),
                isDeleted: { $ne: true },
            };

            const [statusRows, distributionRows, callRows, lastLead] = await Promise.all([
                manager.collection(Leads.tableName || "leads").aggregate([
                    { $match: leadMatch },
                    { $group: { _id: { $ifNull: ["$leadStatus", "open"] }, count: { $sum: 1 } } },
                ]).toArray(),
                manager.collection(Leads.tableName || "leads").aggregate([
                    { $match: leadMatch },
                    { $group: {
                        _id: { agent: "$salesExecutive", status: { $ifNull: ["$leadStatus", "open"] } },
                        count: { $sum: 1 },
                    } },
                ]).toArray(),
                manager.collection(DialCallLog.tableName || "dialcalllog").aggregate([
                    { $match: callMatch },
                    { $group: {
                        _id: null,
                        total: { $sum: 1 },
                        connected: { $sum: { $cond: ["$connected", 1, 0] } },
                        durationSeconds: { $sum: { $ifNull: ["$durationSeconds", 0] } },
                    } },
                ]).toArray(),
                manager.collection(Leads.tableName || "leads").find(leadMatch).sort({ updatedAt: -1 }).limit(1).toArray(),
            ]);

            const statusCounts = statusRows.reduce((result, row) => {
                result[String(row._id || "open").toLowerCase()] = Number(row.count || 0);
                return result;
            }, {});
            const total = statusRows.reduce((sum, row) => sum + Number(row.count || 0), 0);
            const open = Number(statusCounts.open || 0);
            const inProgress = Number(statusCounts["in-progress"] || statusCounts.inprogress || 0);
            const converted = Number(statusCounts.converted || 0);
            const lost = Number(statusCounts.lost || 0);
            const closedBySystem = Number(statusCounts["closed-by-system"] || 0);

            const agentIds = [...new Set(distributionRows.map((row) => row._id?.agent).filter(Boolean).map(String))];
            const agents = agentIds.length
                ? await User.find({ where: { id: agentIds, company }, select: ["id", "name", "email", "username"] })
                : [];
            const agentMap = agents.reduce((map, user) => {
                map[String(user.id)] = user.name || user.username || user.email || String(user.id);
                return map;
            }, {});
            const distributionMap = {};
            distributionRows.forEach((row) => {
                const agentId = row._id?.agent ? String(row._id.agent) : "unassigned";
                if (!distributionMap[agentId]) {
                    distributionMap[agentId] = {
                        agentId: agentId === "unassigned" ? null : agentId,
                        agentName: agentId === "unassigned" ? "Unassigned" : (agentMap[agentId] || agentId),
                        uncontacted: 0,
                        noFollowUp: 0,
                        followUp: 0,
                        closed: 0,
                        total: 0,
                    };
                }
                const status = String(row._id?.status || "open").toLowerCase();
                const count = Number(row.count || 0);
                if (status === "open") distributionMap[agentId].uncontacted += count;
                else if (status === "in-progress" || status === "inprogress") distributionMap[agentId].followUp += count;
                else distributionMap[agentId].closed += count;
                distributionMap[agentId].total += count;
            });

            const callStats = callRows[0] || {};
            return {
                data: {
                    statistics: {
                        total,
                        uncontacted: open,
                        inProgress,
                        closed: converted + lost + closedBySystem,
                        noFollowUp: open,
                        followUp: inProgress,
                        converted,
                        lost,
                        closedBySystem,
                    },
                    distribution: Object.values(distributionMap),
                    calls: {
                        total: Number(callStats.total || 0),
                        connected: Number(callStats.connected || 0),
                        durationSeconds: Number(callStats.durationSeconds || 0),
                    },
                    lastUpdatedAt: lastLead[0]?.updatedAt || campaign.updatedAt || campaign.createdAt,
                    uploadedFiles: [],
                },
            };
        } catch (error) {
            throw error?.statusCode ? error : { statusCode: 500, error };
        }
    },

    allAgentPerformance: async function (ctx, filter = {}) {
        try {
            const match = reportMatch(ctx, filter);
            const company = String(ctx?.session?.activeCompany?.id || ctx?.session?.activeCompany?._id);
            const manager = Leads.getDatastore().manager;
            const [agents, leadStats, followUpStats] = await Promise.all([
                User.find({ where: { company, isDeleted: { "!=": true }, type: ["AGENT", "MANAGER", "ADMIN"] }, select: ["id", "name", "email", "type"] }),
                manager.collection(Leads.tableName || "leads").aggregate([
                    { $match: match },
                    { $group: {
                        _id: "$salesExecutive",
                        totalLeads: { $sum: 1 },
                        convertedLeads: { $sum: { $cond: [{ $eq: ["$leadStatus", "converted"] }, 1, 0] } },
                        lostLeads: { $sum: { $cond: [{ $eq: ["$leadStatus", "lost"] }, 1, 0] } },
                        openLeads: { $sum: { $cond: [{ $in: [{ $ifNull: ["$leadStatus", "open"] }, ["open", null]] }, 1, 0] } },
                    } },
                ]).toArray(),
                manager.collection(LeadFollowUp.tableName || "leadfollowup").aggregate([
                    { $match: match },
                    { $group: {
                        _id: "$assignedTo",
                        totalFollowUps: { $sum: 1 },
                        completedFollowUps: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                        pendingFollowUps: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                    } },
                ]).toArray(),
            ]);
            const leadMap = leadStats.reduce((map, row) => { if (row._id) map[String(row._id)] = row; return map; }, {});
            const followMap = followUpStats.reduce((map, row) => { if (row._id) map[String(row._id)] = row; return map; }, {});
            const data = agents.map((agent) => {
                const leads = leadMap[String(agent.id)] || {};
                const followUps = followMap[String(agent.id)] || {};
                const totalLeads = leads.totalLeads || 0;
                const convertedLeads = leads.convertedLeads || 0;
                return {
                    agent,
                    totalLeads,
                    openLeads: leads.openLeads || 0,
                    convertedLeads,
                    lostLeads: leads.lostLeads || 0,
                    conversionRate: totalLeads ? Number(((convertedLeads / totalLeads) * 100).toFixed(2)) : 0,
                    totalFollowUps: followUps.totalFollowUps || 0,
                    completedFollowUps: followUps.completedFollowUps || 0,
                    pendingFollowUps: followUps.pendingFollowUps || 0,
                };
            });
            return { data };
        } catch (error) {
            throw error?.statusCode ? error : { statusCode: 500, error };
        }
    },

    find: function (ctx, filter, params) {
        return new Promise(async (resolve, reject) => {
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            if (!params) {
                params = {};
            }
            if(!filter.hasOwnProperty('isDeleted')){
                filter.isDeleted = { '!=': true };
            }
            let qryObj = {where : filter};
            //sort
            let sortField = 'createdAt';
            let sortOrder = 'DESC';
            qryObj.sort = sortField + ' ' + sortOrder;
            //pagination
            let page = 1;
            let limit = 10;
            if(params?.pagination?.page){
                page = +params.pagination.page
            }
            if(params?.pagination?.limit){
                if(params?.pagination?.limit=='All'||params?.pagination?.limit=='all'){
                    limit = null
                }else{
                    limit = +params.pagination.limit
                }
            }
            qryObj.skip= (page-1)*limit;
            qryObj.limit= limit;
            //select
            if (params.select) {
                qryObj.select = params.select;
            }
            try {
                var records = await Reports.find(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.reports.associations.length; ami++) {
                    assosiationModels[sails.models.reports.associations[ami].alias] = sails.models.reports.associations[ami].model;
                }
                for (let i = 0; i < records.length; i++) {
                    for (let populateKey of params.populate) {
                        if (!records[i][populateKey]) {
                            continue;
                        }
                        const cond = { where: {} };
                        cond.where['id'] = records[i][populateKey];
                        const selectKey = 'select_'+populateKey;
                        if (params.hasOwnProperty('populate_select')&&params.populate_select.hasOwnProperty(selectKey)) {
                            cond.select = params.populate_select[selectKey];
                        }
                        let modelName = assosiationModels[populateKey];                        
                        try {
                            records[i][populateKey] = await sails.models[modelName].findOne(cond);
                        } catch (error) {
                            return reject({ statusCode: 500, error: error });
                        }
                    }
                }
            }
            const rtrn = { data : records }
            //totalCount
            if (params.totalCount) {
                try {
                    var totalRecords = await Reports.count(filter)
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
                rtrn.totalCount = totalRecords;
            }else{
                return resolve(rtrn.data);
            }
            return resolve(rtrn);
        })

    },
    findOne: function (ctx, id, params) {
        return new Promise(async (resolve, reject) => {
            const filter = {
                id: id,
                company: ctx?.session?.activeCompany?.id,
            };
            if (!filter.id) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            let qryObj = { where: filter };
            if(!qryObj.where?.id){
                return reject({ statusCode: 400, error: { message: "ID Missing!" } });
            }
            if (!params) {
                params = {};
            }
            if (params.select) {
                qryObj.select = params.select;
            }
            try {
                var record = await Reports.findOne(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.reports.associations.length; ami++) {
                    assosiationModels[sails.models.reports.associations[ami].alias] = sails.models.reports.associations[ami].model;
                }
                for (let populateKey of params.populate) {
                    if (!record[populateKey]) {
                        continue;
                    }
                    const cond = { where: {} };
                    cond.where['id'] = record[populateKey];
                    const selectKey = 'select_'+populateKey;
                    if (params.hasOwnProperty('populate_select')&&params.populate_select.hasOwnProperty(selectKey)) {
                        cond.select = params.populate_select[selectKey];
                    }
                    let modelName = assosiationModels[populateKey];                        
                    try {
                        record[populateKey] = await sails.models[modelName].findOne(cond);
                    } catch (error) {
                        return reject({ statusCode: 500, error: error });
                    }
                }   
            }
            const rtrn = { data: record }
            return resolve({ data: record });
        })
    },
    create: function (ctx, data, avoidRecordFetch) {
        return new Promise(async (resolve, reject) => {
            if (!data.company) {
                data.company= ctx?.session?.activeCompany?.id;
            }

            if (!data.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }

            if (avoidRecordFetch) {
                try {
                    var record = await Reports.create(data);
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
            } else {
                try {
                    var record = await Reports.create(data).fetch();
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
            }

            return resolve({ data: record || { created: true } });
        })


    },
    updateOne: function (ctx, id, updtBody) {
        return new Promise(async (resolve, reject) => {
            const filter = {
                id: id,
                company: ctx?.session?.activeCompany?.id,
            };
            if (!filter.id) {
                return reject({ statusCode: 400, error: { message: 'id is required!' } });
            }
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            if (!updtBody.company) {
                updtBody.company= filter.company;
            }

            try {
                var record = await Reports.updateOne(filter).set(updtBody);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }

            return resolve({ data: record || { modified: true } });
        })
    },
    deleteOne: function (ctx, id) {
        return new Promise(async (resolve, reject) => {
            const filter = {
                id: id,
                company: ctx?.session?.activeCompany?.id,
            };
            if (!filter.id) {
                return reject({ statusCode: 400, error: { message: 'id is required!' } });
            }
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            try {
                await Reports.destroyOne(filter);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }


            return resolve({ data: { deleted: true } });
        })
    }
}
