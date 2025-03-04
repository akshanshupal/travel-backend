
module.exports = {
    find: function (ctx, filter, params) {
        return new Promise(async (resolve, reject) => {
            if (!filter.company) {
                filter.company= ctx?.session?.activeCompany?.id;
            }
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            let populateSites;
            let populateHotels;
            let populatePackageTags;
            let populatePackageTypes
            if(filter.populateSites){
                populateSites = true;
                delete filter.populateSites
            }
            if(filter.populateHotels){
                populateHotels = true;
                delete filter.populateHotels
            }
            if(filter.populatePackageTags){
                populatePackageTags = true;
                delete filter.populatePackageTags
            }
            if(filter.populatePackageTypes){
                populatePackageTypes = true;
                delete filter.populatePackageTypes
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
            if(records.length&&(populateSites||populateHotels||populatePackageTags||populatePackageTypes)){
                

                for(let i=0;i<records.length;i++){
                    if(params.populate.includes('itinerary')){
                        const itinerary = records[i].itinerary;
                        if (itinerary.sites?.length) {
                            for (let i = 0; i < itinerary.sites.length; i++) {
                                let siteObj = itinerary.sites[i];
                        
                                if (populateSites && siteObj.siteId) {
                                    let site;
                                    try {
                                        site = await SiteService.findOne(ctx, siteObj.siteId, { select: ['id', 'title', 'alias', 'description', 'featureImg'] });
                                    } catch (error) {
                                        console.log(error)
                                        return reject({ statusCode: 500, error: error }); 
                                    }
                                    if (site) {
                                        siteObj = { ...site, hotels: siteObj.hotels || [], days: itinerary.sites[i].days || 1 };
                                    }
                                }
                        
                                if (populateHotels && siteObj.hotels?.length) {
                                    for (let j = 0; j < siteObj.hotels.length; j++) {
                                        const hotelId = siteObj.hotels[j];
                                        let hotel
                                        try {
                                            hotel = await HotelService.findOne(ctx, hotelId, { select: ['id', 'name'] });
                                        } catch (error) {
                                            console.log(error); 
                                        }
                                        if (hotel) {
                                            siteObj.hotels[j] = hotel;
                                        }else{
                                            siteObj.hotels.splice(j, 1);
                                            j--; 
                                            
                                        }
                                    }
                                }
                        
                                itinerary.sites[i] = siteObj;
                            }
                        }
                        records[i].itinerary = itinerary;
                    }
                    if(populatePackageTags&&records[i]?.packageTags?.length){
                        const packagetags = records[i].packageTags;
                        let packageTagsObj = [];
                        for(let y=0;y<packagetags.length;y++){
                            const packageTagId = packagetags[y];
                            try {
                                const {data} = await PackageTagService.findOne(ctx, packageTagId, { select: ['id', 'title'] });
                                if(data){
                                    packageTagsObj.push(data)
                                }
                            } catch (error) {
                                console.log(error); 
                            }


                        }
                        records[i].packageTags = packageTagsObj
                    }
                    if(populatePackageTypes&&records[i]?.packageTypes?.length){
                        const packagetypes = records[i].packageTypes;
                        let packageTypeObj = [];
                        for(let y=0;y<packagetypes.length;y++){
                            const packageTypeId = packagetypes[y];
                            try {
                                const {data} = await PackageTypeService.findOne(ctx, packageTypeId, { select: ['id', 'title'] });
                                if(data){
                                    packageTypeObj.push(data)
                                }
                            } catch (error) {
                                console.log(error); 
                            }


                        }
                        records[i].packageTypes = packageTypeObj
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
            let deletedPackage
            try {
                deletedPackage =  await this.updateOne(ctx, id, {isDeleted:true, deletedAt: new Date(), deletedBy: ctx?.user?.id})
                if(deletedPackage?.data?.id){
                    try {
                        const {data} = await this.findOne(ctx, id, {select: ['itinerary']});
                        if(data?.itinerary){
                            await ItineraryService.updateOne(ctx, data.itinerary, { package: null });
                        }
                    } catch (error) {
                        return reject({ statusCode: 500, error: error });
                    }
                }
                // Update the related Itinerary and set package to null
                // if (ctx.itinerary) {
                //     await ItineraryService.updateOne(ctx, ctx.itinerary, { package: null });
                // }
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            return resolve(deletedPackage);
        })
    },

}
