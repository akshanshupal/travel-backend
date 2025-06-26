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
            if ('populateUser' in filter) {
                delete filter.populateUser;
              }
            try {
                var records = await Campaign.find(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.campaign.associations.length; ami++) {
                    assosiationModels[sails.models.campaign.associations[ami].alias] = sails.models.campaign.associations[ami].model;
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
            if(params.populateUser){
                if(records.length>0){
                    for(let i=0;i<records.length;i++){
                        const record = records[i];
                        if(Array.isArray(record.managingCampaign)&& record.managingCampaign.length>0){
                            const updatedUsers = [];
                            for(let j=0;j<record.managingCampaign.length;j++){
                                try {
                                    const data = await UserService.findOne(ctx,record.managingCampaign[j],{select:["name","email","mobile"]});
                                    if(data){
                                        record.managingCampaign[j] = data;
                                    }
                                }catch(error){
                                    console.log(error);
                                }
                            }
                        }
                        if(Array.isArray(record.salesExecutive)&& record.salesExecutive.length>0){
                            for(let j=0;j<record.salesExecutive.length;j++){
                                try {
                                    const data = await UserService.findOne(ctx,record.salesExecutive[j],{select:["name","email","mobile"]});
                                    if(data){
                                        record.salesExecutive[j] = data;
                                    }
                                }catch(error){
                                    console.log(error);
                                }
                            }
                        }
                    }
                    

                }
             

            }
            const rtrn = { data : records }
            //totalCount
            if (params.totalCount) {
                try {
                    var totalRecords = await Campaign.count(filter)
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
                rtrn.totalCount = totalRecords;

            }else{
                return resolve(rtrn.data);
            }
         
            // const rtrn = { data: record }
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
                var record = await Campaign.findOne(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.campaign.associations.length; ami++) {
                    assosiationModels[sails.models.campaign.associations[ami].alias] = sails.models.campaign.associations[ami].model;
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
            if(params.populateUser){
                if(record?.managingCampaign?.length>0){
                    for(let i=0;i<record.managingCampaign.length;i++){
                        try {
                            const data = await UserService.findOne(ctx,record.managingCampaign[i],{select:["name","email","mobile"]});
                            if(data){
                                record.managingCampaign[i] = data;
                            }
                        }catch(error){
                            console.log(error);
                            
                        }  
                    }
                    
                }
                if(record?.salesExecutive?.length>0){
                    for(let i=0;i<record.salesExecutive.length;i++){
                        try {
                            const data = await UserService.findOne(ctx,record.salesExecutive[i],{select:["name","email","mobile"]});
                            if(data){
                                record.salesExecutive[i] = data;
                            }
                        }catch(error){
                            console.log(error);
                            
                        }  
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

            if (avoidRecordFetch) {
                try {
                    var record = await Campaign.create(data);
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
            } else {
                try {
                    var record = await Campaign.create(data).fetch();
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

            try {
                var record = await Campaign.updateOne(filter).set(updtBody);
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
                await Campaign.destroyOne(filter);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }


            return resolve({ data: { deleted: true } });
        })
    },
    pauseFunction: function (ctx, updtBody) {
        return new Promise(async (resolve, reject) => {
            const filter = {
                // id: id,
                company: ctx?.session?.activeCompany?.id,
            };
            // if (!filter.id) {
            //     return reject({ statusCode: 400, error: { message: 'id is required!' } });
            // }
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            if (!updtBody.company) {
                updtBody.company= filter.company;
            }
            const updatePayload = {
                pause: updtBody.status,
            }
            await Campaign.update({id: updtBody.campaignIds}).set(updatePayload)
            try {
                var record = await Campaign.update(filter).set(updtBody);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            return resolve({ data: record || { modified: true } });
        })
    },
}
