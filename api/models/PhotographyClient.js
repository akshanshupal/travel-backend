module.exports = {
    attributes: {
        name: {
            type: "string",
            required: true,
        },
        phone: {
            type: "string",
            required: true,
        },
        address: {
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
