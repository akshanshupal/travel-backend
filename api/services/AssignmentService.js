
const {ObjectId} = require('mongodb');

const isTruthyBoolean = (value) => value === true || String(value).trim().toLowerCase() === 'true';
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
            if (filter.title && filter.title.trim()) filter.title = { contains: filter.title.trim() };
            if (filter.clientName && filter.clientName.trim()) filter.clientName = { contains: filter.clientName.trim() };
            if (filter.email && filter.email.trim()) filter.email = { contains: filter.email.trim() };
            if (filter.mobile && filter.mobile.trim()) filter.mobile = { contains: filter.mobile.trim() };

            const coerceBooleanFilter = (key) => {
                if (!filter.hasOwnProperty(key)) return;
                const raw = filter[key];
                if (raw === true || raw === false) return;
                const value = String(raw).trim().toLowerCase();
                if (value === 'true') filter[key] = true;
                else if (value === 'false') filter[key] = false;
            };
            coerceBooleanFilter('status');
            coerceBooleanFilter('verify');
            coerceBooleanFilter('finished');
            coerceBooleanFilter('bookingStatus');
            coerceBooleanFilter('paymentStatus');
            coerceBooleanFilter('dateNotDecided');
            if (filter.hasOwnProperty('dateNotDecided') && filter.dateNotDecided === false) {
                filter.dateNotDecided = { '!=': true };
            }

            const tzOffsetMinutesRaw = filter.tzOffsetMinutes;
            delete filter.tzOffsetMinutes;
            const tzOffsetMinutes = Number.isFinite(Number(tzOffsetMinutesRaw)) ? Number(tzOffsetMinutesRaw) : 0;
            const toUtcBoundaryFromLocalDate = (dateStr, boundary) => {
                const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
                if (!match) return null;
                const year = Number(match[1]);
                const monthIndex = Number(match[2]) - 1;
                const day = Number(match[3]);
                const utcMillis =
                    boundary === 'start'
                        ? Date.UTC(year, monthIndex, day, 0, 0, 0, 0)
                        : Date.UTC(year, monthIndex, day, 23, 59, 59, 999);
                const d = new Date(utcMillis + tzOffsetMinutes * 60 * 1000);
                return Number.isNaN(d.getTime()) ? null : d;
            };

            const applyDateFilter = (field, modeKey, fromKey, toKey) => {
                const mode = filter[modeKey] ? String(filter[modeKey]).toLowerCase() : 'fixed';
                const fromRaw = filter[fromKey];
                const toRaw = filter[toKey];

                delete filter[modeKey];
                delete filter[fromKey];
                delete filter[toKey];

                const parseDate = (raw, boundary) => {
                    if (!raw) return null;
                    const value = String(raw).trim();
                    if (!value) return null;
                    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                        return toUtcBoundaryFromLocalDate(value, boundary);
                    }
                    const d = sails.dayjs(value);
                    if (!d.isValid()) return null;
                    return boundary === 'start' ? d.startOf('day').toDate() : d.endOf('day').toDate();
                };

                const fromStart = parseDate(fromRaw, 'start');
                const fromEnd = parseDate(fromRaw, 'end');
                const toStart = parseDate(toRaw, 'start');
                const toEnd = parseDate(toRaw, 'end');

                if (mode === 'range') {
                    if (fromStart && toEnd) {
                        filter[field] = { '>=': fromStart, '<=': toEnd };
                    } else if (fromStart) {
                        filter[field] = { '>=': fromStart };
                    } else if (toEnd) {
                        filter[field] = { '<=': toEnd };
                    }
                    return;
                }

                if (mode === 'before') {
                    if (fromEnd) filter[field] = { '<=': fromEnd };
                    return;
                }

                if (mode === 'after') {
                    if (fromStart) filter[field] = { '>=': fromStart };
                    return;
                }

                if (mode === 'fixed') {
                    if (fromStart && fromEnd) filter[field] = { '>=': fromStart, '<=': fromEnd };
                }
            };

            applyDateFilter('tourDate', 'tourDateMode', 'tourDateFrom', 'tourDateTo');
            applyDateFilter('bookingDate', 'bookingDateMode', 'bookingDateFrom', 'bookingDateTo');

            if (typeof filter.tourDate === 'string') {
                const value = filter.tourDate.trim();
                let df;
                let dt;
                if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    df = toUtcBoundaryFromLocalDate(value, 'start');
                    dt = toUtcBoundaryFromLocalDate(value, 'end');
                } else {
                    df = sails.dayjs(value).startOf('date').toDate();
                    dt = sails.dayjs(value).endOf('date').toDate();
                }
                filter.tourDate = { '>=': df, '<=': dt };
            }
            if (typeof filter.bookingDate === 'string') {
                const value = filter.bookingDate.trim();
                let df;
                let dt;
                if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    df = toUtcBoundaryFromLocalDate(value, 'start');
                    dt = toUtcBoundaryFromLocalDate(value, 'end');
                } else {
                    df = sails.dayjs(value).startOf('date').toDate();
                    dt = sails.dayjs(value).endOf('date').toDate();
                }
                filter.bookingDate = { '>=': df, '<=': dt };
            }
            if(filter.clientDetails){
                const searchCriteriaOr = [
                    { clientName: { contains: filter.clientDetails } },
                    { email: { contains: filter.clientDetails } },
                    { mobile: { contains: filter.clientDetails } },
                    { packageId: { contains: filter.clientDetails } }
                ];
                filter.or = searchCriteriaOr;
                delete filter.clientDetails
            }

            const assignmentModel = sails.models.assignment;
            const assignmentAttributeKeys = Object.keys(assignmentModel.attributes || {});
            const assignmentAssociationAliases = (assignmentModel.associations || []).map((a) => a.alias);

            const cleanedSelect = Array.isArray(params.select)
                ? params.select.filter((key) => assignmentAttributeKeys.includes(key))
                : null;
            params.select = cleanedSelect && cleanedSelect.length ? cleanedSelect : null;

            const cleanedPopulate = Array.isArray(params.populate)
                ? params.populate.filter((key) => assignmentAssociationAliases.includes(key))
                : null;
            params.populate = cleanedPopulate && cleanedPopulate.length ? cleanedPopulate : null;

            const supportedMetaKeys = new Set([
                'sortField',
                'sortOrder',
                'clientDetails',
                'tourDateMode',
                'tourDateFrom',
                'tourDateTo',
                'bookingDateMode',
                'bookingDateFrom',
                'bookingDateTo',
                'tzOffsetMinutes'
            ]);
            Object.keys(filter).forEach((key) => {
                if (supportedMetaKeys.has(key)) return;
                if (key === 'or' || key === 'and') return;
                if (!assignmentAttributeKeys.includes(key)) {
                    delete filter[key];
                }
            });

            let qryObj = {where : filter};
            //sort
            let sortField = 'bookingDate';
            let sortOrder = 'DESC';
            if(filter.sortField){
                sortField = filter.sortField;
                delete filter.sortField;
            }
            if(filter.sortOrder){
                sortOrder = filter.sortOrder;
                delete filter.sortOrder;
            }
            if (!assignmentAttributeKeys.includes(sortField)) {
                sortField = 'bookingDate';
            }
            if (String(sortOrder).toUpperCase() !== 'ASC' && String(sortOrder).toUpperCase() !== 'DESC') {
                sortOrder = 'DESC';
            }

            qryObj.sort = sortField + ' ' + sortOrder;
            //pagination
            let page = 1;
            let limit = 10;
            if (params && params.pagination && params.pagination.page) {
                page = +params.pagination.page
            }
            if (params && params.pagination && params.pagination.limit) {
                const limitValue = String(params.pagination.limit).toLowerCase();
                if (limitValue === 'all') {
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
            let records;
            try {
                records = await Assignment.find(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.assignment.associations.length; ami++) {
                    assosiationModels[sails.models.assignment.associations[ami].alias] = sails.models.assignment.associations[ami].model;
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
            if(records.length){
                const assignmentIds = records.map((r) => r.id).filter(Boolean);
                if (assignmentIds.length) {
                    let packageBookings = [];
                    try {
                        packageBookings = await PackageBookingService.find(
                            ctx,
                            { assignment: assignmentIds, company: filter.company, isDeleted: { '!=': true } },
                            { pagination: { limit: 'all' }, select: ['assignment', 'amount'] }
                        );
                    } catch (error) {
                        return reject({ statusCode: 500, error: error });
                    }

                    const amountByAssignment = packageBookings.reduce((acc, booking) => {
                        const key = String(booking.assignment || '');
                        if (!key) return acc;
                        const amount = Number(booking.amount) || 0;
                        acc[key] = (acc[key] || 0) + amount;
                        return acc;
                    }, {});

                    for (let i = 0; i < records.length; i++) {
                        const key = String(records[i].id || '');
                        records[i].bookingsAmount = amountByAssignment[key] || 0;
                    }
                }
            }
            //totalCount
            if (params.totalCount) {
                let totalRecords;
                try {
                    totalRecords = await Assignment.count(filter)
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
            const activeCompany = (ctx && ctx.session && ctx.session.activeCompany) ? ctx.session.activeCompany : null;
            const filter = {
                id: id,
                company: activeCompany ? activeCompany.id : undefined,
            };
            if (!filter.id) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
          
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            let qryObj = { where: filter };
            if (!qryObj.where || !qryObj.where.id) {
                return reject({ statusCode: 400, error: { message: "ID Missing!" } });
            }
            if (!params) {
                params = {};
            }
            if (params.select) {
                qryObj.select = params.select;
            }
            if (ctx.adjustment) {
                filter.adjustment = ctx.adjustment;
            }
            let record;
            try {
                record = await Assignment.findOne(qryObj);;
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            //populate&& populate select
            if (params.populate) {
                let assosiationModels = {};
                for (let ami = 0; ami < sails.models.assignment.associations.length; ami++) {
                    assosiationModels[sails.models.assignment.associations[ami].alias] = sails.models.assignment.associations[ami].model;
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
                data.company = (ctx && ctx.session && ctx.session.activeCompany) ? ctx.session.activeCompany.id : undefined;
            }

            if (!data.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            if (!data.tokenAmount) {
                return reject({ statusCode: 400, error: { message: 'Token Amount is required!' } });
            }
            if (!data.paymentStore) {
                return reject({ statusCode: 400, error: { message: 'Payment Store is required!' } });
            }
            if (!data.bookingDate) {
             return reject({ statusCode: 400, error: { message: 'Booking Date is required!' } });
            }
            if(!data.hasOwnProperty('status')){
                data.status = true
            }
            const dateNotDecided = isTruthyBoolean(data.dateNotDecided);
            data.dateNotDecided = dateNotDecided;
            if (dateNotDecided) {
                if (data.pickUpDate || data.pickUpTime || data.dropDate || data.dropTime) {
                    return reject({ statusCode: 400, error: { message: 'Pickup and drop date-time fields are not allowed when date is not decided!' } });
                }
                data.pickUpDate = null;
                data.pickUpTime = null;
                data.dropDate = null;
                data.dropTime = null;
            }
            if (data.bookingDate && typeof data.bookingDate === 'string') {
                data.bookingDate = sails.dayjs(data.bookingDate);
                if (!data.bookingDate.isValid()) {
                    return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid bookingDate is required!' } });
                } else {
                    data.bookingDate = data.bookingDate.toDate();
                }
            }
            if (data.leadDate && typeof data.leadDate === 'string') {
                data.leadDate = sails.dayjs(data.leadDate);
                if (!data.leadDate.isValid()) {
                    return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid leadDate is required!' } });
                } else {
                    data.leadDate = data.leadDate.toDate();
                }
            }
            if (data.tourDate && typeof data.tourDate === 'string') {
                data.tourDate = sails.dayjs(data.tourDate);
                if (!data.tourDate.isValid()) {
                    return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid tourDate is required!' } });
                } else {
                    data.tourDate = data.tourDate.toDate();
                }
            }
            if (data.pickUpDate && typeof data.pickUpDate === 'string') {
                data.pickUpDate = sails.dayjs(data.pickUpDate);
                if (!data.pickUpDate.isValid()) {
                    return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid pickUpDate is required!' } });
                } else {
                    data.pickUpDate = data.pickUpDate.toDate();
                }
            }
            if (data.dropDate && typeof data.dropDate === 'string') {
                data.dropDate = sails.dayjs(data.dropDate);
                if (!data.dropDate.isValid()) {
                    return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid dropDate is required!' } });
                } else {
                    data.dropDate = data.dropDate.toDate();
                }
            }
            // const [companyConfig] = await CompanyconfigService.find(ctx,{});
            // if (!companyConfig) {
            //     return reject({ statusCode: 404, error: { message: 'Company configuration not found!' } });
            // }
            // data.configSettings = companyConfig;
            const activeCompany = (ctx && ctx.session && ctx.session.activeCompany) ? ctx.session.activeCompany : null;
            let packageId;
            if (activeCompany && activeCompany.packagePrefix) {
                packageId = activeCompany.packagePrefix
            }
            const getInitials = (name) => {
                if (!name || typeof name !== "string") return "";
                
                const nameParts = name.trim().split(/\s+/); // Split by spaces and remove extra spaces
                if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase(); // Single-word name case
                
                // Get first, middle (if any), and last initials
                const initials = nameParts.map((part) => part.charAt(0).toUpperCase());
                
                return initials.join(""); // Combine all initials
            };
            if (data.clientName) {
                packageId = packageId + getInitials(data.clientName)
            }
            const packagePrefix = (activeCompany && activeCompany.packagePrefix) ? activeCompany.packagePrefix : '';
            let key = 'packageNo' +':' + String(activeCompany ? activeCompany.id : '') + ':' + packagePrefix || '';

            let redisPackagePrefix = await sails.redis.incr(key);
              
            const packageLength = (activeCompany && typeof activeCompany.packageLength === 'number') ? activeCompany.packageLength : 0;
            const packagePrefixLength = packageId ? packageId.length : 0;
            const digitsLength = Math.max(packageLength - packagePrefixLength, 0);
            data.packageId = packageId + redisPackagePrefix.toString().padStart(digitsLength, '0');
            let paymentData;
            if(data.tokenAmount&&data.paymentStore&&data.paymentDate){
                
                paymentData = {
                    amount: data.tokenAmount,
                    paymentStore: data.paymentStore,
                    paymentDate: data.paymentDate,
                    paymentTo: 'paymentToCompany',
                    packageId: data.packageId,
                    paymentType: 'Cr',
                    status: true
                }
                if(data.tokenImg){
                    paymentData.paymentImg = data.tokenImg;
                }
                if (data.paymentDate && typeof data.paymentDate === 'string') {
                    data.paymentDate = sails.dayjs(data.paymentDate);
                    if (!data.paymentDate.isValid()) {
                        return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid paymentDate is required!' } });
                    } else {
                        data.paymentDate = data.paymentDate.toDate();
                    }
                }
            }


            if(data.tokenAmount){
                delete data.tokenAmount
            }
            if(data.paymentStore){
                delete data.paymentStore
            }

            delete data.tokenImg
            delete data.paymentDate
            let record;
            if (avoidRecordFetch) {
                try {
                    record = await Assignment.create(data);
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
            } else {
                try {
                    record = await Assignment.create(data).fetch();
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
            }

            if(paymentData){
                try {
                    const {data:payment} = await PaymentsService.create(ctx,{...paymentData, assignment:record.id});
                    if(payment){
                        const {data:updatedAssignment}= await this.updateOne(ctx,record.id,{tokenPayment:payment.id })
                        if(updatedAssignment){
                            record = updatedAssignment
                        }
                    }
                } catch (error) {
                    return reject(error)  
                }

            }
            return resolve({ data: record || { created: true } });
        })


    },
    updateOne: function (ctx, id, updtBody) {
        return new Promise(async (resolve, reject) => {
            const activeCompany = (ctx && ctx.session && ctx.session.activeCompany) ? ctx.session.activeCompany : null;
            const filter = {
                id: id,
                company: activeCompany ? activeCompany.id : undefined,
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
            if (updtBody.hasOwnProperty('dateNotDecided')) {
                const dateNotDecided = isTruthyBoolean(updtBody.dateNotDecided);
                updtBody.dateNotDecided = dateNotDecided;
                if (dateNotDecided) {
                    if (updtBody.pickUpDate || updtBody.pickUpTime || updtBody.dropDate || updtBody.dropTime) {
                        return reject({ statusCode: 400, error: { message: 'Pickup and drop date-time fields are not allowed when date is not decided!' } });
                    }
                    updtBody.pickUpDate = null;
                    updtBody.pickUpTime = null;
                    updtBody.dropDate = null;
                    updtBody.dropTime = null;
                }
            }
            if (updtBody.bookingDate && typeof updtBody.bookingDate === 'string') {
                updtBody.bookingDate = sails.dayjs(updtBody.bookingDate);
                if (!updtBody.bookingDate.isValid()) {
                    return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid bookingDate is required!' } });
                } else {
                    updtBody.bookingDate = updtBody.bookingDate.toDate();
                }
            }
            if (updtBody.leadDate && typeof updtBody.leadDate === 'string') {
                updtBody.leadDate = sails.dayjs(updtBody.leadDate);
                if (!updtBody.leadDate.isValid()) {
                    return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid leadDate is required!' } });
                } else {
                    updtBody.leadDate = updtBody.leadDate.toDate();
                }
            }
            if (updtBody.tourDate && typeof updtBody.tourDate === 'string') {
                updtBody.tourDate = sails.dayjs(updtBody.tourDate);
                if (!updtBody.tourDate.isValid()) {
                    return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid tourDate is required!' } });
                } else {
                    updtBody.tourDate = updtBody.tourDate.toDate();
                }
            }
            if (updtBody.pickUpDate && typeof updtBody.pickUpDate === 'string') {
                updtBody.pickUpDate = sails.dayjs(updtBody.pickUpDate);
                if (!updtBody.pickUpDate.isValid()) {
                    return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid pickUpDate is required!' } });
                } else {
                    updtBody.pickUpDate = updtBody.pickUpDate.toDate();
                }
            }
            if (updtBody.dropDate && typeof updtBody.dropDate === 'string') {
                updtBody.dropDate = sails.dayjs(updtBody.dropDate);
                if (!updtBody.dropDate.isValid()) {
                    return reject({ statusCode: 400, error: { code: 'Error', message: 'Invalid dropDate is required!' } });
                } else {
                    updtBody.dropDate = updtBody.dropDate.toDate();
                }
            }
            
            

            let record;
            try {
                record = await Assignment.updateOne(filter).set(updtBody);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }

            return resolve({ data: record || { modified: true } });
        })
    },
    deleteOne: function (ctx, id) {
        return new Promise(async (resolve, reject) => {
            const activeCompany = (ctx && ctx.session && ctx.session.activeCompany) ? ctx.session.activeCompany : null;
            const filter = {
                id: id,
                company: activeCompany ? activeCompany.id : undefined,
            };
            if (!filter.id) {
                return reject({ statusCode: 400, error: { message: 'id is required!' } });
            }
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
            try {
                const {data: assignment} = await this.findOne(ctx,id);
                if(assignment.verify){
                    const [payemnt] = await PaymentsService.find(ctx, {assignment:id}, {pagination: {limit:1}, select: ['amount']});
                    if(payemnt){
                        return reject({ statusCode: 400, error: { message: 'Please Delete all payments from this assignment!' } })
                    }
                    const [bopackageBooking] = await PackageBookingService.find(ctx, {assignment:id}, {pagination: {limit:1}, select: ['title']});
                    if(bopackageBooking){
                        return reject({ statusCode: 400, error: { message: 'Please Delete all bookings from this assignment!' } })
                    } 
                } 
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            let deletedData
            try {
                const deletedBy = (ctx && ctx.user) ? ctx.user.id : undefined;
                deletedData =  await this.updateOne(ctx, id, {isDeleted:true, deletedAt: new Date(), deletedBy: deletedBy})
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            return resolve({ data: { deleted: true } });
        })
    },

    sendAssignmentMail: async function (ctx, id, bodyData) {
        return new Promise(async (resolve, reject) => {
            try {
                const activeCompany = (ctx && ctx.session && ctx.session.activeCompany) ? ctx.session.activeCompany : null;
                const companyLogo = (activeCompany && activeCompany.logo) ? activeCompany.logo : "";
                const companyName = (activeCompany && activeCompany.name) ? activeCompany.name : "";
                const companyAddress = (activeCompany && activeCompany.address) ? activeCompany.address : "";
                const companyEmail = (activeCompany && activeCompany.email) ? activeCompany.email : "";
                const sendBy = (ctx && ctx.session && ctx.session.user) ? ctx.session.user.id : undefined;

                let assignmentMailData
                const {data}= await this.findOne(ctx, id);
                if(data){
                    assignmentMailData = data
                }

                if (assignmentMailData) {
                    const [mailerData] = await MailerService.find(ctx, { emailFunction: 'sendAssignmentMail', status: true });
                    const [fallbackMailerData] = mailerData ? [null] : await MailerService.find(ctx, { status: true }, { pagination: { limit: 1 } });
                    const mailerConfig = mailerData || fallbackMailerData;
                    if (!mailerConfig) {
                        return reject({ statusCode: 400, error: { message: 'sendAssignmentMail mailer not configured' } });
                    }

                    const replaceSquareBrackets = (html, data) => {
                        return String(html || "").replace(/\[\[(.*?)\]\]/g, (match, key) => {
                            if (key === "tourDate" || key === "bookingDate") {
                                const rawDate = data[key];
                                if (rawDate && !isNaN(new Date(rawDate))) {
                                    return new Date(rawDate).toISOString().split("T")[0];
                                }
                                return "N/A";
                            }
                            const keys = String(key || "").split(".");
                            let value = data;
                            for (const k of keys) {
                                if (value && k in value) {
                                    value = value[k];
                                } else {
                                    value = "N/A";
                                    break;
                                }
                            }
                            return value;
                        });
                    };

                    let html, subject;
                    if (!bodyData.showPreview && bodyData.html && bodyData.subject) {
                        html = bodyData.html;
                        subject = bodyData.subject;
                    } else if (mailerData && mailerData.html && mailerData.subject) {
                        html = replaceSquareBrackets(mailerData.html, assignmentMailData);
                        subject = replaceSquareBrackets(mailerData.subject, assignmentMailData);
                    } else {
                        html = `<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; text-align: center; padding: 20px;">
                    
                        <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 10px; 
                                    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                            
                            <img src="${companyLogo}" alt="Company Logo" 
                                 style="width: 120px; margin-bottom: 10px;">
                    
                            <h1 style="color: #28a745; font-size: 24px; font-weight: bold; margin-bottom: 10px;">
                                Your Booking is Confirmed! 🎉
                            </h1>
                    
                            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                                Thank you for choosing <strong>${companyName}</strong>. <br>
                                Your booking has been successfully confirmed.
                            </p>
                
                            <!-- Booking Details -->
                            <p style="color: #555; font-size: 14px; margin-bottom: 20px;">
                                <strong>Booking ID:</strong> #${assignmentMailData.id} <br>
                                <strong>Booking Date:</strong> ${assignmentMailData.bookingDate 
                                    ? new Date(assignmentMailData.bookingDate).toLocaleDateString("en-GB") 
                                    : "Not Provided"}
                            </p>
                
                            <!-- Support Coordinator Introduction -->
                            <div style="background: #f1f1f1; padding: 15px; border-radius: 8px; margin-top: 20px;">
                                <h2 style="color: #1a73e8; font-size: 18px; font-weight: bold; margin-bottom: 5px;">
                                    Meet Your Support Coordinator
                                </h2>
                                <p style="color: #333; font-size: 14px; margin-bottom: 10px;">
                                    Hi Travelers, I'm <strong>Tanya Bisht</strong>, your dedicated Support Coordinator.  
                                    I'm here to assist you with any queries, changes, or feedback.  
                                    Feel free to reach out for support!
                                </p>
                                <p style="color: #555; font-size: 14px; margin-bottom: 5px;">
                                    <strong>Contact:</strong> +91-9717615559 <br>
                                    <strong>Email:</strong> <a href="mailto:support@tripzipper.com" 
                                                style="color: #1a73e8; text-decoration: none;">support@tripzipper.com</a>
                                </p>
                            </div>
                
                            <!-- Footer -->
                            <p style="color: #555; font-size: 14px; margin-top: 15px;">
                                <strong>${companyName}</strong><br>
                                Address: ${companyAddress}<br>
                                Email: <a href="mailto:${companyEmail}" 
                                          style="color: #1a73e8; text-decoration: none;">
                                    ${companyEmail}
                                </a>
                            </p>
                        </div>
                
                    </div>`;
                
                        subject = `Booking Confirmed - #${assignmentMailData.id} | ${companyName}`;
                    }

                    if (bodyData.showPreview) {
                        return resolve({ data: { html: html, subject: subject } });
                    }

                    try {
                        const { data } = await EmailService.sendEmail(ctx, {
                            email: bodyData.email,
                            subject: subject,
                            html: html,
                            user: mailerConfig.email,
                            password: mailerConfig.password,
                            host: mailerConfig.host,
                        });
                
                        if (data) {
                            try {
                                await SendmailService.create(ctx, {
                                    email: bodyData.email,
                                    subject: subject,
                                    html: html,
                                    emailFunction: 'sendAssignmentMail',
                                    primaryModel: 'Assignment',
                                    modelId: id,
                                    packageId: assignmentMailData ? assignmentMailData.packageId : undefined,
                                    sendBy: sendBy,
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
                                emailFunction: 'sendAssignmentMail',
                                primaryModel: 'Assignment',
                                modelId: id,
                                packageId: assignmentMailData ? assignmentMailData.packageId : undefined,
                                sendBy: sendBy,
                                status: false,
                                error: error?.message || "mailer error"
                            });
                        } catch (error) {
                            reject(error);
                        }
                        reject(error);
                    }
                }    
                
            } catch (error) {
                reject(error)  
            }
        })
    },
    sendWelcomeMail: async function (ctx, id, bodyData) {
        return new Promise(async (resolve, reject) => {
            try {
                const activeCompany = (ctx && ctx.session && ctx.session.activeCompany) ? ctx.session.activeCompany : null;
                const host = (activeCompany && activeCompany.host) ? activeCompany.host : "";
                const sendBy = (ctx && ctx.session && ctx.session.user) ? ctx.session.user.id : undefined;

                let assignmentMailData
                const {data}= await this.findOne(ctx, id,{ populate: ['agentName'] });
                data.packageId = data.packageId
                data.assignmentId = data.id
                data.packageLink = host ? `https://${host}/package-mail/${id}` : "";
                const [mailerData] = await MailerService.find(ctx, {emailFunction: 'sendWelcomeMail', status:true, })
                if(!mailerData){
                    return reject({ statusCode: 400, error: { message: 'sendWelcomeMail mailer not configured' } });
                }
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
                        const { data } = await EmailService.sendEmail(ctx, {
                            email: bodyData.email || (sendMail && sendMail.email),
                            subject: subject,
                            html: html,
                            user: mailerData.email,  
                            password: mailerData.password,
                            host:mailerData.host,
                        });
                
                        if (data) {
                            try {
                                await SendmailService.create(ctx, {
                                    email: bodyData.email,
                                    subject: subject,
                                    html: html,
                                    emailFunction: 'sendWelcomeMail',
                                    primaryModel: 'Assignment',
                                    modelId: id,
                                    packageId: assignmentMailData ? assignmentMailData.packageId : undefined,
                                    // packageId: data?.packageId,
                                    sendBy: sendBy,
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
                                sendBy: sendBy,
                                status: false
                            });
                        } catch (error) {
                            reject(error);
                        }
                        reject(error);
                    }
                  }
                }

               
            } catch (error) {
                reject(error)  
            }
        })
    },
    adjustAssignmentPayment: async function (assignmentId,type='paymentReceived', newAmount, oldAmount = 0) {
        const diff = newAmount - oldAmount;
    
        if (!assignmentId || isNaN(diff)) {
          throw new Error('Invalid assignmentId or amounts');
        }
        try {
            let result;

            if (type === 'paymentReceived') {

                result = await Assignment.getDatastore().manager.collection('assignment').updateOne(
                   { _id: new ObjectId(assignmentId) }, // Query to find the document
                   { $inc: { paymentReceived: diff } }, // Increment paymentReceived by diff
               );
            } else if (type === 'serviceReceived') {
                let x = typeof diff

                result = await Assignment.getDatastore().manager.collection('assignment').updateOne(
                    { _id: new ObjectId(assignmentId) }, // Query to find the document
                    {$inc: { serviceAmount : diff }}
                );                
            }
    
            return { success: true, diff };
        } catch (error) {
            // Log the error and rethrow it for the caller to handle
            console.error('Error updating paymentReceived:', error.message);
            throw new Error('Failed to update paymentReceived');
        }
       
    //    await Assignment.getDatastore().manager.collection('assignment').updateOne({ _id: new ObjectId(assignmentId) }, { $inc: { paymentReceived: diff }});
     
        return { success: true, diff };
    },
   
    verifyAssignment : async function (ctx, id, verifyData){
        return new Promise(async (resolve, reject) => {
            try {
                const {data} = await this.updateOne(ctx, id, {...verifyData ,verifyTime: new Date()});
                if(data.tokenPayment){
                    await PaymentsService.updateOne(ctx, data.tokenPayment, {packageId: data.packageId});
                }
                resolve({data:data})
            } catch (error) {
                reject(error)
                
            }

            
        })
    },
   
    bookingStatus : async function (ctx, id, bookingStatusData){
        return new Promise(async (resolve, reject) => {
            try {
                const {data} = await this.updateOne(ctx, id, {...bookingStatusData });
                await PaymentsService.updateOne(ctx, data.tokenPayment, {packageId: data.packageId});
                resolve({data:data})
            } catch (error) {
                reject(error)
                
            }

            
        })
    },
    paymentStatus : async function (ctx, id, paymentStatusData){
        return new Promise(async (resolve, reject) => {
            try {
                const {data:assignment} = await this.findOne(ctx, id );
                if ((assignment.finalPackageCost - assignment.paymentReceived) === 0) {      
                    const {data} = await this.updateOne(ctx, id, {...paymentStatusData });
                    await PaymentsService.updateOne(ctx, data.tokenPayment, {packageId: data.packageId});
                    resolve({data:data})
                }
                else{
                    return reject({ statusCode: 400, error: { message: 'Pending amount should be 0!' } });
                }
            } catch (error) {
                reject(error)
                
            }

            
        })
    },
  
    finishedAssignment : async function (ctx, id, finishedData){
        return new Promise(async (resolve, reject) => {
            try {
                const {data} = await this.updateOne(ctx, id, {...finishedData });
                await PaymentsService.updateOne(ctx, data.tokenPayment, {packageId: data.packageId});
                resolve({data:data})
            } catch (error) {
                reject(error)
                
            }

            
        })
    },

    agentWiseSummary: function (ctx, filter) {
                return new Promise(async (resolve, reject) => {
                    filter.company = (ctx && ctx.session && ctx.session.activeCompany) ? ctx.session.activeCompany.id : undefined
                    if (!filter.company) {
                        return reject({ statusCode: 400, error: { message: 'company id is required!' } });
                    }
                  try {
                    let matchStage = { isDeleted: {$ne: true}, company: new ObjectId(filter.company) };
              
                    if (filter.from && filter.to) {
                      matchStage.bookingDate = {
                        $gte: sails.dayjs(filter.from).startOf('day').toDate(),
                        $lte: sails.dayjs(filter.to).endOf('day').toDate(),
                      };
                    } else if (filter.from) {
                      matchStage.bookingDate = {
                        $gte: sails.dayjs(filter.from).startOf('day').toDate(),
                      };
                    } else if (filter.to) {
                      matchStage.bookingDate = {
                        $lte: sails.dayjs(filter.to).endOf('day').toDate(),
                      };
                    }
              
                    let aggregateArr = [
                      { $match: matchStage },
                      {
                        $group: {
                          _id: '$agentName',
                          totalAssignments: { $sum: 1 },
                        },
                      },
                      {
                        $lookup: {
                          from: 'user',
                          localField: '_id',
                          foreignField: '_id',
                          as: 'agentName',
                        },
                      },
                      {
                        $unwind: '$agentName',
                      },
                      {
                        $project: {
                          _id: 0,
                          user: '$agentName.name',
                          totalAssignments: 1,
                        },
                      },
                      {$sort: {
                        totalAssignments: -1
                      }}
                    ];
              
                    const result = await Assignment.getDatastore()
                      .manager
                      .collection('assignment')
                      .aggregate(aggregateArr)
                      .toArray();
                  
                    resolve({data: result});
                  } catch (err) {
                    reject(err);
                  }
                });
    },

    agentDurationWiseSummary: async function (req, filter) {
            const { grouping, from, to } = filter;
            const originalStart = sails.dayjs(from).startOf('day');
            const originalEnd = sails.dayjs(to).endOf('day');
    
            const matchQuery = {
                bookingDate: { 
                    $gte: originalStart.toDate(), 
                    $lte: originalEnd.toDate() 
                }
            };
            
            if (filter.agentName) {
                matchQuery.agentName = new ObjectId(filter.agentName);
            }
    
            const aggregationPipeline = [];
            aggregationPipeline.push({ $match: matchQuery });
    
            aggregationPipeline.push({
                $lookup: {
                    from: 'user',
                    localField: 'agentName',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            });
    
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
                                year: { $isoWeekYear: "$bookingDate" },
                                week: { $isoWeek: "$bookingDate" }
                            },
                            totalAssignments: { $sum: 1 },
                            userName: { $first: '$userDetails.name' }
                        }
                    });
                    break;
    
                case 'month':
                    aggregationPipeline.push({
                        $group: {
                            _id: {
                                year: { $year: "$bookingDate" },
                                month: { $month: "$bookingDate" }
                            },
                            totalAssignments: { $sum: 1 },
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
                                        date: "$bookingDate" 
                                    }
                                }
                            },
                            totalAssignments: { $sum: 1 },
                            userName: { $first: '$userDetails.name' }
                        }
                    });
            }
    
            aggregationPipeline.push({ $sort: { "_id": 1 } });
    
            const result = await Assignment.getDatastore()
                .manager
                .collection('assignment')
                .aggregate(aggregationPipeline)
                .toArray();
    
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
                        totalAssignments: 0,
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
                        totalAssignments: 0,
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
                        totalAssignments: 0,
                        userName: null
                    });
                    cursor = cursor.add(1, 'day');
                }
            }
    
            const intervalMap = new Map(
                intervals.map(interval => [interval.key, interval])
            );
    
            result.forEach(r => {
                const key = grouping === 'day' 
                    ? r._id.date 
                    : `${r._id.year}-${r._id.week || r._id.month}`;
                
                const interval = intervalMap.get(key);
                if (interval) {
                    interval.totalAssignments = r.totalAssignments;
                    interval.userName = r.userName;
                }
            });
    
            return { data: Array.from(intervalMap.values()) };
    },
    // adjustment: async function (ctx, id, data) {
    //     return new Promise(async (resolve, reject) => {
    //       try {
    //         const filter = {
    //           id: id,
    //           company: ctx?.session?.activeCompany?.id,
    //         };
      
    //         if (!filter.id) {
    //           return reject({ statusCode: 400, error: { message: 'id is required!' } });
    //         }
    //         if (!filter.company) {
    //           return reject({ statusCode: 400, error: { message: 'company id is required!' } });
    //         }
      
    //         const userName = ctx?.session?.user?.name || 'Unknown';
    //         const createdDate = new Date().toISOString();
    //         const {data : record} = await this.findOne(ctx, id);

      
    //         const newDetails = {
    //           remark: data?.remark || '',
    //           gstInclusive: data?.gstInclusive || false,
    //           createdBy: userName,
    //           createdDate: createdDate,
    //         }
    //         const amount = Number(data.amount);
    //         const taxes = Number(record.taxes || 0);
    //         if(newDetails.gstInclusive){
    //             newDetails.totalAmount = amount;
    //             // newDetails.amount = (amount / (1 + (taxes / 100))).toFixed(2);
    //             newDetails.amount = Number((amount / (1 + (taxes / 100))).toFixed(2));
    //         }else{
    //             newDetails.amount = amount;
    //             newDetails.totalAmount = amount + amount * (taxes / 100);
    //         }
    //         const previousAdjustments = record?.adjustment || {};
    //         if(previousAdjustments?.details){
                
    //             previousAdjustments.details.push(newDetails);
    //         }else{
    //             previousAdjustments.initailPackageCost = record.packageCost
    //             previousAdjustments.initialFinalPackageCost = record.finalPackageCost
    //             previousAdjustments.details = [newDetails];
    //         }
    //         previousAdjustments.amount = previousAdjustments.details.reduce((total, item) => total + item.amount || 0, 0);
    //         previousAdjustments.totalAmount = previousAdjustments.details.reduce((total, item) => total + item.totalAmount || 0, 0);


    //         const updated = await this.updateOne(ctx, id, {
    //             adjustment: previousAdjustments,
    //             packageCost: (record.packageCost-newDetails.amount).toFixed(2),
    //             finalPackageCost: (record.finalPackageCost - newDetails.totalAmount).toFixed(2),
    //           });
      
    //         return resolve(updated);
      
    //       } catch (err) {
    //         return reject({
    //           statusCode: 500,
    //           error: { message: 'Error processing adjustment', details: err },
    //         });
    //       }
    //     });
    // },
      
    adjustment: async function (ctx, id, data) {
        return new Promise(async (resolve, reject) => {
          try {
            const activeCompany = (ctx && ctx.session && ctx.session.activeCompany) ? ctx.session.activeCompany : null;
            const sessionUser = (ctx && ctx.session && ctx.session.user) ? ctx.session.user : null;
            const filter = {
              id: id,
              company: activeCompany ? activeCompany.id : undefined,
            };
      
            if (!filter.id) {
              return reject({ statusCode: 400, error: { message: 'id is required!' } });
            }
            if (!filter.company) {
              return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
      
            const userName = (sessionUser && sessionUser.name) ? sessionUser.name : 'Unknown';
            const createdDate = new Date().toISOString();
            const { data: record } = await this.findOne(ctx, id);
      
            const index = data ? data.index : undefined; // ✅ Accept index from payload
      
            const newDetails = {
              remark: (data && data.remark) ? data.remark : '',
              gstInclusive: Boolean(data && data.gstInclusive),
              createdBy: userName,
              createdDate: createdDate,
            };
      
            const amount = Number(data.amount);
            const taxes = Number(record.taxes || 0);
      
            if (newDetails.gstInclusive) {
              newDetails.totalAmount = amount;
              newDetails.amount = Number((amount / (1 + taxes / 100)).toFixed(2));
            } else {
              newDetails.amount = amount;
              newDetails.totalAmount = amount + amount * (taxes / 100);
            }
      
            const previousAdjustments = (record && record.adjustment) ? record.adjustment : {};
      
            if (previousAdjustments.details) {
              if (index !== undefined && index !== null && !isNaN(index) && previousAdjustments.details[index]) {
                previousAdjustments.details[index] = newDetails;
              } else {
                previousAdjustments.details.push(newDetails);
              }
            } else {
              // First-time adjustment
              previousAdjustments.initailPackageCost = record.packageCost;
              previousAdjustments.initialFinalPackageCost = record.finalPackageCost;
              previousAdjustments.details = [newDetails];
            }
      
            // ✅ Recalculate totals
            previousAdjustments.amount = previousAdjustments.details.reduce(
              (total, item) => total + (item.amount || 0), 0 ).toFixed(2);
            previousAdjustments.totalAmount = previousAdjustments.details.reduce(
              (total, item) => total + (item.totalAmount || 0), 0).toFixed(2);
      
            const updated = await this.updateOne(ctx, id, {
              adjustment: previousAdjustments,
              packageCost: (
                record.packageCost - Number(previousAdjustments.amount)
              ).toFixed(2),
              finalPackageCost: (
                record.finalPackageCost - Number(previousAdjustments.totalAmount)
              ).toFixed(2),
            });
      
            return resolve(updated);
          } catch (err) {
            return reject({
              statusCode: 500,
              error: { message: 'Error processing adjustment', details: err },
            });
          }
        });
      },
      
    adjustmentDeleteOne: function (ctx, id, index) {
        return new Promise(async (resolve, reject) => {

      
          if (!id) return reject({ statusCode: 400, error: { message: 'id is required!' } });
          try {
            const { data: assignment } = await this.findOne(ctx, id);
            
      
            if (!assignment || !assignment.adjustment || !assignment.adjustment.details || !assignment.adjustment.details.length) {
              return reject({ statusCode: 404, error: { message: 'No adjustment details found.' } });
            }
      
            let selectedAdjustment;
            if(['undefined', null, 'null'].includes(index) || isNaN(index) || index < 0 || index >= assignment.adjustment.details.length){
                return reject({ statusCode: 400, error: { message: 'Invalid index.' } });
            }
            selectedAdjustment = assignment.adjustment.details[index]; 
      
            const updatedAdjustment = {
                packageCost: Number((assignment.packageCost + selectedAdjustment.amount).toFixed(2)),
                finalPackageCost: Number((assignment.finalPackageCost + selectedAdjustment.totalAmount).toFixed(2)),
                adjustment : { 
                    ...assignment.adjustment,
                    amount: Number((assignment.adjustment.amount - selectedAdjustment.amount).toFixed(2)),
                    totalAmount: Number((assignment.adjustment.totalAmount - selectedAdjustment.totalAmount).toFixed(2)),
                    details: assignment.adjustment.details.filter((item, i) => i !== index)
                }
            } 

            const updatedAssignment = await this.updateOne(ctx, id, updatedAdjustment);
      
            return resolve({ data: updatedAssignment });
          } catch (error) {
            return reject({ statusCode: 500, error });
          }
        });
    },
    finishedPackageWiseSummary: function (ctx , filter) {
        return new Promise(async (resolve, reject) => {
            filter.company = (ctx && ctx.session && ctx.session.activeCompany) ? ctx.session.activeCompany.id : undefined
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
          try {
            let matchStage = { isDeleted: {$ne: true}, company: new ObjectId(filter.company) };
      
            if (filter.from && filter.to) {
              matchStage.bookingDate = {
                $gte: sails.dayjs(filter.from).startOf('day').toDate(),
                $lte: sails.dayjs(filter.to).endOf('day').toDate(),
              };
            } else if (filter.from) {
              matchStage.bookingDate = {
                $gte: sails.dayjs(filter.from).startOf('day').toDate(),
              };
            } else if (filter.to) {
              matchStage.bookingDate = {
                $lte: sails.dayjs(filter.to).endOf('day').toDate(),
              };
            }
      
            let aggregateArr = [
              { $match: matchStage },
              {
                $group: {
                  _id: '$agentName',
                  totalAssignments: { $sum: 1 },
                  totalCancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
                  totalFinished:  { $sum: { $cond: [{ $eq: ['$finished', true] }, 1, 0] } },
                  totalPending: { $sum: { $cond: [{ $eq: ['$finished', false] }, 1, 0] } },
                },
              },
              {
                $lookup: {
                  from: 'user',
                  localField: '_id',
                  foreignField: '_id',
                  as: 'agentName',
                },
              },
              {
                $unwind: '$agentName',
              },
              {
                $project: {
                  _id: 0,
                  user: '$agentName.name',
                  totalAssignments: 1,
                  totalFinished: 1,
                  totalPending: 1,
                  totalCancelled: 1
                },
              },
              {$sort: {
                totalAssignments: -1
            
              }}
            ];
      
            const result = await Assignment.getDatastore()
              .manager
              .collection('assignment')
              .aggregate(aggregateArr)
              .toArray();
          
            resolve({data: result});
          } catch (err) {
            reject(err);
          }
        });
    },
    profitReports: function (ctx, filter) {
        return new Promise(async (resolve, reject) => {
            filter.company = (ctx && ctx.session && ctx.session.activeCompany) ? ctx.session.activeCompany.id : undefined
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: 'company id is required!' } });
            }
          try {
            let matchStage = { 
                isDeleted: {$ne: true}, 
                company: new ObjectId(filter.company) ,
                finished : true
            };
      
            if (filter.from && filter.to) {
              matchStage.bookingDate = {
                $gte: sails.dayjs(filter.from).startOf('day').toDate(),
                $lte: sails.dayjs(filter.to).endOf('day').toDate(),
              };
            } else if (filter.from) {
              matchStage.bookingDate = {
                $gte: sails.dayjs(filter.from).startOf('day').toDate(),
              };
            } else if (filter.to) {
              matchStage.bookingDate = {
                $lte: sails.dayjs(filter.to).endOf('day').toDate(),
              };
            }
              
              let aggregateArr = [
                { $match: matchStage },
                {
                  $lookup: {
                    from: 'payments',
                    let: { assignmentId: '$_id' },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              {
                                $or: [
                                  { $eq: ['$assignment', '$$assignmentId'] },
                                  {
                                    $eq: [
                                      { $toString: '$assignment' },
                                      { $toString: '$$assignmentId' },
                                    ],
                                  },
                                ],
                              },
                              { $eq: ['$status', true] },
                              { $ne: ['$isDeleted', true] },
                              { $in: ['$paymentType', ['Cr', 'Dr']] },
                            ],
                          },
                        },
                      },
                      {
                        $group: {
                          _id: null,
                          totalCrAmount: {
                            $sum: {
                              $cond: [{ $eq: ['$paymentType', 'Cr'] }, '$amount', 0],
                            },
                          },
                          totalDrAmount: {
                            $sum: {
                              $cond: [{ $eq: ['$paymentType', 'Dr'] }, '$amount', 0],
                            },
                          },
                        },
                      },
                    ],
                    as: 'paymentStats',
                  },
                },
                { $unwind: { path: '$paymentStats', preserveNullAndEmptyArrays: true } },
                {
                  $group: {
                    _id: '$agentName',
                    totalAssignments: { $sum: 1 },
                    totalCrAmount: { $sum: { $ifNull: ['$paymentStats.totalCrAmount', 0] } },
                    totalDrAmount: { $sum: { $ifNull: ['$paymentStats.totalDrAmount', 0] } },
                  },
                },
                {
                  $lookup: {
                    from: 'user',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'agentInfo',
                  },
                },
                { $unwind: { path: '$agentInfo', preserveNullAndEmptyArrays: true } },
                {
                  $project: {
                    _id: 0,
                    user: '$agentInfo.name',
                    totalAssignments: 1,
                    totalCrAmount: 1,
                    totalDrAmount: 1,
                    totalProfit: { $subtract: ['$totalCrAmount', '$totalDrAmount'] },
                  },
                },
                { $sort: { totalAssignments: -1 } },
              ];
              
              
      
            const result = await Assignment.getDatastore()
              .manager
              .collection('assignment')
              .aggregate(aggregateArr)
              .toArray();
          
            resolve({data: result});
          } catch (err) {
            reject(err);
          }
        });
    },
      
    
      

}
