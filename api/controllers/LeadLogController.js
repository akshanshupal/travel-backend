module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

    find: async function (req, res) {
        try {
            const records = await LeadLogService.find(req, req.query);
            return res.json(records);
        } catch (error) {
            return res.serverError(error);
        }
    },

    findOne: async function (req, res) {
        if (!req.params.id) {
            return res.badRequest({ code: 'Error', message: 'ID is missing' });
        }
        try {
            const record = await LeadLogService.findOne(req, req.params.id);
            return res.json(record.data);
        } catch (error) {
            return res.serverError(error);
        }
    },
};
