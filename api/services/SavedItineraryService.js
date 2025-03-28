module.exports = {
    // find: function (ctx, filter, params) {
    //     return new Promise(async (resolve, reject) => {
    //         console.log(y)

    //         if (!filter.company) {
    //             filter.company= ctx?.session?.activeCompany?.id;
    //         }
    //         if (!filter.company) {
    //             return reject({ statusCode: 400, error: { message: 'company id is required!' } });
    //         }
    //         if (!params) {
    //             params = {};
    //         }
    //         if(!filter.hasOwnProperty('isDeleted')){
    //             filter.isDeleted = { '!=': true };
    //         }

    //         if (filter.clientName && filter.clientName.trim()) filter.clientName = { contains: filter.clientName.trim() };
    //         if (filter.mail && filter.mail.trim()) filter.mail = { contains: filter.mail.trim() };
    //         if (filter.phone && filter.phone.trim()) filter.phone = { contains: filter.phone.trim() };
    //         if (filter.createdAt) {
    //             let df = sails.dayjs(filter.createdAt).startOf('date').toDate();
    //             let dt = sails.dayjs(filter.createdAt).endOf('date').toDate();
    //             filter.createdAt = { '>=': df, '<=': dt };
    //         }
    //         if(filter.clientDetails){
    //             const searchCriteriaOr = [{ clientName: { contains: filter.clientDetails } },{ mail: { contains: filter.clientDetails } },{ mobile: { contains: filter.clientDetails } }];
    //             filter.or = searchCriteriaOr;
    //             delete filter.clientDetails
    //         }
            

    //         let qryObj = {where : filter};
    //         //sort
    //         let sortField = 'createdAt';
    //         let sortOrder = 'DESC';
    //         qryObj.sort = sortField + ' ' + sortOrder;
    //         //pagination
    //         let page = 1;
    //         let limit = 10;
    //         if(params?.pagination?.page){
    //             page = +params.pagination.page
    //         }
    //         if(params?.pagination?.limit){
    //             if(params?.pagination?.limit=='All'||params?.pagination?.limit=='all'){
    //                 limit = null
    //             }else{
    //                 limit = +params.pagination.limit
    //             }
    //         }
    //         qryObj.skip= (page-1)*limit;
    //         qryObj.limit= limit;
    //         //select
    //         if (params.select) {
    //             qryObj.select = params.select;
    //         }
    //         try {
    //             // var records = await SavedItinerary.find(qryObj);;
    //             var records = await SavedItinerary.find(qryObj).meta({makeLikeModifierCaseInsensitive: true});
    //         } catch (error) {
    //             return reject({ statusCode: 500, error: error.message });
    //         }
    //         //populate&& populate select
    //         if (params.populate) {
    //             let assosiationModels = {};
    //             for (let ami = 0; ami < sails.models.saveditinerary.associations.length; ami++) {
    //                 assosiationModels[sails.models.saveditinerary.associations[ami].alias] = sails.models.saveditinerary.associations[ami].model;
    //             }
    //             for (let i = 0; i < records.length; i++) {
    //                 for (let populateKey of params.populate) {
    //                     if (!records[i][populateKey]) {
    //                         continue;
    //                     }
    //                     const cond = { where: {} };
    //                     cond.where['id'] = records[i][populateKey];
    //                     const selectKey = 'select_'+populateKey;
    //                     if (params.hasOwnProperty('populate_select')&&params.populate_select.hasOwnProperty(selectKey)) {
    //                         cond.select = params.populate_select[selectKey];
    //                     }
    //                     let modelName = assosiationModels[populateKey];                        
    //                     try {
    //                         records[i][populateKey] = await sails.models[modelName].findOne(cond);
    //                     } catch (error) {
    //                         return reject({ statusCode: 500, error: error });
    //                     }
    //                 }
    //             }
    //         }
    //         const rtrn = { data : records }
    //         //totalCount
    //         if (params.totalCount) {
    //             try {
    //                 // var totalRecords = await SavedItinerary.count(filter)
    //                 var totalRecords = await SavedItinerary.count(filter).meta({makeLikeModifierCaseInsensitive: true});

    //             } catch (error) {
    //                 return reject({ statusCode: 500, error: error });
    //             }
    //             rtrn.totalCount = totalRecords;
    //         }else{
    //             return resolve(rtrn.data);
    //         }
    //         return resolve(rtrn);
    //     })

    // },
    find: async function (ctx, filter, params) {
        return new Promise(async (resolve, reject) => {
            try {
    
                if (!filter.company) {
                    filter.company = ctx?.session?.activeCompany?.id;
                }
                if (!filter.company) {
                    return reject({
                        statusCode: 400,
                        error: { message: 'Company ID is required!' }
                    });
                }
    
                if (!filter.hasOwnProperty('isDeleted')) {
                    filter.isDeleted = { '!=': true };
                }
    
                if (filter.clientName && filter.clientName.trim()) {
                    filter.clientName = { contains: filter.clientName.trim() };
                }
                if (filter.email && filter.email.trim()) {
                    filter.email = { contains: filter.email.trim() };
                }
                if (filter.mobile && filter.mobile.trim()) {
                    filter.mobile = { contains: filter.mobile.trim() };
                }
                if (filter.createdAt) {
                    const df = sails.dayjs(filter.createdAt).startOf('date').toDate();
                    const dt = sails.dayjs(filter.createdAt).endOf('date').toDate();
                    filter.createdAt = { '>=': df, '<=': dt };
                }
                if (filter.clientDetails) {
                    const searchCriteriaOr = [
                        { clientName: { contains: filter.clientDetails } },
                        { email: { contains: filter.clientDetails } },
                        { mobile: { contains: filter.clientDetails } }
                    ];
                    filter.or = searchCriteriaOr;
                    delete filter.clientDetails;
                }
    
                const qryObj = { where: filter };
                qryObj.sort = 'createdAt DESC';
                const page = params?.pagination?.page ? +params.pagination.page : 1;
                const limit = params?.pagination?.limit === 'All' || params?.pagination?.limit === 'all'
                    ? null
                    : +params?.pagination?.limit || 10;
                qryObj.skip = (page - 1) * limit;
                qryObj.limit = limit;
                if (params?.select) {
                    qryObj.select = params.select;
                }
    
                const records = await SavedItinerary.find(qryObj).meta({ makeLikeModifierCaseInsensitive: true });
    
                if (params?.populate) {
                    const assosiationModels = {};
                    sails.models.saveditinerary.associations.forEach((assoc) => {
                        assosiationModels[assoc.alias] = assoc.model;
                    });
    
                    for (const record of records) {
                        for (const populateKey of params.populate) {
                            if (!record[populateKey]) continue;
                            const cond = { where: { id: record[populateKey] } };
                            const selectKey = `select_${populateKey}`;
                            if (params?.populate_select?.[selectKey]) {
                                cond.select = params.populate_select[selectKey];
                            }
    
                            const modelName = assosiationModels[populateKey];
                            try {
                                record[populateKey] = await sails.models[modelName].findOne(cond);
                            } catch (error) {
                                return reject({
                                    statusCode: 500,
                                    error: `Population error: ${error.message}`
                                });
                            }
                        }
                    }
                }
    
                const result = { data: records };
    
                if (params?.totalCount) {
                    try {
                        const totalRecords = await SavedItinerary.count(filter).meta({makeLikeModifierCaseInsensitive: true});
                        result.totalCount = totalRecords;
                    } catch (error) {
                        return reject({
                            statusCode: 500,
                            error: `Count error: ${error.message}`
                        });
                    }
                }
    
                return resolve(result);
            } catch (error) {
                if (error instanceof ReferenceError) {
                    return reject({
                        statusCode: 500,
                        error: { message: `Reference error: ${error.message}` }
                    });
                }
    
                // Generic error fallback
                return reject({
                    statusCode: 500,
                    error: { message: `Unexpected error: ${error.message}` }
                });
            }
        });
    },
    
    
    // findOne: function (ctx, id, params) {
    //     return new Promise(async (resolve, reject) => {
    //         const filter = {
    //             id: id,
    //             company: ctx?.session?.activeCompany?.id,
    //         };
    //         if (!filter.id) {
    //             return reject({ statusCode: 400, error: { message: 'company id is required!' } });
    //         }
    //         if (!filter.company) {
    //             return reject({ statusCode: 400, error: { message: 'company id is required!' } });
    //         }
    //         let qryObj = { where: filter };
    //         if(!qryObj.where?.id){
    //             return reject({ statusCode: 400, error: { message: "ID Missing!" } });
    //         }
    //         if (!params) {
    //             params = {};
    //         }
    //         if (params.select) {
    //             qryObj.select = params.select;
    //         }
    //         try {
    //             var record = await SavedItinerary.findOne(qryObj);;
    //         } catch (error) {
    //             return reject({ statusCode: 500, error: error });
    //         }
    //         if (!record) {
    //             return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
    //         }
    //         //populate&& populate select
    //         if (params.populate) {
    //             let assosiationModels = {};
    //             for (let ami = 0; ami < sails.models.saveditinerary.associations.length; ami++) {
    //                 assosiationModels[sails.models.saveditinerary.associations[ami].alias] = sails.models.saveditinerary.associations[ami].model;
    //             }
    //             for (let populateKey of params.populate) {
    //                 if (!record[populateKey]) {
    //                     continue;
    //                 }
    //                 const cond = { where: {} };
    //                 cond.where['id'] = record[populateKey];
    //                 const selectKey = 'select_'+populateKey;
    //                 if (params.hasOwnProperty('populate_select')&&params.populate_select.hasOwnProperty(selectKey)) {
    //                     cond.select = params.populate_select[selectKey];
    //                 }
    //                 let modelName = assosiationModels[populateKey];                        
    //                 try {
    //                     record[populateKey] = await sails.models[modelName].findOne(cond);
    //                 } catch (error) {
    //                     return reject({ statusCode: 500, error: error });
    //                 }
    //             }   
    //         }
    //         const rtrn = { data: record }
    //         return resolve({ data: record });
    //     })
    // },
    findOne: async function (ctx, id, params) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!id) {
                    return reject({
                        statusCode: 400,
                        error: { message: 'ID is required!' }
                    });
                }
                const company = ctx?.session?.activeCompany?.id;
                if (!company) {
                    return reject({
                        statusCode: 400,
                        error: { message: 'Company ID is required!' }
                    });
                }
    
                const filter = { id, company };
                const qryObj = { where: filter };
                if (params?.select) {
                    qryObj.select = params.select;
                }
    
                let record;
                try {
                    record = await SavedItinerary.findOne(qryObj);
                } catch (error) {
                    return reject({
                        statusCode: 500,
                        error: `Error fetching record: ${error.message}`
                    });
                }
    
                if (!record) {
                    return reject({
                        statusCode: 404,
                        error: {
                            code: "Not Found",
                            message: "Data not found!"
                        }
                    });
                }
    
                if (params?.populate) {
                    const assosiationModels = {};
                    sails.models.saveditinerary.associations.forEach((assoc) => {
                        assosiationModels[assoc.alias] = assoc.model;
                    });
    
                    for (const populateKey of params.populate) {
                        if (!record[populateKey]) continue;
    
                        const cond = { where: { id: record[populateKey] } };
                        const selectKey = `select_${populateKey}`;
                        if (params?.populate_select?.[selectKey]) {
                            cond.select = params.populate_select[selectKey];
                        }
    
                        const modelName = assosiationModels[populateKey];
                        try {
                            record[populateKey] = await sails.models[modelName].findOne(cond);
                        } catch (error) {
                            return reject({
                                statusCode: 500,
                                error: `Population error for ${populateKey}: ${error.message}`
                            });
                        }
                    }
                }
    
                return resolve({ data: record });
    
            } catch (error) {
                if (error instanceof ReferenceError) {
                    return reject({
                        statusCode: 500,
                        error: `Reference error: ${error.message}`
                    });
                }
                return reject({
                    statusCode: 500,
                    error: `Unexpected error: ${error.message}`
                });
            }
        });
    },
    
    // create: function (ctx, data, avoidRecordFetch) {
    //     return new Promise(async (resolve, reject) => {
    //         if (!data.company) {
    //             data.company= ctx?.session?.activeCompany?.id;
    //         }
    //         if (!data.company) {
    //             return reject({ statusCode: 400, error: { message: 'company id is required!' } });
    //         }
    //         if(!data.hasOwnProperty('status')){
    //             data.status = true
    //         }
    //         if(data.clientItinerary){
    //             let records;
    //             try {
    //                 console.log(x)
    //                 records = await this.find(ctx, {clientItinerary:data.clientItinerary})  
    //             } catch (error) {
    //                 return reject(error)
    //             }
    //             if(records?.length){
    //                 for (const el of records) {
    //                     if (el.mailData === data.mailData) {
    //                         return reject({
    //                             statusCode: 400,
    //                             error: { message: 'The same data is already present in the system!', sendMail: el }
    //                         });;
    //                     }
    //                 }
    //             }
    //         }
    //         if (avoidRecordFetch) {
    //             try {
    //                 var record = await SavedItinerary.create(data);
    //             } catch (error) {
    //                 return reject({ statusCode: 500, error: error });
    //             }
    //         } else {
    //             try {
    //                 var record = await SavedItinerary.create(data).fetch();
    //             } catch (error) {
    //                 return reject({ statusCode: 500, error: error });
    //             }
    //         }
    //         return resolve({ data: record || { created: true } });
    //     })


    // },
    create: async function (ctx, data, avoidRecordFetch) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!data.company) {
                    data.company = ctx?.session?.activeCompany?.id;
                }
                if (!data.company) {
                    return reject({
                        statusCode: 400,
                        error: { message: 'Company ID is required!' }
                    });
                }
    
                if (!data.hasOwnProperty('status')) {
                    data.status = true;
                }
    
                if (data.clientItinerary) {    
                    const records = await this.find(ctx, { clientItinerary: data.clientItinerary });
                    if (records?.length) {
                        console.log(1)
                        for (const el of records) {
                            console.log(2)

                            if (el.mailData === data.mailData) {
                                console.log(3)


                                return reject({
                                    statusCode: 400,
                                    error: {
                                        message: 'The same data is already present in the system!',
                                        sendMail: el
                                    }
                                });
                            }
                        }
                    }
                }
    
                const record = avoidRecordFetch ? await SavedItinerary.create(data) : await SavedItinerary.create(data).fetch();
    
                return resolve({ data: record || { created: true } });
            } catch (error) {
                let x = error.error;
                if (error instanceof ReferenceError) {
                    return reject({
                        statusCode: 500,
                        error: { message: `Reference error occurred: ${error.message}` }
                    });
                }
                return reject({
                    statusCode: 500,
                    error: { message: error?.error?.message || "Error in creating data" }
                });
            }
        });
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
            const host = data?.host
            const user = data?.user
            const password = data?.password
    
            try {
                await EmailService.sendEmail(ctx,email, subject, text, html,host,user,password);
                return resolve({data: { message: 'Email sent successfully!' }});
            } catch (error) {
                return reject(error);
            }
        })
    },
    sendItineraryMail: async function (ctx, id, bodyData) {
        return new Promise(async (resolve, reject) => {
            let sendMail;
            try {
                const {data}= await this.findOne(ctx, id, { populate: ['salesExecutive','company','clientItinerary'] });
                // data.packageLink = `https://thetripbliss.com/package-mail/${data?.id}`;
                data.packageLink = `https://${ctx?.session?.activeCompany?.host}/package-mail/${id}`;
                const [mailerData] = await MailerService.find(ctx, {emailFunction: 'sendItineraryMail', status:true, })
                function replaceSquareBrackets(html, data) {
                    return html.replace(/\[\[(.*?)\]\]/g, (match, key) => {
                      // Handle tourDate specifically
                      if (key === "tourDate" || key === "bookingDate") {
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
                    assignmentMailData = data
                    let html
                    html = replaceSquareBrackets(mailerData.html, data);    
                    let subject = mailerData.subject
                
                    try {
                        const { data } = await EmailService.sendWelcomeEmail(ctx, {
                            email: bodyData.email || sendMail?.email,
                            subject: subject,
                            html: html,
                            user: mailerData.email,  password: mailerData.password,
                            host:mailerData.host,
                        });
                
                        if (data) {
                            try {
                                await SendmailService.create(ctx, {
                                    email: bodyData.email,
                                    subject: subject,
                                    html: html,
                                    emailFunction: 'sendItineraryMail',
                                    primaryModel: 'SavedItinerary',
                                    modelId: id,
                                    sendBy: ctx?.session?.user?.id,
                                    status: true
                                });
                            } catch (error) {
                                reject(error);
                            }
                            resolve({ data: data.message });
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
                            reject(error);
                        }
                        reject(error);
                    }
                }
                
                // if(data){
                //     sendMail = data
                //     let html 
                //     html = replaceSquareBrackets(mailerData.html, data);
                //    const formattedDate = sails.dayjs(sendMail?.tourDate).format("DD-MMM-YY");
                //     let subject = mailerData.subject;
                //     try {
                //         const {data} = await this.sendWelcomeEmail(ctx,{
                //            email:bodyData.email || sendMail?.email, 
                //            subject:subject, html:html, 
                //            host:mailerData.host, 
                //            user:mailerData.email, 
                //            password:mailerData.password});
                //         if(data){
                //             try {
                //                 await SendmailService.create(ctx, {
                //                     email: bodyData.email || sendMail?.email,
                //                     subject: subject,
                //                     html: html,
                //                     emailFunction: 'sendItineraryMail',
                //                     primaryModel: 'SavedItinerary',
                //                     modelId: id,
                //                     sendBy: ctx?.session?.user?.id,
                //                     status: true
                //                 });
                //             } catch (error) {
                //                 reject(error)
                //             }
                //             resolve({data:data.message});
                //         }
                //     } catch (error) {
                //         try {
                //             await SendmailService.create(ctx, {
                //                 email: bodyData.email || sendMail?.email,
                //                 subject: subject,
                //                 html: html,
                //                 emailFunction: 'sendItineraryMail',
                //                 primaryModel: 'SavedItinerary',
                //                 modelId: id,                                
                //                 sendBy: ctx?.session?.user?.id,
                //                 status: false
                //             });
                //         } catch (error) {
                //             reject(error)
                //         }
                //         reject(error)
                        
                //     }
                // }
                
            } catch (error) {
                reject(error)  
            }
        })
    

    }
}
