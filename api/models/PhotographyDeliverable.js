module.exports = {
    attributes: {
        title: {
            type: "string",
            required: true,
        },
        company: {
            model: "company",
        },
        isDeleted: { type: "boolean" },
        deletedAt: { type: "ref", columnType: "datetime" },
        deletedBy: { model: "user" },
    },
};
