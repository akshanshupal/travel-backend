module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

    getSummary: async function (req, res) {
        const {status} = req.query;
        const filter = {};
        if(status){
            filter.status = status;
        }
        try {
            var summary = await DashboardService.getSummary(req, filter);
        } catch (error) {
            return res.serverError(error);
        }
        return res.json(summary);
    }

};
