
module.exports = {
    find: function (ctx, filter, params) {
        return new Promise(async (resolve, reject) => {
            if (!filter.company) {
                filter.company = ctx.session.activeCompany.id
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
            if (filter.paymentDate) {
                let df = sails.dayjs(filter.paymentDate).startOf('date').toDate();
                let dt = sails.dayjs(filter.paymentDate).endOf('date').toDate();
                filter.paymentDate = { '>=': df, '<=': dt };
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
            // try {
            //     var records = await Payments.find(qryObj);;
            // } catch (error) {
            //     return reject({ statusCode: 500, error: error });
            // }
            try {
                var records = await Payments.find(qryObj).meta({makeLikeModifierCaseInsensitive: true});;
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
            let packageServices = [];
            if(data?.packageServices?.length>0){
                packageServices = data.packageServices;
                delete data.packageServices
                    // _id,paymentDate,amount,paymentStore, paymentTo,remarks,assignment,paymentImg,paymentType"Dr",packageBooking,packageId
                    // company,status,receiptNo
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
                let type;

                if(data.packageBooking){
                    type='serviceReceived'; 
                }else{
                    type='paymentReceived';
                }

 
                if (avoidRecordFetch) {
                    record = await Payments.create(data);
                } else {
                    record = await Payments.create(data).fetch();
                }
                if(packageServices?.length>0){
                    for(let i=0;i<packageServices.length;i++){
                        const ps = packageServices[i];
                        if(!ps.id){
                            return reject({ statusCode: 400, error: { code: 'Error', message: 'packageId Missing!' } });
                        }
                        if(!ps.amount){
                            return reject({ statusCode: 400, error: { code: 'Error', message: 'amount Missing!' } });
                        }
                        const paymentData = {
                            paymentDate: record.paymentDate,
                            amount: ps.amount,
                            paymentStore: record.paymentStore,
                            paymentTo: record.paymentTo,
                            assignment: record.assignment,
                            paymentType: "Dr",
                            packageBooking: ps.id,
                            packageId: record.packageId,
                            company: record.company,
                            status: record.status,
                        }

                        await this.create(ctx, paymentData, false)
                    }
                }
 
                await AssignmentService.adjustAssignmentPayment(record.assignment,type, record.amount);
                if(record.packageBooking){   
                    await PackageBookingService.adjustPaymentBookingAmount(record.packageBooking, 0, record.amount);
                }
                if(record.paymentType=='Dr'&& record.packageBooking){
                    await PackageBookingService.decreasePendingAmount(ctx, record.packageBooking, record.amount, record.paymentDate);
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
            const {data: oldData} = await this.findOne(ctx, id, {select: ['amount','packageBooking']});
             if(oldData.packageBooking){
                    type='serviceReceived'; 
                }else{
                    type='paymentReceived';
                }

            try {
                var record = await Payments.updateOne(filter).set(updtBody);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if(record.isDeleted){
                await AssignmentService.adjustAssignmentPayment(record.assignment,type, 0, record.amount);
                if(record.packageBooking){
                    await PackageBookingService.adjustPaymentBookingAmount(record.packageBooking, 0, record.amount);
                }
            }else{
                await AssignmentService.adjustAssignmentPayment(record.assignment,type, record.amount, oldData.amount);
                if(record.packageBooking){
                    await PackageBookingService.adjustPaymentBookingAmount(record.packageBooking, record.amount, oldData.amount);
                }
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
                data.pacakgeId = data?.packageId
                data.paymentReceipt = `https://${ctx?.session?.activeCompany?.host}/payments-receipt/${id}`;
                const [mailerData] = await MailerService.find(ctx, {emailFunction: 'sendPaymentMail', status:true, })
                if(!mailerData){
                    return reject({ statusCode: 400, error: { message: 'sendPaymentReceiptMail mailer not configured' } });
                }
                function replaceSquareBrackets(html, data) {
                    return html.replace(/\[\[(.*?)\]\]/g, (match, key) => {
                      // Handle tourDate specifically
                      if (key === "paymentDate") {
                        const rawDate = data.paymentDate; // Get the raw date from the data object
                        if (rawDate && !isNaN(new Date(rawDate))) {
                          // Extract YYYY-MM-DD from the ISO date string
                          return new Date(rawDate).toISOString().split("T")[0];
                        } else {
                          return "N/A"; // Fallback if the date is invalid
                        }
                      }
                      // Handle other keys dynamically
                      const keys = key.split(".");
                      let value = data;
                      for (const k of keys) {
                        if (value && k in value) {
                          value = value[k];
                        } else {
                          value = "N/A"; // Fallback if the key is not found
                          break;
                        }
                      }
                      return value;
                    });
                  }
                if(data){
                    payment = data
                    // let html 
                    // html = replaceSquareBrackets(mailerData.html, data);
                    // const formattedDate = sails.dayjs(payment?.paymentDate).format("DD-MMM-YY");
                    // let subject = mailerData.subject;
                    let html, subject
                    if(!bodyData.showPreview&&bodyData.html&&bodyData.subject){
                         html = bodyData.html;    
                         subject = bodyData.subject; 
                    }else{
                        html = replaceSquareBrackets(mailerData.html, data);    
                        subject = replaceSquareBrackets(mailerData.subject, data); 
                    }
                    if(bodyData.showPreview){
                        resolve({data: {html: html, subject: subject}})
                    }else{
                     try {
                         const {data} = await EmailService.sendEmail(ctx,{email:bodyData.email || sendMail?.email, subject:subject, html:html, host :mailerData.host, user:mailerData.email, password:mailerData.password,});
                         if(data){
                             try {
                                 await SendmailService.create(ctx, {
                                     email: bodyData.email,
                                     subject: subject,
                                     html: html,
                                     emailFunction: 'sendPaymentMail',
                                     primaryModel: 'Payments',
                                     modelId: id,
                                     packageId: data?.packageId,
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
                                 emailFunction: 'sendPaymentMail',
                                //  emailFunction: 'sendPaymenReceiptMail',
                                 primaryModel: 'Payments',
                                 modelId: id,
                                 sendBy: ctx?.session?.user?.id,
                                 status: false
                             });
                         } catch (error) {
                             reject(error)
                         }
                         reject(error)
                         
                     }
                 }
                } 
            } catch (error) {
                reject(error)  
            }
        })
    

    },
    sendPaymentReminderMail: async function (ctx, id ,bodyData ){
        return new Promise(async (resolve, reject) => {
            try {
                let paymentReminder
                const {data}= await AssignmentService.findOne(ctx, id);
                data.packageId = data.packageId,
                data.assignmentId = data.id,
                data.dueDate = bodyData.dueDate;
                data.amount = bodyData.amount;
                const [mailerData] = await MailerService.find(ctx, {emailFunction: 'sendPaymentReminderMail', status:true, })
                function replaceSquareBrackets(html, data) {
                    return html.replace(/\[\[(.*?)\]\]/g, (match, key) => {
                      if (key === "dueDate") {
                        const rawDate = data.dueDate; 
                        if (rawDate && !isNaN(new Date(rawDate))) {
                            const dateObj = new Date(rawDate);
                            const formattedDate = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
                            const hours = dateObj.getHours().toString().padStart(2, '0');
                            const minutes = dateObj.getMinutes().toString().padStart(2, '0');
                            const formattedTime = `${hours}:${minutes}`; // HH:MM format
                            return `${formattedDate} , ${formattedTime}`; // Combine date and time
                          } else {
                          return "N/A"; // Fallback if the date is invalid
                        }
                      }
                      // Handle other keys dynamically
                      const keys = key.split(".");
                      let value = data;
                      for (const k of keys) {
                        if (value && k in value) {
                          value = value[k];
                        } else {
                          value = "N/A"; // Fallback if the key is not found
                          break;
                        }
                      }
                      return value;
                    });
                  }
                if(data){
                    paymentReminder = data
                    // let html 
                    // html = replaceSquareBrackets(mailerData.html, data);
                    // const formattedDate = sails.dayjs(paymentReminder?.paymentDate).format("DD-MMM-YY");
                    // let subject = mailerData.subject;
                    let html, subject
                    if(!bodyData.showPreview&&bodyData.html&&bodyData.subject){
                         html = bodyData.html;    
                         subject = bodyData.subject; 
                    }else{
                        html = replaceSquareBrackets(mailerData.html, data);    
                        subject = replaceSquareBrackets(mailerData.subject, data); 
                    }
                    if(bodyData.showPreview){
                        resolve({data: {html: html, subject: subject}})
                    }else{
                     try {
                         const {data} = await EmailService.sendEmail(ctx,{email:bodyData.email || sendMail?.email, subject:subject, html:html, host:mailerData.host, user:mailerData.email, password:mailerData.password,});
                         if(data){
                             try {
                                 await SendmailService.create(ctx, {
                                     email: bodyData.email,
                                     subject: subject,
                                     html: html,
                                     emailFunction: 'sendPaymentReminderMail',
                                     primaryModel: 'Assignment',
                                     modelId: id,
                                     packageId: data?.packageId,
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
                                 emailFunction: 'sendPaymentReminderMail',
                                 primaryModel: 'Assignment',
                                 modelId: id,                                 
                                 sendBy: ctx?.session?.user?.id,
                                 status: false
                             });
                         } catch (error) {
                             reject(error)
                         }
                         reject(error)
                         
                     }
                  }
                } 
            } catch (error) {
                reject(error)  
            }
        })
    }


}
