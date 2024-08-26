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
                var records = await User.find(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.user.associations.length; ami++) {
                    assosiationModels[sails.models.user.associations[ami].alias] = sails.models.user.associations[ami].model;
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
                    var totalRecords = await User.count(filter)
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
                return reject({ statusCode: 400, error: { message: 'id is required!' } });
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
                var record = await User.findOne(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.user.associations.length; ami++) {
                    assosiationModels[sails.models.user.associations[ami].alias] = sails.models.user.associations[ami].model;
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
    create: function (ctx, data, avoidRecordFetch) {
        return new Promise(async (resolve, reject) => {
            if (!data.company) {
                data.company= ctx?.session?.activeCompany?.id;
            }
            if (!data.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            if (!data.username) {
                return reject({ statusCode: 400, error: { message: 'username is required!' } });
            }
            if (!data.firstName) {
                return reject({ statusCode: 400, error: { message: 'firstName is required!' } });
            }
            if (!data.mobile) {
                return reject({ statusCode: 400, error: { message: 'mobile is required!' } });
            }
            let existingUser;
            try {
                existingUser = await this.getCacheUserByUsername(ctx, data.username)
            } catch (error) {
                return reject({ statusCode: 400, error: { message: 'error in fetching existing user' } });
            }
            if(existingUser){
                return reject({ statusCode: 400, error: { message: 'user already exist with same username!' } });
            }
            try {
                var record = await User.create(data).fetch();
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

            try {
                var record = await User.updateOne(filter).set(updtBody);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            this.deleteCacheUser(record)
            return resolve(record);
        })
    },
    deleteOne: function (ctx, id) {
        return new Promise(async (resolve, reject) => {
            if (!id) {
                return reject({ statusCode: 400, error: { message: 'id is required!' } });
            }
            if (!ctx?.session?.activeCompany?.id) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            let deletedUser
            try {
                deletedUser =  await this.updateOne(ctx, id, {isDeleted:true})
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if(deletedUser){
                this.deleteCacheUser(deletedUser)
            }
            return resolve(deletedUser);
        })
    },
    getCacheUser: function(ctx,id){
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
            const key = `user:${id}`
            let cacheUser = await sails.redis.hgetall(key);
            if(cacheUser&&Object.entries(cacheUser).length > 0 && cacheUser.constructor === Object){
                return resolve({ data: cacheUser });
            }
            let findUser
            try {
                findUser = await this.findOne(ctx,id)
            } catch (error) {
                reject(error) 
            }
            sails.redis.pipeline().hset(key, findUser.data).expire(key, sails.config.redis.expire).exec()

            return resolve(findUser);
        })  
    },
    getCacheUserByUsername: function(ctx,username){
        return new Promise(async (resolve, reject) => {
            const filter = {
                username: username,
                company: ctx?.session?.activeCompany?.id,
            };
            if (!filter.username) {
                return reject({ statusCode: 400, error: { message: 'username is required!' } });
            }
            filter.username = filter.username.trim().toLowerCase();
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            const key = `user:${filter.username}:${filter.company}`
            let cacheUser = await sails.redis.hgetall(key);
            if(cacheUser&&Object.entries(cacheUser).length > 0 && cacheUser.constructor === Object){
                return resolve(cacheUser);
            }
            let existingUser;
            try {
                existingUser = await this.find(ctx, {username: data.username, company: data.company})
            } catch (error) {
                return reject({ statusCode: 400, error: { message: 'error in fetching existing user' } });
            }
            if(!existingUser?.length){
                return reject({ statusCode: 404, error: { message: 'user not found' } });   
            }
            sails.redis.pipeline().hset(key, existingUser[0]).expire(key, sails.config.redis.expire).exec()
            return resolve(existingUser[0]);
        })  
    },
    deleteCacheUser(user){
        const key =`user:${user.id}`
        const keyUsername =`user:${user.username}:${user.company}`
        sails.redis.del(key);
        sails.redis.del(keyUsername);
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
                const count = await User.count(filter);
                return resolve(count);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
        })
    }
}
