module.exports = {
    attributes: {
        estimateNumber: {
            type: "string",
            unique: true,
        },
        estimateDate: {
            type: "ref",
            required: true,
            columnType: "datetime",
        },
        client: {
            model: "photographyclient",
            required: true,
        },
        agent: {
            model: "user",
            required: true,
        },
        company: {
            model: "company",
        },
        booking: {
            model: "photographybooking",
        },
        items: {
            type: "json",
            defaultsTo: [],
        },
        grandTotal: {
            type: "number",
            defaultsTo: 0,
        },
        isDeleted: {
            type: "boolean",
        },
        deletedAt: {
            type: "ref",
            columnType: "datetime",
        },
        deletedBy: {
            model: "user",
        },
    },
};
