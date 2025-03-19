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
    sendWelcomeEmail: async function (ctx,data) {
        return new Promise(async (resolve, reject) => {
            
            const email = data.email; // Assume email is sent in the request body
            const subject = data?.subject || 'Welcome to Our Service';
            const text = data?.text || 'Thank you for signing up!';
            const html = data?.html || '<h1>Welcome!</h1><p>Thank you for signing up!</p>';
    
            try {
                await EmailService.sendEmail(ctx,email, subject, text, html);
                return resolve({data: { message: 'Email sent successfully!' }});
            } catch (error) {
                return reject(error);
            }
        })
    },
    sendPaymentReceiptMail: async function (ctx, id, bodyData) {
        return new Promise(async (resolve, reject) => {
            try {
                let payment
                const {data}= await this.findOne(ctx, id);
                if(data){
                    payment = data
                }
                const [companyConfig] = await CompanyconfigService.find(ctx, {}, {populate: ['company'],pagination: {limit:1}, select :['company','address','logo','email','dashboardUrl']});

                if(payment){
                    let html = `<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; text-align: center; padding: 20px;">

                        <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 10px; 
                                    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                            
                            <img src="${companyConfig?.logo}" alt="Company Logo" style="width: 120px; margin-bottom: 10px;">

                            <img src="https://cdn-icons-png.flaticon.com/512/845/845646.png" alt="Payment Success" 
                                style="width: 80px; margin-bottom: 10px;">

                            <h1 style="color: #28a745; font-size: 24px; font-weight: bold; margin-bottom: 10px;">Payment Successful!</h1>
                            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Thank you for your payment. Your transaction has been successfully completed.</p>

                            <a href="https://${ctx?.session?.activeCompany?.host}/payments-receipt/${payment?.id}" 
                            style="display: inline-block; background-color: #1a73e8; color: #fff; padding: 12px 25px; 
                                    border-radius: 5px; font-size: 16px; font-weight: bold; text-decoration: none;">
                                Click here to View Payment Receipt
                            </a>

                            <h2 style="color: #1a73e8; font-size: 20px; font-weight: bold; margin-top: 20px;">Need Assistance?</h2>
                            <p style="color: #333; font-size: 16px; margin-bottom: 10px;">If you have any questions, feel free to reach out to your Travel Expert.</p>

                            <!-- Contact Info -->
                            <p style="color: #555; font-size: 14px; margin-top: 15px;">
                                <strong>${companyConfig?.company?.name}</strong><br>
                                Address: ${companyConfig?.address}<br>
                                Email: <a href="mailto:${companyConfig?.email}" style="color: #1a73e8; text-decoration: none;">
                                    ${companyConfig?.email}
                                </a>
                            </p>
                        </div>

                    </div>`;
                   const formattedDate = sails.dayjs(payment?.paymentDate).format("DD-MMM-YY");

                    let subject = `🎉 Payment Successful - Receipt #${payment?.receiptNo} | ${companyConfig?.company?.name} | ${formattedDate} ✅`
                    try {
                        const {data} = await this.sendWelcomeEmail(ctx,{email:bodyData.email || sendMail?.email, subject:subject, html:html});
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
