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
            var records = await UserService.find(req, filter, params);
        } catch (error) {
            return res.status(error?.statusCode).send(error.error); 
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
            var record = await UserService.findOne(req, req.params.id,params);
        } catch (error) {
            return res.status(error?.statusCode).send(error.error); 
        }
        
        return res.json(record);
    },


    create: async function (req, res) {
        if (!req.body.username) {
            return res.badRequest({ code: 'Error', message: 'username is missing' });
        }
        if (!req.body.firstName) {
            return res.badRequest({ code: 'Error', message: 'firstName is missing' });
        }
        if (!req.body.mobile) {
            return res.badRequest({ code: 'Error', message: 'mobile is missing' });
        }

        try {
            var record = await UserService.create(req, req.body);
        } catch (error) {
            return res.status(error?.statusCode).send(error.error); 
        }

        return res.json(record);
    },

    updateOne: async function (req, res) {

        try {
            var record = await UserService.updateOne(req, req.params.id, req.body);
        } catch (error) {
            return res.status(error?.statusCode).send(error.error); 
        }

        return res.json(record);
    },
    deleteOne: async function (req, res) {

        try {
            var record = await UserService.deleteOne(req, req.params.id);
        } catch (error) {
            return res.serverError(error);
        }

        return res.json(record);
    },
    getCacheUser: async function (req, res) {
        if(!req.params.id)   return res.badRequest('ID is missing');

        try {
            var record = await UserService.getCacheUser(req, req.params.id);
        } catch (error) {
            return res.status(error?.statusCode).send(error.error); 
        }
        
        return res.json(record);
    },

};
