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
            if (filter.mail && filter.mail.trim()) filter.mail = { contains: filter.mail.trim() };
            if (filter.phone && filter.phone.trim()) filter.phone = { contains: filter.phone.trim() };
            if (filter.createdAt) {
                let df = sails.dayjs(filter.createdAt).startOf('date').toDate();
                let dt = sails.dayjs(filter.createdAt).endOf('date').toDate();
                filter.createdAt = { '>=': df, '<=': dt };
            }
            if(filter.clientDetails){
                const searchCriteriaOr = [{ clientName: { contains: filter.clientDetails } },{ mail: { contains: filter.clientDetails } },{ mobile: { contains: filter.clientDetails } }];
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
                // var records = await SavedItinerary.find(qryObj);;
                var records = await SavedItinerary.find(qryObj).meta({makeLikeModifierCaseInsensitive: true});
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.saveditinerary.associations.length; ami++) {
                    assosiationModels[sails.models.saveditinerary.associations[ami].alias] = sails.models.saveditinerary.associations[ami].model;
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
                    // var totalRecords = await SavedItinerary.count(filter)
                    var totalRecords = await SavedItinerary.count(filter).meta({makeLikeModifierCaseInsensitive: true});

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
                var record = await SavedItinerary.findOne(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.saveditinerary.associations.length; ami++) {
                    assosiationModels[sails.models.saveditinerary.associations[ami].alias] = sails.models.saveditinerary.associations[ami].model;
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
            if(!data.hasOwnProperty('status')){
                data.status = true
            }
            if (avoidRecordFetch) {
                try {
                    var record = await SavedItinerary.create(data);
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
            } else {
                try {
                    var record = await SavedItinerary.create(data).fetch();
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
                var record = await SavedItinerary.updateOne(filter).set(updtBody);
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
    },
    sendWelcomeEmail: async function (ctx,data) {
        return new Promise(async (resolve, reject) => {
            
            const email = data.email; // Assume email is sent in the request body
            const subject = data?.subject || 'Welcome to Our Service';
            const text = data?.text || 'Thank you for signing up!';
            const html = data?.html || '<h1>Welcome!</h1><p>Thank you for signing up!</p>';
    
            try {
                await EmailService.sendEmail(email, subject, text, html);
                return resolve({data: { message: 'Email sent successfully!' }});
            } catch (error) {
                return reject(error);
            }
        })
    },
    sendItineraryMail: async function (ctx, id) {
        return new Promise(async (resolve, reject) => {
            let sendMail;
            try {
                const {data}= await this.findOne(ctx, id, { populate: ['salesExecutive','company'] });
                if(data){
                    sendMail = data
                    let html = `<div style="max-width: 600px; margin: 0 auto; text-align: center; border: 1px solid #ccc; padding: 20px;">
                    <h1 style="color: #555; font-size: 24px; font-weight: bold;">
                        Here is the quotation you requested from us!!
                    </h1>
                
                    <div style="margin: 20px 0;">
                        <button style="background-color: #1a73e8; color: #fff; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer;">
                           <a href="http://localhost:1337/package-itinerary-mail/${sendMail?.id}" style="color: #fff; text-decoration: none;">
                             <span>Click here to View Package!!</span>
                           </a> 
                        </button>
                    </div>
                
                    <p style="color: #1a73e8; font-size: 14px; margin-top: 0;">
                        This package is valid for 24 Hrs. Freeze your Package by Paying immediately INR 5000/-
                    </p>
                
                    <h2 style="color: #1a73e8; font-size: 20px; font-weight: bold;">
                        Seal the deal now!
                    </h2>
                
                    <p style="color: #333; font-size: 14px;">
                        Make the payment today to get the best deal possible
                    </p>
                
                    <div style="margin: 20px 0;">
                        <button style="background-color: #1a73e8; color: #fff; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer;">
                           <a href="https://thetripbliss.com/payment" style="color: #fff; text-decoration: none;">Pay Now</a>
                        </button>
                    </div>
                
                    <p style="color: #555; font-size: 14px; margin-top: 20px;">
                        For any queries please contact your Travel Expert.
                    </p>
                
                    <p style="color: #333; font-size: 14px;">
                        <strong>${sendMail?.salesExecutive?.name}</strong><br>
                        Phone Number: +91 ${sendMail?.salesExecutive?.mobile}<br>
                        Email: <a href="mailto:sales@thetripbliss" style="color: #1a73e8;">sales@thetripbliss</a>
                    </p>
                   </div>`
                    let subject = `${sendMail?.company?.name} Itinerary for Domestic Package -Ms ${sendMail?.salesExecutive?.name}-${sendMail?.salesExecutive?.mobile}-${sendMail?.tourDate}`
                    try {
                        const {data} = await this.sendWelcomeEmail(ctx,{email:sendMail?.email, subject:subject, html:html});
                        if(data){
                            resolve({data:data.message});
                        }
                    } catch (error) {
                        reject(error)
                        
                    }
                }
                
            } catch (error) {
                reject(error)  
            }
        })
    

    }
}
