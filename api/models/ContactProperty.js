module.exports = {
    attributes: {
        label: { type: "string", required: true },
        key: { type: "string", required: true },
        fieldType: { type: "string", required: true },
        options: { type: "json", defaultsTo: [] },
        required: { type: "boolean", defaultsTo: false },
        description: { type: "string" },
        status: { type: "boolean", defaultsTo: true },
        company: { model: "company", required: true },
        isDeleted: { type: "boolean", defaultsTo: false },
        deletedAt: { type: "ref", columnType: "datetime" },
        deletedBy: { model: "user" },
    },
};
