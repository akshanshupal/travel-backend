const { Parser } = require('json2csv');

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
            var records = await HotelService.find(req, filter, params);
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
            var record = await HotelService.findOne(req, req.params.id,params);
        } catch (error) {
            return res.status(error?.statusCode).send(error.error); 

        }
        
        return res.json(record);
    },

    create: async function (req, res) {
        if (!req.body.name) {
            return res.badRequest({ code: 'Error', message: 'name is missing' });
        }

        try {
            var record = await HotelService.create(req, req.body);
        } catch (error) {
            return res.status(error?.statusCode).send(error.error); 

        }

        return res.json(record.data);
    },

    updateOne: async function (req, res) {

        try {
            var record = await HotelService.updateOne(req, req.params.id, req.body);
        } catch (error) {
            return res.status(error?.statusCode).send(error.error); 

        }

        return res.json(record.data);
    },
    deleteOne: async function (req, res) {

        try {
            var record = await HotelService.deleteOne(req, req.params.id);
        } catch (error) {
            return res.status(error?.statusCode).send(error.error); 

        }

        return res.json(record.data);
    },
    async exportNoHotelImageCsv(req, res) {
        try {
        let {page,limit} = req.query;
        const filter = {page,limit}

          const record = await HotelService.getHotelWithNoImage(req, filter);
          const fields = Object.keys(record[0]);
          const json2csvParser = new Parser({ fields });
          const csv = json2csvParser.parse(record);
          res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
          res.setHeader('Content-Type', 'text/csv');
        //   return res.json(record)
    
          return res.send(csv);
        } catch (error) {
          return res.status(error?.statusCode).send(error.error); 
        }
      }

};
