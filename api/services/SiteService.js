
module.exports = {
    find: function (ctx, filter, params) {
        return new Promise(async (resolve, reject) => {
            // if (!filter.company) {
            //     filter.company= ctx?.session?.activeCompany?.id;
            // }
            // if (!filter.company) {
            //     return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            // }
            if (filter.company) {
                delete filter.company
            }
            if (!params) {
                params = {};
            }
            if(!filter.hasOwnProperty('isDeleted')){
                filter.isDeleted = { '!=': true };
            }
            if (filter.title && filter.title.trim()){
                if(filter.exactMatchTitle){
                    filter.title = filter.title.trim();
                    delete filter.exactMatchTitle
                }else{
                    filter.title = { contains: filter.title.trim() };
                }
            } 
            if (filter.alias && filter.alias.trim()) filter.alias = { contains: filter.alias.trim() };
            if (filter.ids && filter.ids.trim()) {
                filter.id = filter.ids.split(',');
                delete filter.ids;
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
                var records = await Site.find(qryObj).meta({makeLikeModifierCaseInsensitive: true});
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.site.associations.length; ami++) {
                    assosiationModels[sails.models.site.associations[ami].alias] = sails.models.site.associations[ami].model;
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
                    var totalRecords = await Site.count(filter).meta({makeLikeModifierCaseInsensitive: true});
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
            };
            if (!filter.id) {
                return reject({ statusCode: 400, error: { message: 'id is required!' } });
            }
            // if (!filter.company) {
            //     return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            // }
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
                var record = await Site.findOne(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.site.associations.length; ami++) {
                    assosiationModels[sails.models.site.associations[ami].alias] = sails.models.site.associations[ami].model;
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
            return resolve(JSON.parse(JSON.stringify(record)));

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
            if(!data.area){
                return reject({ statusCode: 400, error: { message: 'area is required!' } });
            }
            if(!data.hasOwnProperty('status')){
                data.status=true
            }
            try {
                if (data.title && data.area) {
                    try {
                        const [duplicateSite] = await this.find(ctx, { title: data.title,  exactMatchTitle: true, area: data.area }, {limit:1});
                        if (duplicateSite) {
                            return reject({ statusCode: 400, error: { message: 'A site with the same title already exists on this area!' } });
                        }
                    } catch (error) {
                        return reject(error);
                    }
                }

                var record = await Site.create(data).fetch();
                
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            return resolve(record);
        })


    },
    duplicate: function (ctx, data) {
        return new Promise(async (resolve, reject) => {
            if (!data.company) {
                data.company= ctx?.session?.activeCompany?.id;
            }

            if (!data.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            if(!data.id){
                return reject({ statusCode: 400, error: { message: 'id is not allowed!' } });
            }
            if(!data.title){
                return reject({ statusCode: 400, error: { message: 'Title is required!' } });
            }
            let existingSite;
            try {
                const newData = await this.findOne(ctx, data.id);
                if(!newData){
                    return reject({ statusCode: 400, error: { message: 'site not found!' } });
                }
                if(newData){
                    existingSite = newData
                }
            } catch (error) {
                return reject(error);  
            }
            existingSite.title = data.title;
            existingSite.area =data.area;
            delete existingSite.id;
            delete existingSite.createdAt;
            delete existingSite.updatedAt;
    

            try {
                var record = await Site.create(existingSite).fetch();
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }

            return resolve({ data: record || { created: true } });
        })


    },
    updateOne: function (ctx, id, updtBody) {
        return new Promise(async (resolve, reject) => {
            const filter = {
                id: id,
            };
            // company: ctx?.session?.activeCompany?.id,
            if (!filter.id) {
                return reject({ statusCode: 400, error: { message: 'id is required!' } });
            }
            // if (!filter.company) {
            //     return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            // }
            // if (!updtBody.company) {
            //     updtBody.company= filter.company;
            // }
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
            if(updtBody.hasOwnProperty('area')&&!updtBody.area){
                return reject({ statusCode: 400, error: { message: 'area is required!' } });
            }
            if (updtBody.title && updtBody.area) {
                try {
                    const [duplicateSite] = await this.find(ctx, { title: updtBody.title, exactMatchTitle: true, area: updtBody.area }, {limit:1});
                    
                    if (duplicateSite?.id != id) {
                        return reject({ statusCode: 400, error: { message: 'A site with the same title already exists on this area!' } });
                    }
                } catch (error) {
                    return reject(error);
                }
            }
    
            try {
                var record = await Site.updateOne(filter).set(updtBody);
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
            };
            // company: ctx?.session?.activeCompany?.id,
            if (!filter.id) {
                return reject({ statusCode: 400, error: { message: 'id is required!' } });
            }
            // if (!filter.company) {
            //     return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            // }
            let deletedSite
            try {
                deletedSite =  await this.updateOne(ctx, id, {isDeleted:true})
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            return resolve(deletedSite);
        })
    },
    count: function (ctx, filter) {
        return new Promise(async (resolve, reject) => {
            if (!filter) {
                filter = {};
            }
            // if (!filter.company) {
            //     filter.company = ctx?.session?.activeCompany?.id;
            // }
            
            // if (!filter.company) {
            //     return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            // }
            if(!filter.hasOwnProperty('isDeleted')){
                filter.isDeleted = { '!=': true };
            }
            try {
                const count = await Site.count(filter);
                return resolve(count);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
        })
    }

}
