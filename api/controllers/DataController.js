const CUSTOM_COLUMN_KEY = "CUSTOM_COLUMN";

module.exports = {
    findCustomColumn: async function (req, res) {
        try {
            const record = await Data.findOne({
                key: CUSTOM_COLUMN_KEY,
                company: req.session.activeCompany.id,
            });
            return res.json(record || { key: CUSTOM_COLUMN_KEY, value: {} });
        } catch (error) {
            return res.serverError(error);
        }
    },

    saveCustomColumn: async function (req, res) {
        const company = req.session.activeCompany.id;
        const value = req.body?.value;
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            return res.badRequest({ code: "Error", message: "value must be a JSON object" });
        }

        try {
            const existing = await Data.findOne({ key: CUSTOM_COLUMN_KEY, company });
            const record = existing
                ? await Data.updateOne({ id: existing.id }).set({ value })
                : await Data.create({ key: CUSTOM_COLUMN_KEY, value, company }).fetch();
            return res.json(record);
        } catch (error) {
            return res.serverError(error);
        }
    },
};
