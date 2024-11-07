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
                var records = await HotelImage.find(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.hotelimage.associations.length; ami++) {
                    assosiationModels[sails.models.hotelimage.associations[ami].alias] = sails.models.hotelimage.associations[ami].model;
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
                    var totalRecords = await HotelImage.count(filter)
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
                var record = await HotelImage.findOne(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.hotelimage.associations.length; ami++) {
                    assosiationModels[sails.models.hotelimage.associations[ami].alias] = sails.models.hotelimage.associations[ami].model;
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
            // try {
            //     // Function to process and save images in batches
            //     async function saveImagesInBatches(images, batchSize) {
            //       for (let i = 0; i < images.length; i += batchSize) {
            //         const batch = images.slice(i, i + batchSize);
            //         await HotelImage.createEach(batch);
            //         console.log(`Batch ${Math.ceil(i / batchSize) + 1} saved`);
            //       }
            //     }
            
            //     // Fetch all hotels to create a map of SQL ID to MongoDB ID
            //     const hotels = await Hotel.find();
            //     const hotelMap = hotels.reduce((map, hotel) => {
            //       map[hotel.sqlId] = hotel.id;
            //       return map;
            //     }, {});
            
            //     // Transform the data
            //     const imagesToSave = hotelImagesData.map(item => {
            //         let itm = {
            //             hotel: hotelMap[item.hotel_id],
            //             status: item.status === '1',
            //             sqlId: item.id,
            //             company: data.company
            //         }
            //         if(item?.image){
            //             itm.url = `https://thetripbliss.com${item.image.replace(/\\\//g, '/')}`

            //         }
            //         return itm
            //     })
            
            //     // Save images in batches
            //     const batchSize = 1000;
            //     await saveImagesInBatches(imagesToSave, batchSize);
            //     console.log('All images saved successfully');
            //   } catch (error) {
            //     console.error('Error importing hotel images:', error);
            //   }
            if(!data.hasOwnProperty('status')){
                data.status = true
            }
            if (avoidRecordFetch) {
                try {
                    var record = await HotelImage.create(data);
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
            } else {
                try {
                    var record = await HotelImage.create(data).fetch();
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
                var record = await HotelImage.updateOne(filter).set(updtBody);
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
                await HotelImage.destroyOne(filter);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }


            return resolve({ data: { deleted: true } });
        })
    }
}
