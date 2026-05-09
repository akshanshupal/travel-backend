module.exports = {
    attributes: {
        client: {
            model: "photographyclient",
            required: true,
        },
        agent: {
            model: "user",
            required: true,
        },
        booking: {
            model: "photographybooking",
        },
        estimateNumber: {
            type: "string",
            required: true,
        },
        estimateDate: {
            type: "string",
            required: true,
        },
        validUntil: {
            type: "string",
            allowNull: true,
        },
        grandTotal: {
            type: "number",
            defaultsTo: 0,
        },
        items: {
            type: "json",
            columnType: "array",
            defaultsTo: [],
        },
        company: {
            model: "company",
        },
        isDeleted: { type: "boolean" },
        deletedAt: { type: "ref", columnType: "datetime" },
        deletedBy: { model: "user" },
    },
};
