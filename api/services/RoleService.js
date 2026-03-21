module.exports = {
    find: function (ctx, filter, params) {
        return new Promise(async (resolve, reject) => {
            if (!filter.company) {
                filter.company = ctx?.session?.activeCompany?.id;
            }
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: "company id is required!" } });
            }
            if (!params) {
                params = {};
            }
            if (!filter.hasOwnProperty("isDeleted")) {
                filter.isDeleted = { "!=": true };
            }
            let qryObj = { where: filter };

            let sortField = "createdAt";
            let sortOrder = "DESC";
            qryObj.sort = sortField + " " + sortOrder;

            let page = 1;
            let limit = 10;
            if (params?.pagination?.page) {
                page = +params.pagination.page;
            }
            if (params?.pagination?.limit) {
                if (params?.pagination?.limit == "All" || params?.pagination?.limit == "all") {
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
            try {
                var records = await Role.find(qryObj);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }

            const rtrn = { data: records };
            if (params.totalCount) {
                try {
                    var totalRecords = await Role.count(filter);
                } catch (error) {
                    return reject({ statusCode: 500, error: error });
                }
                rtrn.totalCount = totalRecords;
            } else {
                return resolve(rtrn.data);
            }
            return resolve(rtrn);
        });
    },

    findOne: function (ctx, id, params) {
        return new Promise(async (resolve, reject) => {
            const filter = {
                id: id,
                company: ctx?.session?.activeCompany?.id,
            };
            if (!filter.id) {
                return reject({ statusCode: 400, error: { message: "id is required!" } });
            }
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: "company id is required!" } });
            }
            let qryObj = { where: filter };
            if (!params) {
                params = {};
            }
            if (params.select) {
                qryObj.select = params.select;
            }
            try {
                var record = await Role.findOne(qryObj);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            if (!record) {
                return reject({ statusCode: 404, error: { code: "Not Found", message: "Data not found!" } });
            }
            return resolve(record);
        });
    },

    create: function (ctx, data) {
        return new Promise(async (resolve, reject) => {
            if (!data.company) {
                data.company = ctx?.session?.activeCompany?.id;
            }
            if (!data.company) {
                return reject({ statusCode: 400, error: { message: "company id is required!" } });
            }
            if (!data.title) {
                return reject({ statusCode: 400, error: { message: "title is required!" } });
            }

            if (!data.hasOwnProperty("status")) {
                data.status = true;
            }

            try {
                const existing = await Role.findOne({
                    title: data.title,
                    company: data.company,
                    isDeleted: { "!=": true },
                });
                if (existing) {
                    return reject({ statusCode: 400, error: { message: "role already exists with same title!" } });
                }
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }

            try {
                var record = await Role.create(data).fetch();
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }

            return resolve(record);
        });
    },

    updateOne: function (ctx, id, updtBody) {
        return new Promise(async (resolve, reject) => {
            const filter = {
                id: id,
                company: ctx?.session?.activeCompany?.id,
            };
            if (!filter.id) {
                return reject({ statusCode: 400, error: { message: "id is required!" } });
            }
            if (!filter.company) {
                return reject({ statusCode: 400, error: { message: "company id is required!" } });
            }
            if (!updtBody.company) {
                updtBody.company = filter.company;
            }

            try {
                var record = await Role.updateOne(filter).set(updtBody);
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }

            return resolve(record);
        });
    },

    deleteOne: function (ctx, id) {
        return new Promise(async (resolve, reject) => {
            if (!id) {
                return reject({ statusCode: 400, error: { message: "id is required!" } });
            }
            if (!ctx?.session?.activeCompany?.id) {
                return reject({ statusCode: 400, error: { message: "company id is required!" } });
            }
            let deletedRole;
            try {
                deletedRole = await this.updateOne(ctx, id, { isDeleted: true });
            } catch (error) {
                return reject({ statusCode: 500, error: error });
            }
            return resolve(deletedRole);
        });
    },
};

