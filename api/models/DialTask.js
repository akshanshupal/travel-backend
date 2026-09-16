module.exports = {
    attributes: {
        title: { type: "string", required: true },
        description: { type: "string" },
        type: { type: "string", defaultsTo: "call" },
        status: { type: "string", defaultsTo: "pending" },
        dueAt: { type: "ref", columnType: "datetime", required: true },
        assignedTo: { model: "user", required: true },
        lead: { model: "leads" },
        campaign: { model: "campaign" },
        company: { model: "company", required: true },
        completedAt: { type: "ref", columnType: "datetime" },
        metadata: { type: "json", defaultsTo: {} },
        isDeleted: { type: "boolean", defaultsTo: false },
        deletedAt: { type: "ref", columnType: "datetime" },
        deletedBy: { model: "user" }
    }
};
