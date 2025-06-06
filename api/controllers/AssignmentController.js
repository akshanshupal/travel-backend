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
            var records = await AssignmentService.find(req, filter, params);
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
            var record = await AssignmentService.findOne(req, req.params.id,params);
        } catch (error) {
            return res.serverError(error);
        }
        
        return res.json(record.data);
    },

    create: async function (req, res) {
        // if (!req.body.title) {
        //     return res.badRequest({ code: 'Error', message: 'Title is missing' });
        // }

        try {
            var record = await AssignmentService.create(req, req.body);
        } catch (error) {
            return res.serverError(error);
        }

        return res.json(record.data);
    },

    updateOne: async function (req, res) {

        try {
            var record = await AssignmentService.updateOne(req, req.params.id, req.body);
        } catch (error) {
            return res.serverError(error);
        }

        return res.json(record.data);
    },
    deleteOne: async function (req, res) {

        try {
            var record = await AssignmentService.deleteOne(req, req.params.id);
        } catch (error) {
            return res.status(error?.statusCode).send(error.error); 
        }

        return res.json(record.data);
    },
    sendAssignmentMail: async function (req, res) {
        if(!req.body.email)   return res.badRequest('email is missing');

        try {
            var record = await AssignmentService.sendAssignmentMail(req, req.params.id, req.body);
        } catch (error) {
            return res.serverError(error);
        }
        return res.json(record.data);
    },
    sendWelcomeMail: async function (req, res) {
        if(!req.body.email)   return res.badRequest('email is missing');

        try {
            var record = await AssignmentService.sendWelcomeMail(req, req.params.id, req.body);
        } catch (error) {
            return res.serverError(error);
        }
        return res.json(record.data);
    },
    verifyAssignment: async function (req, res) {
        const {verify} = req.body;

        try {
            var record = await AssignmentService.verifyAssignment(req, req.params.id, {verify:verify});
        } catch (error) {
            return res.serverError(error);
        }
        return res.json(record.data);
    },
    finishedAssignment: async function (req, res) {
        const {finished} = req.body;

        try {
            var record = await AssignmentService.finishedAssignment(req, req.params.id, {finished:finished});
        } catch (error) {
            return res.serverError(error);
        }
        return res.json(record.data);
    },
    bookingStatus: async function (req, res) {
        const {bookingStatus} = req.body;

        try {
            var record = await AssignmentService.bookingStatus(req, req.params.id, {bookingStatus:bookingStatus});
        } catch (error) {
            return res.serverError(error);
        }
        return res.json(record.data);
    },
    paymentStatus: async function (req, res) {
        const {paymentStatus} = req.body;

        try {
            var record = await AssignmentService.paymentStatus(req, req.params.id, {paymentStatus:paymentStatus});
        } catch (error) {
            return res.serverError(error);
        }
        return res.json(record.data);
    },
    agentWiseSummary: async function (req, res) {
        const {to, from} = req.allParams();
        const filter = {};
        
        if(to) filter.to = to;
        if(from) filter.from = from;
        
        try {
            const record = await AssignmentService.agentWiseSummary(req, filter);
            return res.json(record.data);
        } catch (error) {
            return res.serverError(error);
        }
    },
    agentDurationWiseSummary: async function (req, res) {
        let { to, from, agentName, grouping = 'day' } = req.allParams();
      
        if (!to && !from) {
            const today = sails.dayjs();
            const startOfMonth = today.startOf('month');
            from = startOfMonth.format('YYYY-MM-DD');
            to = today.format('YYYY-MM-DD');
        }
    
        const filter = {
            ...(agentName && { agentName }),
            ...(grouping && { grouping }),
            ...(to && { to }),
            ...(from && { from })
        };
    
        try {
            const record = await AssignmentService.agentDurationWiseSummary(req, filter);
            return res.json(record.data);
        } catch (error) {
            return res.serverError(error);
        }
    },
  
    adjustment: async function (req, res) {

        try {
            var record = await AssignmentService.adjustment(req, req.params.id, req.body);
        } catch (error) {
            return res.serverError(error);
        }

        return res.json(record.data);
    },
    adjustmentDeleteOne: async function (req, res) {
        const index = req.body.detailIndex
        if(isNaN(index)) return res.badRequest('detailIndex is missing');



        try {
            var record = await AssignmentService.adjustmentDeleteOne(req, req.params.id, index);
        } catch (error) {
            return res.status(error?.statusCode).send(error.error); 
        }

        return res.json(record.data);
    },
    finishedPackageWiseSummary: async function (req, res) {
        const {to, from} = req.allParams();
        const filter = {};
        
        if(to) filter.to = to;
        if(from) filter.from = from;
        
        try {
            const record = await AssignmentService.finishedPackageWiseSummary(req, filter);
            return res.json(record.data);
        } catch (error) {
            return res.serverError(error);
        }
    },
    profitReports: async function (req, res) {
        const {to, from} = req.allParams();
        const filter = {};
        
        if(to) filter.to = to;
        if(from) filter.from = from;
        
        try {
            const record = await AssignmentService.profitReports(req , filter);
            return res.json(record.data);
        } catch (error) {
            return res.serverError(error);
        }
    },

      
};
