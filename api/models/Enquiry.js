module.exports = {
    attributes: {
        fullName: {
            type: "string",
            required: true,
        },
        email: {
            type: "string",
        },
        mobile: {
            type: "string",
            required: true,
        },
        message: {
            type: "string",
        },
        destination: {
            type: "string",
        },
        packageName: {
            type: "string",
        },
        travelDate: {
            type: "string",
        },
        days: {
            type: "number",
        },
        adults: {
            type: "number",
        },
        kids: {
            type: "number",
        },
        transferredToLead: {
            type: "boolean",
            defaultsTo: false,
        },
        source: {
            type: "string",
        },
        pageUrl: {
            type: "string",
            required: true,
        },
        meta: {
            type: "json",
            defaultsTo: {},
        },
        company: {
            model: "company",
        },
        isDeleted: { type: "boolean" },
        deletedAt: { type: "ref", columnType: "datetime" },
        deletedBy: { model: "user" },
    },
};
