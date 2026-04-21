module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false,
    },

    create: async function (req, res) {
        try {
            const record = await PhotographyClientService.create(req, req.body);
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
        if (page || limit) {
            params.pagination = { page, limit };
        }
        if (totalCount === true || totalCount === "true") params.totalCount = true;

        try {
            const records = await PhotographyClientService.find(req, filter, params);
            return res.json(records);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error?.error || error);
        }
    },

    findOne: async function (req, res) {
        try {
            const record = await PhotographyClientService.findOne(req, req.params.id);
            return res.json(record.data);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error?.error || error);
        }
    },

    updateOne: async function (req, res) {
        try {
            const record = await PhotographyClientService.updateOne(req, req.params.id, req.body);
            return res.json(record.data);
        } catch (error) {
            return res.status(error?.statusCode || 500).send(error?.error || error);
        }
    },
};
