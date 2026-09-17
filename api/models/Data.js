module.exports = {
    attributes: {
        key: { type: "string", required: true },
        value: { type: "json", defaultsTo: {} },
        company: { model: "company", required: true },
    },
};
