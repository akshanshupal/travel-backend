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
            try {
                var records = await PackageVoucher.find(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.packagevoucher.associations.length; ami++) {
                    assosiationModels[sails.models.packagevoucher.associations[ami].alias] = sails.models.packagevoucher.associations[ami].model;
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
                    var totalRecords = await PackageVoucher.count(filter)
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
                var record = await PackageVoucher.findOne(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.packagevoucher.associations.length; ami++) {
                    assosiationModels[sails.models.packagevoucher.associations[ami].alias] = sails.models.packagevoucher.associations[ami].model;
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
                data.status=true
            }
            if(!data.hasOwnProperty('isDefault')){
                data.isDefault=true
            }
   
            if (avoidRecordFetch) {
                try {
                    var record = await PackageVoucher.create(data);
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
            } else {
                try {
                    var record = await PackageVoucher.create(data).fetch();
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
                var record = await PackageVoucher.updateOne(filter).set(updtBody);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if(record.isDefault){
                await PackageVoucher.update({company: ctx?.session?.activeCompany?.id, id: {'!=' : record.id}}).set({isDefault: false});
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
                await PackageVoucher.destroyOne(filter);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }


            return resolve({ data: { deleted: true } });
        })
    },
 
    sendPaymentVoucherMail: async function (ctx, id, bodyData) {
        return new Promise(async (resolve, reject) => {
            try {
                let paymentVoucher
                const {data}= await this.findOne(ctx, id);
                data.paymentVoucherId = data.id
                data.packageLink = `https://${ctx?.session?.activeCompany?.host}/package-mail/${id}`;
                if(!data){
                    return reject({ statusCode: 400, error: { message: 'Package voucher is not found!' } });
                }
                const [mailerData] = await MailerService.find(ctx, {emailFunction: 'sendVoucherMail', status:true, })
                if(!mailerData){
                    return reject({ statusCode: 400, error: { message: 'sendPaymentVoucherMail mailer not configured' } });
                }
                function replaceSquareBrackets(html, data) {
                    return html.replace(/\[\[(.*?)\]\]/g, (match, key) => {
                      // Handle tourDate specifically
                      if (key === "tourDate") {
                        const rawDate = data.tourDate; // Get the raw date from the data object
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
                    paymentVoucher = data
                    // let html 
                    // html = replaceSquareBrackets(mailerData.html, data);

                    // // const formattedDate = sails.dayjs(sendMail?.tourDate).format("DD-MMM-YY");
                    // let subject = mailerData.subject
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
                        const {data} = await EmailService.sendMail(ctx,{email:bodyData.email || sendMail?.email, subject:subject, html:html,  host:mailerData.host, user: mailerData.email ,  password : mailerData.password});
                        if(data){
                            try {
                                await SendmailService.create(ctx, {
                                    email: bodyData.email,
                                    subject: subject,
                                    html: html,
                                    emailFunction: 'sendPaymentVoucerMail',
                                    primaryModel: 'PaymentVoucher',
                                    modelId: id,
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
                                emailFunction: 'sendPaymentVoucerMail',
                                primaryModel: 'PaymentVoucher',
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
