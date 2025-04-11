const {ObjectId} = require('mongodb');
module.exports = {

    find: function (ctx, filter, params) {
        return new Promise(async (resolve, reject) => {
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            if (!filter.sendBy) {
                return reject({ statusCode: 400, error: { message: 'sendBy id is required!' } });
            }
            if (!params) {
                params = {};
            }
            if (filter.from && filter.to) {
                let df = sails.dayjs(filter.from).startOf('date').toDate();
                let dt = sails.dayjs(filter.to).endOf('date').toDate();
                filter.createdAt = { '>=': df, '<=': dt };
            }
            delete filter.from
            delete filter.to;

            if(filter?.emailFunction?.trim()){
                filter.emailFunction =  filter.emailFunction.split(',');
            }

            if(filter.hasOwnProperty('packageId')&&filter.packageId){
                filter.packageId = { contains: filter.packageId.trim() };
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
                var records = await Sendmail.find(qryObj).meta({makeLikeModifierCaseInsensitive: true});;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.sendmail.associations.length; ami++) {
                    assosiationModels[sails.models.sendmail.associations[ami].alias] = sails.models.sendmail.associations[ami].model;
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
                    var totalRecords = await Sendmail.count(filter).meta({makeLikeModifierCaseInsensitive: true})
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
                var record = await Sendmail.findOne(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.sendmail.associations.length; ami++) {
                    assosiationModels[sails.models.sendmail.associations[ami].alias] = sails.models.sendmail.associations[ami].model;
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

            if (avoidRecordFetch) {
                try {
                    var record = await Sendmail.create(data);
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
            } else {
                try {
                    var record = await Sendmail.create(data).fetch();
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
                var record = await Sendmail.updateOne(filter).set(updtBody);
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
                await Sendmail.destroyOne(filter);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }


            return resolve({ data: { deleted: true } });
        })
    },
    agentWiseSendMails: function (ctx, filter) {
        return new Promise(async (resolve, reject) => {
            filter.company = ctx?.session?.activeCompany?.id
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
          try {
            let matchStage = { isDeleted: {$ne: true}, company: new ObjectId(filter.company) };
            if(filter.emailFunction){
                matchStage.emailFunction= filter.emailFunction
            }
      
            if (filter.from && filter.to) {
              matchStage.createdAt = {
                $gte: sails.dayjs(filter.from).startOf('day').toDate(),
                $lte: sails.dayjs(filter.to).endOf('day').toDate(),
              };
            } else if (filter.from) {
              matchStage.createdAt = {
                $gte: sails.dayjs(filter.from).startOf('day').toDate(),
              };
            } else if (filter.to) {
              matchStage.createdAt = {
                $lte: sails.dayjs(filter.to).endOf('day').toDate(),
              };
            }
      
            let aggregateArr = [
              { $match: matchStage },
              {
                $group: {
                  _id: '$sendBy',
                  totalMails: { $sum: 1 },
                },
              },
              {
                $lookup: {
                  from: 'user',
                  localField: '_id',
                  foreignField: '_id',
                  as: 'sendBy',
                },
              },
              {
                $unwind: '$sendBy',
              },
              {
                $project: {
                  _id: 0,
                  user: '$sendBy.name', // change if needed
                  totalMails: 1,
                },
              },
              {$sort: {
                totalMails: -1
              }}
            ];
      
            const result = await Sendmail.getDatastore()
            .manager
            .collection('sendmail')
            .aggregate(aggregateArr)
            .toArray()
          
      
            resolve({data:result});
          } catch (err) {
            reject(err);
          }
        });
    }, 
    
    agentDurationWiseSendMails: async function (req, filter) {
        // Add index recommendation
        // db.sendmail.createIndex({ createdAt: 1, company: 1, emailFunction: 1, salesExecutive: 1 })
        
        const { grouping, from, to } = filter;
        const originalStart = sails.dayjs(from).startOf('day');
        const originalEnd = sails.dayjs(to).endOf('day');

        // Optimize match query first
        const matchQuery = {
            createdAt: { 
                $gte: originalStart.toDate(), 
                $lte: originalEnd.toDate() 
            }
        };
        
        // Convert sendBy to ObjectId if present
        if (filter.sendBy) {
            matchQuery.sendBy = new ObjectId(filter.sendBy);
        }
        if (filter.emailFunction) matchQuery.emailFunction = filter.emailFunction;

        // Optimize aggregation based on grouping
        const aggregationPipeline = [];
        aggregationPipeline.push({ $match: matchQuery });

        // Add lookup for user details
        aggregationPipeline.push({
            $lookup: {
                from: 'user',
                localField: 'sendBy',
                foreignField: '_id',
                as: 'userDetails'
            }
        });

        // Unwind the user details
        aggregationPipeline.push({
            $unwind: {
                path: '$userDetails',
                preserveNullAndEmptyArrays: true
            }
        });

        switch (grouping) {
            case 'week':
                aggregationPipeline.push({
                    $group: {
                        _id: {
                            year: { $isoWeekYear: "$createdAt" },
                            week: { $isoWeek: "$createdAt" }
                        },
                        totalMails: { $sum: 1 },
                        userName: { $first: '$userDetails.name' }
                    }
                });
                break;

            case 'month':
                aggregationPipeline.push({
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" }
                        },
                        totalMails: { $sum: 1 },
                        userName: { $first: '$userDetails.name' }
                    }
                });
                break;

            default: // day
                aggregationPipeline.push({
                    $group: {
                        _id: {
                            date: { 
                                $dateToString: { 
                                    format: "%Y-%m-%d", 
                                    date: "$createdAt" 
                                }
                            }
                        },
                        totalMails: { $sum: 1 },
                        userName: { $first: '$userDetails.name' }
                    }
                });
        }

        // Add sorting at database level
        aggregationPipeline.push({ $sort: { "_id": 1 } });

        // Execute aggregation
        const result = await Sendmail.getDatastore()
            .manager
            .collection('sendmail')
            .aggregate(aggregationPipeline)
            .toArray();

        // Generate intervals only once
        const intervals = [];
        let cursor = originalStart;
        
        if (grouping === 'week') {
            cursor = cursor.startOf('isoWeek');
            while (cursor.isBefore(originalEnd)) {
                const year = cursor.isoWeekYear();
                const week = cursor.isoWeek();
                intervals.push({
                    field: `Week ${week}, ${year}`,
                    fromDate: cursor.format('YYYY-MM-DD'),
                    toDate: sails.dayjs(cursor).endOf('isoWeek').format('YYYY-MM-DD'),
                    key: `${year}-${week}`,
                    totalMails: 0,
                    userName: null
                });
                cursor = cursor.add(1, 'week');
            }
        } else if (grouping === 'month') {
            cursor = cursor.startOf('month');
            while (cursor.isBefore(originalEnd)) {
                intervals.push({
                    field: cursor.format('MM-YYYY'),
                    fromDate: cursor.format('YYYY-MM-DD'),
                    toDate: cursor.endOf('month').format('YYYY-MM-DD'),
                    key: `${cursor.year()}-${cursor.month() + 1}`,
                    totalMails: 0,
                    userName: null
                });
                cursor = cursor.add(1, 'month');
            }
        } else {
            while (cursor.isBefore(originalEnd) || cursor.isSame(originalEnd, 'day')) {
                const date = cursor.format('YYYY-MM-DD');
                intervals.push({
                    field: date,
                    fromDate: date,
                    toDate: date,
                    key: date,
                    totalMails: 0,
                    userName: null
                });
                cursor = cursor.add(1, 'day');
            }
        }

        // Create efficient lookup map
        const intervalMap = new Map(
            intervals.map(interval => [interval.key, interval])
        );

        // Merge results efficiently
        result.forEach(r => {
            const key = grouping === 'day' 
                ? r._id.date 
                : `${r._id.year}-${r._id.week || r._id.month}`;
            
            const interval = intervalMap.get(key);
            if (interval) {
                interval.totalMails = r.totalMails;
                interval.userName = r.userName;
            }
        });

        return { data: Array.from(intervalMap.values()) };
    }


}
