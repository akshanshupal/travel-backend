module.exports = {
    _config: { actions: false, shortcuts: false, rest: false },
    find: async function (req, res) {
        try {
            return res.json(await LeadFollowUpService.find(req, req.query));
        } catch (error) { return res.serverError(error); }
    },
    findOne: async function (req, res) {
        try {
            const record = await LeadFollowUpService.findOne(req, req.params.id);
            return res.json(record.data);
        } catch (error) { return res.serverError(error); }
    },
    create: async function (req, res) {
        try {
            const record = await LeadFollowUpService.create(req, req.body);
            return res.json(record.data);
        } catch (error) { return res.serverError(error); }
    },
    updateOne: async function (req, res) {
        try {
            const record = await LeadFollowUpService.updateOne(req, req.params.id, req.body);
            return res.json(record.data);
        } catch (error) { return res.serverError(error); }
    },
    deleteOne: async function (req, res) {
        try {
            const record = await LeadFollowUpService.deleteOne(req, req.params.id);
            return res.json(record.data);
        } catch (error) { return res.serverError(error); }
    },
};
