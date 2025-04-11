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
            var records = await SavedItineraryService.find(req, filter, params);
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
            var record = await SavedItineraryService.findOne(req, req.params.id,params);
        } catch (error) {
            return res.serverError(error);
        }
        
        return res.json(record.data);
    },

    create: async function (req, res) {
        try {
            var record = await SavedItineraryService.create(req, req.body);
        } catch (error) {
            return res.status(error?.statusCode || 500).json({ error: error?.error || error });
        }
        return res.json(record.data);
    },

    updateOne: async function (req, res) {

        try {
            var record = await SavedItineraryService.updateOne(req, req.params.id, req.body);
        } catch (error) {
            return res.serverError(error);
        }

        return res.json(record.data);
    },
    deleteOne: async function (req, res) {

        try {
            var record = await SavedItineraryService.deleteOne(req, req.params.id);
        } catch (error) {
            return res.serverError(error);
        }

        return res.json(record.data);
    },
    sendItineraryMail: async function (req, res) {
        if(!req.body.email)   return res.badRequest('email is missing');
        

        try {
            var record = await SavedItineraryService.sendItineraryMail(req, req.params.id, req.body);
        } catch (error) {
            return res.serverError(error);
        }
        return res.json(record.data);
    },
    agentWiseSavedItineraries: async function (req, res) {
        const {to,from,salesExecutive} = req.allParams();
        const filter = {};
        if(to){
            filter.to = to
        }
        if(from){
            filter.from = from
        }
        if(salesExecutive){
            filter.salesExecutive = salesExecutive
        }

        try {
            var record = await SendmailService.agentWiseSavedItineraries(req, filter);
        } catch (error) {
            return res.serverError(error);
        }

        return res.json(record.data);
    },
    agentDurationWiseSavedItineraries: async function (req, res) {
        let { to, from, salesExecutive, grouping = 'day' } = req.allParams();
      
        // If no to and from are provided, set current month start and today as default
        if (!to && !from) {
            const today = sails.dayjs();
            const startOfMonth = today.startOf('month');
            from = startOfMonth.format('YYYY-MM-DD');
            to = today.format('YYYY-MM-DD');
        }
    
        const filter = {
            ...(salesExecutive && { salesExecutive }),
            ...(grouping && { grouping }),
            ...(to && { to }),
            ...(from && { from }),
            
        };
    
        try {
            const record = await SendmailService.agentDurationWiseSavedItineraries(req, filter);
            return res.json(record.data);
        } catch (error) {
            return res.serverError(error);
        }
    },

};
