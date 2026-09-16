module.exports = {
    attributes: {
        lead: { model: "leads", required: true },
        assignedTo: { model: "user", required: true },
        type: { type: "string", required: true },
        dueAt: { type: "ref", columnType: "datetime", required: true },
        status: { type: "string", defaultsTo: "pending" },
        notes: { type: "string" },
        outcome: { type: "string" },
        completedAt: { type: "ref", columnType: "datetime" },
        company: { model: "company", required: true },
        isDeleted: { type: "boolean", defaultsTo: false },
        deletedAt: { type: "ref", columnType: "datetime" },
        deletedBy: { model: "user" },
    },
};
