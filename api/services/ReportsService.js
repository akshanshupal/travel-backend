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
