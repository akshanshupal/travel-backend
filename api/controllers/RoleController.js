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
            var records = await RoleService.find(req, filter, params);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error.error || error);
        }
        return res.json(records);
    },

    findOne: async function (req, res) {
        if (!req.params.id) return res.badRequest("ID is missing");
        let { select } = req.query;
        const params = {};
        if (select) {
            if (typeof select === "string") {
                params.select = select.split(",");
            }
        }
        try {
            var record = await RoleService.findOne(req, req.params.id, params);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error.error || error);
        }
        return res.json(record);
    },

    create: async function (req, res) {
        if (!req.body.title) {
            return res.badRequest({ code: "Error", message: "Title is missing" });
        }
        try {
            var record = await RoleService.create(req, req.body);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error.error || error);
        }
        return res.json(record);
    },

    updateOne: async function (req, res) {
        try {
            var record = await RoleService.updateOne(req, req.params.id, req.body);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error.error || error);
        }
        return res.json(record);
    },

    deleteOne: async function (req, res) {
        try {
            var record = await RoleService.deleteOne(req, req.params.id);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error.error || error);
        }
        return res.json(record);
    },
};

