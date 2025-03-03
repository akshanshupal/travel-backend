module.exports = {
    find: function (ctx, filter, params) {
        return new Promise(async (resolve, reject) => {
            if (!filter.company) {
                filter.company= ctx?.session?.activeCompany?.id;
            }
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            if (!params) {
                params = {};
            }
            if(!filter.hasOwnProperty('isDeleted')){
                filter.isDeleted = { '!=': true };
            }
            if (filter.tourDate) {
                let df = sails.dayjs(filter.tourDate).startOf('date').toDate();
                let dt = sails.dayjs(filter.tourDate).endOf('date').toDate();
                filter.tourDate = { '>=': df, '<=': dt };
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
                var records = await Package.find(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.package.associations.length; ami++) {
                    assosiationModels[sails.models.package.associations[ami].alias] = sails.models.package.associations[ami].model;
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
                    var totalRecords = await Package.count(filter)
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
                var record = await Package.findOne(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.package.associations.length; ami++) {
                    assosiationModels[sails.models.package.associations[ami].alias] = sails.models.package.associations[ami].model;
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
            if (!data.url) {
                return reject({ statusCode: 400, error: { message: 'packageUrl is required!' } });
            }
            try {
                let [existingPackage] = await this.find(ctx,{ url: data.url}, {pagination: {limit:1}});
                if (existingPackage) {
                    return reject({ statusCode: 400, error: { message: 'Package already exists with this url!' } });
                }
            } catch (error) {
                return reject(error)
                
            }

            if(!data.hasOwnProperty('status')){
                data.status = true
            }

            if (data?.startDate && typeof data?.startDate === 'string') {
                data.startDate = sails.dayjs(data.startDate);
                if (!data.startDate.isValid()) {
                    return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid startDate is required!' } });
                } else {
                    data.startDate = data.startDate.toDate();
                }
            }
            if (data?.endDate && typeof data?.endDate === 'string') {
                data.endDate = sails.dayjs(data.endDate);
                if (!data.endDate.isValid()) {
                    return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid endDate is required!' } });
                } else {
                    data.endDate = data.endDate.toDate();
                }
            }

            if (avoidRecordFetch) {
                try {
                    var record = await Package.create(data);
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
            } else {
                try {
                    var record = await Package.create(data).fetch();
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
            }
            if(record?.id){
                try {
                    await ItineraryService.updateOne(ctx, record.itinerary, { package: record.id });
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
            if(updtBody.url){
                try {
                    let [existingPackage] = await this.find(ctx,{ url: updtBody.url, id: { '!=': id }}, {pagination: {limit:1}});
                    if (existingPackage) {
                        return reject({ statusCode: 400, error: { message: 'Package already exists with this url!' } });
                    }
                } catch (error) {
                    return reject(error)
                    
                }
            }
            if (updtBody?.tourDate && typeof updtBody?.tourDate === 'string') {
                updtBody.tourDate = sails.dayjs(updtBody.tourDate);
                if (!updtBody.tourDate.isValid()) {
                    return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid tourDate is required!' } });
                } else {
                    updtBody.tourDate = updtBody.tourDate.toDate();
                }
            }
            try {
                var record = await Package.updateOne(filter).set(updtBody);
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
            let deletedArea
            try {
                deletedArea =  await this.updateOne(ctx, id, {isDeleted:true, deletedAt: new Date(), deletedBy: ctx?.user?.id})
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            return resolve(deletedArea);
        })
    },

    findByUrl: function (ctx, url,params) {
        return new Promise(async (resolve, reject) => {
            const filter = {
                url: url,
                company: ctx?.session?.activeCompany?.id,
            };
            if (!filter.url) {
                return reject({ statusCode: 400, error: { message: 'url is required!' } });
            }
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            try {
                var record = await this.find(ctx, filter, params);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            return resolve({ data: record });
        })
    }
}
