module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },
    find: async function (req, res) {
        const filter = req.query;
        filter.company = req.session.activeCompany.id;
        let {populate,select,totalCount,sortField, sortOrder, page,limit } = req.query;
        const params = {};
        if(populate){
            if(typeof populate === 'string'){
                params.populate= populate.split(',')
            }
            delete filter.populate;
        }
        if(select){
            if(typeof select === 'string'){
                params.select= select.split(',')
            }
            delete filter.select;
        }
        if(totalCount){
            if(typeof totalCount === 'boolean' || totalCount=='true'){
                params.totalCount= true;
            }
            delete filter.totalCount;
        }
        if((page||limit)){
            params.pagination = {}
            if(page){
                params.pagination.page= page;
                delete filter.page;
            }
            if(limit){
                params.pagination.limit= limit;
                delete filter.limit;
            }
        }
        const populateKeys = Object.keys(filter).filter(key => key.startsWith('select_'));
        if(populateKeys?.length){
            params.populate_select = populateKeys.reduce((acc, item) => {
                if(params?.populate?.length&&item.length&&params.populate.includes(item.split('_')[1])){acc[item] = filter[item].split(',');}
                delete filter[item];
                return acc;
                },{}
            );
        }
        try {
            var records = await LeadsService.find(req, filter, params);
        } catch (error) {
            return res.serverError(error);
        }
        return res.json(records);
    },
    findOne: async function (req, res) {
        const filter = req.query;
        if(!req.params.id)   return res.badRequest('ID is missing');
        let {populate,select } = req.query;
        const params = {};
        if(populate){
            if(typeof populate === 'string'){
                params.populate= populate.split(',')
            }
        }
        if(select){
            if(typeof select === 'string'){
                params.select= select.split(',')
            }
        }
        const populateKeys = Object.keys(filter).filter(key => key.startsWith('select_'));
        if(populateKeys?.length){
            params.populate_select = populateKeys.reduce((acc, item) => {
                if(params?.populate?.length&&item.length&&params.populate.includes(item.split('_')[1])){acc[item] = filter[item].split(',');}
                return acc;
                },{}
            );
        }
        try {
            var record = await LeadsService.findOne(req, req.params.id,params);
        } catch (error) {
            return res.serverError(error);
        }
        
        return res.json(record.data);
    },

    create: async function (req, res) {
        if (!req.body.title) {
            return res.badRequest({ code: 'Error', message: 'Title is missing' });
        }

        try {
            var record = await LeadsService.create(req, req.body);
        } catch (error) {
            return res.serverError(error);
        }

        return res.json(record.data);
    },

    updateOne: async function (req, res) {

        try {
            var record = await LeadsService.updateOne(req, req.params.id, req.body);
        } catch (error) {
            return res.serverError(error);
        }

        return res.json(record.data);
    },
    transitionStage: async function (req, res) {
        if (!req.params.id) return res.badRequest('ID is missing');
        try {
            const record = await LeadsService.transitionStage(req, req.params.id, req.body);
            return res.json(record.data);
        } catch (error) {
            return res.serverError(error);
        }
    },
    deleteOne: async function (req, res) {

        try {
            var record = await LeadsService.deleteOne(req, req.params.id);
        } catch (error) {
            return res.serverError(error);
        }

        return res.json(record.data);
    },

    bulk: async function (req, res) {
        const { leadIds, action, status, currentStageName, destinationCampaign, lostReason, assignedTo, followUpAt } = req.body || {};
        if (!Array.isArray(leadIds) || !leadIds.length) return res.badRequest({ message: 'leadIds must be a non-empty array' });
        if (!['update', 'delete', 'move', 'copy', 'close'].includes(action)) return res.badRequest({ message: 'Unsupported bulk action' });
        if (['move', 'copy'].includes(action) && !destinationCampaign) return res.badRequest({ message: 'destinationCampaign is required' });
        if (action === 'close' && !['converted', 'lost'].includes(status)) return res.badRequest({ message: 'Close status must be converted or lost' });
        if (action === 'close' && status === 'lost' && !String(lostReason || '').trim()) return res.badRequest({ message: 'lostReason is required for lost leads' });
        const results = { succeeded: [], failed: [] };
        try {
            const leads = await Promise.all(leadIds.map(id => LeadsService.findOne(req, id).then(record => record.data)));
            for (const lead of leads) {
                try {
                    if (action === 'delete') await LeadsService.deleteOne(req, lead.id);
                    else if (action === 'update') {
                        if (status !== undefined || assignedTo) await LeadsService.updateOne(req, lead.id, {
                            ...(status !== undefined ? { status: status === true || status === 'active' || status === 'true' } : {}),
                            ...(assignedTo ? { salesExecutive: assignedTo } : {}),
                        });
                        if (currentStageName) await LeadsService.transitionStage(req, lead.id, { currentStageName });
                        if (followUpAt) {
                            const assignee = assignedTo || lead.salesExecutive;
                            if (!assignee) throw new Error('Assign a user before setting a follow-up date');
                            await LeadFollowUpService.create(req, { lead: lead.id, assignedTo: assignee, type: 'follow-up', dueAt: followUpAt, status: 'pending' });
                        }
                    } else if (action === 'move') {
                        await LeadsService.updateOne(req, lead.id, { campaign: destinationCampaign });
                    } else if (action === 'copy') {
                        const fields = ['title', 'mobile', 'email', 'otherOptions', 'status', 'source', 'walkInAt', 'walkInLocation', 'visitorName', 'salesExecutive', 'customProperties', 'priority', 'enquiry'];
                        const clone = fields.reduce((payload, field) => { if (lead[field] !== undefined && lead[field] !== null) payload[field] = lead[field]; return payload; }, { campaign: destinationCampaign });
                        await LeadsService.create(req, clone);
                    } else {
                        const pipeline = await sails.models.pipeline.findOne({ id: lead.pipeline, company: req.session.activeCompany.id });
                        const target = status === 'converted' ? pipeline?.convertedStage : pipeline?.rejectedStage;
                        if (!target) throw new Error(`No ${status} stage configured for lead`);
                        await LeadsService.transitionStage(req, lead.id, { currentStageName: target.name, lostReason: status === 'lost' ? lostReason : '' });
                    }
                    results.succeeded.push(lead.id);
                } catch (error) { results.failed.push({ id: lead.id, message: error?.error?.message || error?.message || 'Failed' }); }
            }
            return res.json({ ...results, successCount: results.succeeded.length, failureCount: results.failed.length });
        } catch (error) { return res.serverError(error); }
    }

};
