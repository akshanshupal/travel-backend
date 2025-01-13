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
            if (filter.clientName && filter.clientName.trim()) filter.clientName = { contains: filter.clientName.trim() };
            if (filter.email && filter.email.trim()) filter.email = { contains: filter.email.trim() };
            if (filter.mobile && filter.mobile.trim()) filter.mobile = { contains: filter.mobile.trim() };
            if (filter.tourDate) {
                let df = sails.dayjs(filter.tourDate).startOf('date').toDate();
                let dt = sails.dayjs(filter.tourDate).endOf('date').toDate();
                filter.tourDate = { '>=': df, '<=': dt };
            }
            if(filter.clientDetails){
                const searchCriteriaOr = [{ clientName: { contains: filter.clientDetails } },{ email: { contains: filter.clientDetails } },{ mobile: { contains: filter.clientDetails } }];
                filter.or = searchCriteriaOr;
                delete filter.clientDetails
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
                var records = await ClientItinerary.find(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.clientitinerary.associations.length; ami++) {
                    assosiationModels[sails.models.clientitinerary.associations[ami].alias] = sails.models.clientitinerary.associations[ami].model;
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
                    var totalRecords = await ClientItinerary.count(filter)
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
                var record = await ClientItinerary.findOne(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.clientitinerary.associations.length; ami++) {
                    assosiationModels[sails.models.clientitinerary.associations[ami].alias] = sails.models.clientitinerary.associations[ami].model;
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
            if(record?.clientArea){
                let obj = record.clientArea;
                function isBase64(str) {
                    try {
                        return btoa(atob(str)) === str;
                    } catch (err) {
                        return false;
                    }
                }
                if (obj.description && isBase64(obj.description)) {
                    let con = Buffer.from(obj.description, 'base64');
                    obj.description = con.toString('utf8');
                }
                if (obj.headerContent && isBase64(obj.headerContent)) {
                    let con = Buffer.from(obj.headerContent, 'base64');
                    obj.headerContent = con.toString('utf8');
                }
                if (obj.footerContent && isBase64(obj.footerContent)) {
                    let con = Buffer.from(obj.footerContent, 'base64');
                    obj.footerContent = con.toString('utf8');
                }
                record.clientArea = obj;
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
            if(!data.itinerary){
                return reject({ statusCode: 400, error: { message: 'itinerary id is required!' } });
            }
            if (data?.tourDate && typeof data?.tourDate === 'string') {
                data.tourDate = sails.dayjs(data.tourDate);
                if (!data.tourDate.isValid()) {
                    return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid tourDate is required!' } });
                } else {
                    data.tourDate = data.tourDate.toDate();
                }
            }
            if(!data.hasOwnProperty('status')){
                data.status = true
            }
            let itineraryData;
            try {
                const {data: dt} = await ItineraryService.findOne(ctx,data.itinerary, {select: ['area','sites'], populate : ['area','site', 'hotel'], populate_select: {select_area: ['id','title','headerContent','footerContent','description', 'featureImg', 'hotelImg'], select_site: ['id','title','description','featureImg'], select_hotel: ['id','title','description','featureImg']}});
                if(!dt){
                    return reject({ statusCode: 400, error: { message: 'itinerary not found!' } });
                }
                itineraryData = dt;
                
            } catch (error) {
                return reject(error); 
            }
            data.clientArea = itineraryData.area;
            data.clientSites = itineraryData.sites;

            data.createdBy = ctx?.session?.user?.id;

            if (avoidRecordFetch) {
                try {
                    var record = await ClientItinerary.create(data);
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
            } else {
                try {
                    var record = await ClientItinerary.create(data).fetch();
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

            updtBody.updatedBy = ctx?.session?.user?.id;


            try {
                var record = await ClientItinerary.updateOne(filter).set(updtBody);
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
            let deletedData
            try {
                deletedData =  await this.updateOne(ctx, id, {isDeleted:true, deletedAt: new Date(), deletedBy: ctx?.user?.id})
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            return resolve(deletedData);

            // return resolve({ data: { deleted: true } });
        })
    }
}
