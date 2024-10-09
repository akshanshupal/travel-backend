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
                var records = await HotelCategory.find(qryObj).meta({makeLikeModifierCaseInsensitive: true});
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.hotelcategory.associations.length; ami++) {
                    assosiationModels[sails.models.hotelcategory.associations[ami].alias] = sails.models.hotelcategory.associations[ami].model;
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
                    var totalRecords = await HotelCategory.count(filter).meta({makeLikeModifierCaseInsensitive: true});
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
                var record = await HotelCategory.findOne(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.hotelcategory.associations.length; ami++) {
                    assosiationModels[sails.models.hotelcategory.associations[ami].alias] = sails.models.hotelcategory.associations[ami].model;
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
            if (!data.title) {
                return reject({ statusCode: 400, error: { message: 'title is required!' } });
            }
            if (!data.alias) {
                return reject({ statusCode: 400, error: { message: 'alias is required!' } });
            }
            // if (!data.hasOwnProperty('status')) {
            //     return reject({ statusCode: 400, error: { message: 'status is required!' } });
            // }
            if(!data.hasOwnProperty('status')){
                data.status = true
            }
            if (avoidRecordFetch) {
                try {
                    var record = await HotelCategory.create(data);

                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
            } else {
                try {
                    var record = await HotelCategory.create(data).fetch();

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
            const data = {}
            if (updtBody.hasOwnProperty('title')) {
                data.title= updtBody.title;
            }
            if (updtBody.hasOwnProperty('alias')) {
                data.alias= updtBody.alias;
            }
            if (updtBody.hasOwnProperty('status')) {
                data.status= updtBody.status;
            }

            try {
                var record = await HotelCategory.updateOne(filter).set(data);
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
                await HotelCategory.destroyOne(filter);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }


            return resolve({ data: { deleted: true } });
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
                const count = await HotelCategory.count(filter);
                return resolve(count);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
        })
    }
}
