module.exports = {
    attributes: {
        lead: { model: "leads", required: true },
        campaign: { model: "campaign" },
        initiatedBy: { model: "user", required: true },
        agent: { model: "user" },
        company: { model: "company", required: true },
        outcome: { type: "string", required: true },
        disposition: { type: "string" },
        startedAt: { type: "ref", columnType: "datetime", required: true },
        endedAt: { type: "ref", columnType: "datetime" },
        durationSeconds: { type: "number", defaultsTo: 0 },
        notes: { type: "string" },
        nextFollowUpAt: { type: "ref", columnType: "datetime" },
        connected: { type: "boolean", defaultsTo: false },
        metadata: { type: "json", defaultsTo: {} },
        isDeleted: { type: "boolean", defaultsTo: false },
        deletedAt: { type: "ref", columnType: "datetime" },
        deletedBy: { model: "user" }
    }
};
