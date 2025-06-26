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
        if(filter?.populateUser){  
            params['populateUser'] = true
        }
        try {
            var records = await CampaignService.find(req, filter, params);
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
        if(filter?.populateUser){  
            params['populateUser'] = true
        }

        try {
            var record = await CampaignService.findOne(req, req.params.id,params);
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
            var record = await CampaignService.create(req, req.body);
        } catch (error) {
            return res.serverError(error);
        }

        return res.json(record.data);
    },

    updateOne: async function (req, res) {

        try {
            var record = await CampaignService.updateOne(req, req.params.id, req.body);
        } catch (error) {
            return res.serverError(error);
        }

        return res.json(record.data);
    },
 
    deleteOne: async function (req, res) {

        try {
            var record = await CampaignService.deleteOne(req, req.params.id);
        } catch (error) {
            return res.serverError(error);
        }

        return res.json(record.data);
    },
    pauseFunction: async function (req, res) {

        try {
            var record = await CampaignService.pauseFunction(req, req.body);
        } catch (error) {
            return res.serverError(error);
        }

        return res.json(record.data);
    },

};
