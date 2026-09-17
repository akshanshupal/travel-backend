/**
 * LeadLog Model Schema
 * Tracks lead change history (created, updated, stage-changed, deleted).
 */

module.exports = {

    attributes: {
        lead: {
            model: 'leads'
        },
        campaign: {
            model: 'campaign'
        },
        action: {
            type: 'string',
            isIn: ['created', 'updated', 'stage-changed', 'deleted']
        },
        description: {
            type: 'string'
        },
        changes: {
            type: 'json',
            defaultsTo: []
        },
        performedBy: {
            model: 'user'
        },
        company: {
            model: 'company'
        },
        isDeleted: { type: 'boolean', defaultsTo: false },
        deletedAt: { type: 'ref', columnType: 'datetime' },
        deletedBy: { model: 'user' },
    }
};
