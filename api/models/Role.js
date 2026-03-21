/**
 * Role Model Schema
 *
 */
module.exports = {
    attributes: {
        title: {
            type: "string",
            required: true,
        },
        company: {
            model: "company",
            required: true,
        },
        permissions: {
            type: "json",
            defaultsTo: {},
        },
        status: {
            type: "boolean",
            defaultsTo: true,
        },
        isDeleted: { type: "boolean" },
        deletedAt: { type: "ref", columnType: "datetime" },
        deletedBy: { model: "user" },
    },
};

