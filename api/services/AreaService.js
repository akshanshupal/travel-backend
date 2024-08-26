
module.exports = {
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
            if (filter.title && filter.title.trim()) filter.title = { contains: filter.title.trim() };
            if (filter.alias && filter.alias.trim()) filter.alias = { contains: filter.alias.trim() };


            
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
                var records = await Area.find(qryObj).meta({makeLikeModifierCaseInsensitive: true});
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.area.associations.length; ami++) {
                    assosiationModels[sails.models.area.associations[ami].alias] = sails.models.area.associations[ami].model;
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
                    var totalRecords = await Area.count(filter).meta({makeLikeModifierCaseInsensitive: true});
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
                var record = await Area.findOne(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.area.associations.length; ami++) {
                    assosiationModels[sails.models.area.associations[ami].alias] = sails.models.area.associations[ami].model;
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
            return resolve(record);
        })
    },
    create: function (ctx, data) {
        return new Promise(async (resolve, reject) => {
            if (!data.company) {
                data.company= ctx?.session?.activeCompany?.id;
            }
   
            if (!data.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            if(!data.title){
                return reject({ statusCode: 400, error: { message: 'Title is required!' } });
            }
            if(!data.alias){
                return reject({ statusCode: 400, error: { message: 'Alias is required!' } });
            }
            if(!data.description){
                return reject({ statusCode: 400, error: { message: 'Alias is required!' } });
            }
            if(!data.featureImg){
                return reject({ statusCode: 400, error: { message: 'featureImg is required!' } });
            }
            if(!data.hasOwnProperty('status')){
                data.status=true
            }


            try {
                var record = await Area.create(data).fetch();
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }

            return resolve(record);
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
            if(updtBody.hasOwnProperty('title')&&!updtBody.title){
                return reject({ statusCode: 400, error: { message: 'title is required!' } });
            }
            if(updtBody.hasOwnProperty('alias')&&!updtBody.alias){
                return reject({ statusCode: 400, error: { message: 'alias is required!' } });
            }
            if(updtBody.hasOwnProperty('description')&&!updtBody.description){
                return reject({ statusCode: 400, error: { message: 'description is required!' } });
            }
            if(updtBody.hasOwnProperty('featureImg')&&!updtBody.featureImg){
                return reject({ statusCode: 400, error: { message: 'featureImg is required!' } });
            }
            try {
                var record = await Area.updateOne(filter).set(updtBody);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            return resolve(record);
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
            let deletedArea
            try {
                deletedArea =  await this.updateOne(ctx, id, {isDeleted:true})
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            return resolve(deletedArea);
        })
    },
    count: function (ctx, filter) {
        return new Promise(async (resolve, reject) => {
            if (!filter) {
                filter = {};
            }
            if (!filter.company) {
                filter.company = ctx?.session?.activeCompany?.id;
            }
            
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            if(!filter.hasOwnProperty('isDeleted')){
                filter.isDeleted = { '!=': true };
            }
            try {
                const count = await Area.count(filter);
                return resolve(count);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
        })
    }
}
