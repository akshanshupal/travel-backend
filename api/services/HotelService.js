  
module.exports = {

    find: function (ctx, filter, params) {
        return new Promise(async (resolve, reject) => {
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            if (!params) {
                params = {};
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
                var records = await Hotel.find(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.hotel.associations.length; ami++) {
                    assosiationModels[sails.models.hotel.associations[ami].alias] = sails.models.hotel.associations[ami].model;
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
                    var totalRecords = await Hotel.count(filter)
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
                var record = await Hotel.findOne(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.hotel.associations.length; ami++) {
                    assosiationModels[sails.models.hotel.associations[ami].alias] = sails.models.hotel.associations[ami].model;
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
            if (!data.name) {
                return reject({ statusCode: 400, error: { message: 'name is required!' } });
            }
            if (!data.category) {
                return reject({ statusCode: 400, error: { message: 'category is required!' } });
            }

            if (avoidRecordFetch) {
                try {
                    var record = await Hotel.create(data);
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
            } else {
                try {
                    var record = await Hotel.create(data).fetch();
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
            if (updtBody.hasOwnProperty('name')&&!updtBody.name) {
                return reject({ statusCode: 400, error: { message: 'name is required!' } });
            }
            if (updtBody.hasOwnProperty('category')&&!updtBody.category) {
                return reject({ statusCode: 400, error: { message: 'category is required!' } });
            }

            let data = {};
            if(updtBody.hasOwnProperty('name')){
                data.name = updtBody.name;
            }
            if(updtBody.hasOwnProperty('location')){
                data.location = updtBody.location;
            }
            if(updtBody.hasOwnProperty('address')){
                data.address = updtBody.address;
            }
            if(updtBody.hasOwnProperty('category')){
                data.category = updtBody.category;
            }
            if(updtBody.hasOwnProperty('status')){
                data.status = updtBody.status;
            }

            try {
                var record = await Hotel.updateOne(filter).set(updtBody);
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
                await Hotel.destroyOne(filter);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }


            return resolve({ data: { deleted: true } });
        })
    }
}
