module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false,
    },

    find: async function (req, res) {
        const filter = req.query;
        filter.company = req.session.activeCompany.id;
        let { select, totalCount, page, limit } = req.query;
        const params = {};
        if (select) {
            if (typeof select === "string") {
                params.select = select.split(",");
            }
            delete filter.select;
        }
        if (totalCount) {
            if (typeof totalCount === "boolean" || totalCount == "true") {
                params.totalCount = true;
            }
            delete filter.totalCount;
        }
        if (page || limit) {
            params.pagination = {};
            if (page) {
                params.pagination.page = page;
                delete filter.page;
            }
            if (limit) {
                params.pagination.limit = limit;
                delete filter.limit;
            }
        }

        try {
            var records = await EnquiryService.find(req, filter, params);
        } catch (error) {
            return res.serverError(error);
        }
        return res.json(records);
    },

    findOne: async function (req, res) {
        if (!req.params.id) return res.badRequest("ID is missing");
        try {
            var record = await EnquiryService.findOne(req, req.params.id);
        } catch (error) {
            return res.serverError(error);
        }
        return res.json(record.data);
    },

    create: async function (req, res) {
        const body = req.body || {};
        if (!body.fullName) {
            return res.badRequest({ code: "Error", message: "fullName is missing" });
        }
        if (!body.mobile) {
            return res.badRequest({ code: "Error", message: "mobile is missing" });
        }
        if (!body.pageUrl) {
            return res.badRequest({ code: "Error", message: "pageUrl is missing" });
        }

        try {
            var record = await EnquiryService.create(req, body);
        } catch (error) {
            return res.serverError(error);
        }
        return res.json(record.data);
    },

    updateOne: async function (req, res) {
        if (!req.params.id) return res.badRequest("ID is missing");
        try {
            var record = await EnquiryService.updateOne(req, req.params.id, req.body);
        } catch (error) {
            return res.serverError(error);
        }
        return res.json(record.data);
    },
};
