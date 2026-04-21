module.exports = {
    attributes: {
        estimate: {
            model: "photographyestimate",
            required: true,
        },
        mainEventName: {
            type: "string",
            required: true,
        },
        timing: {
            type: "string",
            allowNull: true,
        },
        deliverables: {
            type: "json",
            columnType: "array",
            defaultsTo: [],
        },
        packageCost: {
            type: "number",
            defaultsTo: 0,
        },
        company: {
            model: "company",
        },
        isDeleted: { type: "boolean" },
        deletedAt: { type: "ref", columnType: "datetime" },
        deletedBy: { model: "user" },
    },
};
