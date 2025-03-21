
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
            if (filter.paymentDate) {
                let df = sails.dayjs(filter.paymentDate).startOf('date').toDate();
                let dt = sails.dayjs(filter.paymentDate).endOf('date').toDate();
                filter.paymentDate = { '>=': df, '<=': dt };
            }
            // if(filter.paymentType){

            // }

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
                var records = await Payments.find(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.payments.associations.length; ami++) {
                    assosiationModels[sails.models.payments.associations[ami].alias] = sails.models.payments.associations[ami].model;
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
                    var totalRecords = await Payments.count(filter)
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
                var record = await Payments.findOne(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.payments.associations.length; ami++) {
                    assosiationModels[sails.models.payments.associations[ami].alias] = sails.models.payments.associations[ami].model;
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
            if (data?.paymentDate && typeof data?.paymentDate === 'string') {
                data.paymentDate = sails.dayjs(data.paymentDate);
                if (!data.paymentDate.isValid()) {
                    return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid paymentDate is required!' } });
                } else {
                    data.paymentDate = data.paymentDate.toDate();
                }
            }
            try {

                const [companyConfig] = await CompanyconfigService.find(ctx,{});
                if (!companyConfig) {
                    return reject({ statusCode: 404, error: { message: 'Company configuration not found!' } });
                }
                data.configSettings = companyConfig;

                let redisReceiptNo = await sails.redis.incr('paymentReceipt:' +':' + data.company.toString()+':' + data.paymentStore.toString() + ':' + data.paymentType);
                data.receiptNo = companyConfig.paymentReceiptPrefix + data.paymentType.toUpperCase()+ redisReceiptNo.toString().padStart(companyConfig.paymentReceiptLength, '0');
                let record;
                if (avoidRecordFetch) {
                    record = await Payments.create(data);
                } else {
                    record = await Payments.create(data).fetch();
                }
                return resolve({ data: record || { created: true } });
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
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
            if (updtBody?.paymentDate && typeof updtBody?.paymentDate === 'string') {
                updtBody.paymentDate = sails.dayjs(updtBody.paymentDate);
                if (!updtBody.paymentDate.isValid()) {
                    return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid paymentDate is required!' } });
                } else {
                    updtBody.paymentDate = updtBody.paymentDate.toDate();
                }
            }
            try {
                var record = await Payments.updateOne(filter).set(updtBody);
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

            return resolve({ data: { deleted: true } });
            // try {
            //     await Payments.destroyOne(filter);
            // } catch (error) {
            //     return reject({ statusCode: 500, error: error });
            // }


            // return resolve({ data: { deleted: true } });
        })
    },
    getReceipt: function (ctx, id) {
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
            const {data: payment} = await this.findOne(ctx, id, {populate: ['assignment','paymentStore']});
            if (!payment) {
                return reject({ statusCode: 404, error: { message: 'Payment not found!' } });
            }

            const [companyConfig] = await CompanyconfigService.find(ctx, {}, {populate: ['company'],pagination: {limit:1}, select :['company','address','logo','email']});

            return resolve({ data: {payment: payment || {}, companyConfig: companyConfig || {} } });
        })
    },

    sendPaymentReceiptMail: async function (ctx, id, bodyData) {
        return new Promise(async (resolve, reject) => {
            try {
                let payment
                const {data}= await this.findOne(ctx, id, {populate: ['assignment']});
                if(data){
                    payment = data
                }

                if(payment){
                    let html = `<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; text-align: center; padding: 20px;">

                        <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 10px; 
                                    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                            
                            <img src="${ctx.session?.activeCompany?.logo}" alt="Company Logo" style="width: 120px; margin-bottom: 10px;">

                          

                            <h1 style="color: #28a745; font-size: 24px; font-weight: bold; margin-bottom: 10px;">Payment Successful!</h1>
                            <h1 style="color: #1a73e8; font-size: 24px; font-weight: bold; margin-bottom: 10px;">Dear Mr ${payment?.assignment?.clientName},</h1>

                            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                            Thank you for your payment.<br>
                            We have received your payment successfully.Please find the payment confirmation attached for your reference.</p>

                            <a href="https://${ctx.session?.activeCompany?.host}/payments-receipt/${payment?.id}" 
                            style="display: inline-block; background-color: #1a73e8; color: #fff; padding: 12px 25px; 
                                    border-radius: 5px; font-size: 16px; font-weight: bold; text-decoration: none;">
                                Click here to View Payment Receipt
                            </a>

                            <h2 style="color: #1a73e8; font-size: 20px; font-weight: bold; margin-top: 20px;">Need Assistance?</h2>
                            <p style="color: #333; font-size: 16px; margin-bottom: 10px;">If you have any questions, feel free to reach out to your Travel Expert.</p>

                            <!-- Contact Info -->
                            <p style="color: #555; font-size: 14px; margin-top: 15px; ">
                                <strong>${ctx.session?.activeCompany?.name}</strong><br>
                                Address: ${ctx.session?.activeCompany?.address}<br>
                                Email: <a href="mailto:${ctx.session?.activeCompany?.email}" style="color: #1a73e8; text-decoration: none;">
                                    ${ctx.session?.activeCompany?.email}
                                </a>
                            </p>
                        </div>

                    </div>`;
                   const formattedDate = sails.dayjs(payment?.paymentDate).format("DD-MMM-YY");

                    let subject = `🎉 Payment Successful - Receipt #${payment?.receiptNo} | ${ctx.session?.activeCompany?.name} | ${formattedDate} ✅`
                    try {
                        const {data} = await EmailService.sendWelcomeEmail(ctx,{email:bodyData.email || sendMail?.email, subject:subject, html:html, from:'support@hospitalitygroup.in',  password: 'Priyanka@123'});
                        if(data){
                            try {
                                await SendmailService.create(ctx, {
                                    email: bodyData.email,
                                    subject: subject,
                                    html: html,
                                    payments: id,
                                    sendBy: ctx?.session?.user?.id,
                                    status: true
                                });
                            } catch (error) {
                                reject(error)
                            }
                            resolve({data:data.message});
                        }
                    } catch (error) {
                        try {
                            await SendmailService.create(ctx, {
                                email: bodyData.email,
                                subject: subject,
                                html: html,
                                payments: id,
                                sendBy: ctx?.session?.user?.id,
                                status: false
                            });
                        } catch (error) {
                            reject(error)
                        }
                        reject(error)
                        
                    }
                }
                
            } catch (error) {
                reject(error)  
            }
        })
    

    }

}
