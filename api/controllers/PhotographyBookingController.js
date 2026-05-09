module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false,
    },

    create: async function (req, res) {
        try {
            const record = await PhotographyBookingService.create(req, req.body);
            return res.json(record.data);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error?.error || error);
        }
    },

    convertEstimate: async function (req, res) {
        if (!req.params.id) return res.badRequest("Estimate id is missing");
        try {
            const record = await PhotographyBookingService.convertEstimate(req, req.params.id, req.body);
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
            const records = await PhotographyBookingService.find(req, filter, params);
            return res.json(records);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error?.error || error);
        }
    },

    findOne: async function (req, res) {
        if (!req.params.id) return res.badRequest("ID is missing");
        try {
            const record = await PhotographyBookingService.findOne(req, req.params.id);
            return res.json(record.data);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error?.error || error);
        }
    },

    updateOne: async function (req, res) {
        if (!req.params.id) return res.badRequest("ID is missing");
        try {
            const record = await PhotographyBookingService.updateOne(req, req.params.id, req.body);
            return res.json(record.data);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error?.error || error);
        }
    },
};
