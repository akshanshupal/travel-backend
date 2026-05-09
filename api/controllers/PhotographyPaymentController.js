module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false,
    },

    create: async function (req, res) {
        try {
            const record = await PhotographyPaymentService.create(req, req.body);
            return res.json(record.data);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error?.error || error);
        }
    },

    find: async function (req, res) {
        const filter = { ...(req.query || {}) };
        const { page, limit, totalCount } = req.query || {};
        delete filter.page;
        delete filter.limit;
        delete filter.totalCount;
        const params = {};
        if (page || limit) params.pagination = { page, limit };
        if (totalCount === true || totalCount === "true") params.totalCount = true;
        try {
            const records = await PhotographyPaymentService.find(req, filter, params);
            return res.json(records);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error?.error || error);
        }
    },

    findOne: async function (req, res) {
        if (!req.params.id) return res.badRequest("ID is missing");
        try {
            const record = await PhotographyPaymentService.findOne(req, req.params.id);
            return res.json(record.data);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error?.error || error);
        }
    },

    updateOne: async function (req, res) {
        if (!req.params.id) return res.badRequest("ID is missing");
        try {
            const record = await PhotographyPaymentService.updateOne(req, req.params.id, req.body);
            return res.json(record.data);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error?.error || error);
        }
    },

    deleteOne: async function (req, res) {
        if (!req.params.id) return res.badRequest("ID is missing");
        try {
            const record = await PhotographyPaymentService.deleteOne(req, req.params.id);
            return res.json(record.data);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error?.error || error);
        }
    },

    getReceipt: async function (req, res) {
        if (!req.params.id) return res.badRequest("ID is missing");
        try {
            const record = await PhotographyPaymentService.getReceipt(req, req.params.id);
            return res.json(record.data);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error?.error || error);
        }
    },
};
