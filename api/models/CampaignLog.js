/**
 * CampaignLog Model Schema
 * Tracks campaign change history (created, updated, paused, copied, deleted).
 */

module.exports = {

    attributes: {
        campaign: {
            model: 'campaign'
        },
        action: {
            type: 'string',
            isIn: ['created', 'updated', 'paused', 'unpaused', 'copied', 'deleted']
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
