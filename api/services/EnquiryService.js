module.exports = {
    find: function (ctx, filter, params) {
        return new Promise(async (resolve, reject) => {
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: "company id is required!" } });
            }
            if (!params) {
                params = {};
            }
            if (!filter.hasOwnProperty("isDeleted")) {
                filter.isDeleted = { "!=": true };
            }
            if (filter.createdAt) {
                let df = sails.dayjs(filter.createdAt).startOf("date").toDate();
                let dt = sails.dayjs(filter.createdAt).endOf("date").toDate();
                filter.createdAt = { ">=": df, "<=": dt };
            }
            if (filter.updatedAt) {
                let df = sails.dayjs(filter.updatedAt).startOf("date").toDate();
                let dt = sails.dayjs(filter.updatedAt).endOf("date").toDate();
                filter.updatedAt = { ">=": df, "<=": dt };
            }

            const qryObj = { where: filter };
            qryObj.sort = "createdAt DESC";

            let page = 1;
            let limit = 10;
            if (params?.pagination?.page) {
                page = +params.pagination.page;
            }
            if (params?.pagination?.limit) {
                if (params?.pagination?.limit === "All" || params?.pagination?.limit === "all") {
                    limit = null;
                } else {
                    limit = +params.pagination.limit;
                }
            }
            qryObj.skip = (page - 1) * limit;
            qryObj.limit = limit;

            if (params.select) {
                qryObj.select = params.select;
            }

            let records;
            try {
                records = await Enquiry.find(qryObj);
            } catch (error) {
                return reject({ statusCode: 500, error });
            }

            const rtrn = { data: records };
            if (params.totalCount) {
                try {
                    rtrn.totalCount = await Enquiry.count(filter);
                } catch (error) {
                    return reject({ statusCode: 500, error });
                }
                return resolve(rtrn);
            }

            return resolve(rtrn.data);
        });
    },

    findOne: function (ctx, id) {
        return new Promise(async (resolve, reject) => {
            const filter = {
                id,
                company: ctx?.session?.activeCompany?.id,
                isDeleted: { "!=": true },
            };
            if (!filter.id) {
                return reject({ statusCode: 400, error: { message: "id is required!" } });
            }
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: "company id is required!" } });
            }
            let record;
            try {
                record = await Enquiry.findOne({ where: filter });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            return resolve({ data: record });
        });
    },

    create: function (ctx, data, avoidRecordFetch) {
        return new Promise(async (resolve, reject) => {
            const payload = { ...(data || {}) };

            if (!payload.company) {
                payload.company = ctx?.session?.activeCompany?.id;
            }

            const normalizedFullName = String(payload.fullName || "").trim();
            const normalizedMobile = String(payload.mobile || "").trim();
            const normalizedPageUrl = String(payload.pageUrl || "").trim();

            if (!normalizedFullName) return reject({ statusCode: 400, error: { message: "fullName is required!" } });
            if (!normalizedMobile) return reject({ statusCode: 400, error: { message: "mobile is required!" } });
            if (!normalizedPageUrl) return reject({ statusCode: 400, error: { message: "pageUrl is required!" } });

            payload.fullName = normalizedFullName;
            payload.mobile = normalizedMobile;
            payload.pageUrl = normalizedPageUrl;

            if (!payload.company) {
                const candidate = String(ctx?.headers?.origin || ctx?.headers?.referer || payload.pageUrl || "").trim();
                if (candidate) {
                    try {
                        const hostname = new URL(candidate).hostname;
                        if (hostname) {
                            const conf = await CompanyconfigService.find(
                                ctx,
                                { websiteUrls: hostname, getClientConfig: true },
                                { populate: ["company"], pagination: { limit: 1 } },
                            );
                            const first = Array.isArray(conf) ? conf[0] : (conf?.data && Array.isArray(conf.data) ? conf.data[0] : null);
                            if (first?.company) {
                                payload.company = first.company.id || first.company._id || first.company;
                            }
                        }
                    } catch {
                    }
                }
            }

            if (payload.email != null) payload.email = String(payload.email || "").trim();
            if (payload.message != null) payload.message = String(payload.message || "").trim();
            if (payload.destination != null) payload.destination = String(payload.destination || "").trim();
            if (payload.packageName != null) payload.packageName = String(payload.packageName || "").trim();
            if (payload.travelDate != null) payload.travelDate = String(payload.travelDate || "").trim();
            if (payload.source != null) payload.source = String(payload.source || "").trim();
            if (payload.days != null) payload.days = Number(payload.days);
            if (payload.adults != null) payload.adults = Number(payload.adults);
            if (payload.kids != null) payload.kids = Number(payload.kids);
            if (payload.transferredToLead === undefined || payload.transferredToLead === null) payload.transferredToLead = false;
            if (!payload.meta || typeof payload.meta !== "object") payload.meta = {};

            let record;
            try {
                record = avoidRecordFetch ? await Enquiry.create(payload) : await Enquiry.create(payload).fetch();
            } catch (error) {
                return reject({ statusCode: 500, error });
            }

            return resolve({ data: record || { created: true } });
        });
    },

    updateOne: function (ctx, id, updtBody) {
        return new Promise(async (resolve, reject) => {
            const companyId = ctx?.session?.activeCompany?.id;
            if (!id) {
                return reject({ statusCode: 400, error: { message: "id is required!" } });
            }
            if (!companyId) {
                return reject({ statusCode: 400, error: { message: "company id is required!" } });
            }

            const filter = { id, company: companyId, isDeleted: { "!=": true } };
            const payload = { ...(updtBody || {}) };
            if (!payload.company) payload.company = companyId;

            if (payload.hasOwnProperty("transferredToLead")) {
                const raw = payload.transferredToLead;
                payload.transferredToLead = raw === true || raw === "true" || raw === 1 || raw === "1";
            } else {
                payload.transferredToLead = true;
            }

            let record;
            try {
                record = await Enquiry.updateOne(filter).set({ transferredToLead: payload.transferredToLead });
            } catch (error) {
                return reject({ statusCode: 500, error });
            }

            return resolve({ data: record || { modified: true } });
        });
    },
};
