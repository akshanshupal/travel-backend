const bad = (res, error) => { const status = Number(error?.statusCode || error?.code); if (status === 404) return res.notFound(error.error || error); if (status === 400) return res.badRequest(error.error || error); if (status === 403) return res.forbidden(error.error || error); return res.serverError(error); };
const run = (fn) => async function (req, res) { try { return res.json(await fn(req, req.params?.id, req.method === "GET" ? req.query : (req.body || {}))); } catch (error) { return bad(res, error); } };
module.exports = {
    _config: { actions: false, shortcuts: false, rest: false },
    queue: run((req, id, data) => DialService.queue(req, data)),
    summary: run((req, id, data) => DialService.queueSummary(req, data)),
    createCallLog: run((req, id, data) => DialService.createCall(req, data)),
    callLogs: run((req, id, data) => DialService.callLogs(req, data)),
    callLog: run((req, id) => DialService.callLog(req, id)),
    updateCallLog: run((req, id, data) => DialService.updateCall(req, id, data)),
    deleteCallLog: run((req, id) => DialService.deleteCall(req, id)),
    tasks: run((req, id, data) => DialService.tasks(req, data)),
    createTask: run((req, id, data) => DialService.createTask(req, data)),
    task: run((req, id) => DialService.task(req, id)),
    updateTask: run((req, id, data) => DialService.updateTask(req, id, data)),
    deleteTask: run((req, id) => DialService.deleteTask(req, id)),
    assignTask: run((req, id) => DialService.assignTask(req, id)),
    completeTask: run((req, id, data) => DialService.completeTask(req, id, data)),
    reports: run((req, id, data) => DialService.reports(req, data)),
    campaigns: run((req, id) => DialService.campaigns(req, id)),
    walkInLeads: run((req, id, data) => DialService.walkInLeads(req, data)),
    createWalkInLead: run((req, id, data) => DialService.createWalkInLead(req, data)),
    walkInLead: run((req, id) => DialService.walkInLead(req, id)),
    updateWalkInLead: run((req, id, data) => DialService.updateWalkInLead(req, id, data)),
    deleteWalkInLead: run((req, id) => DialService.deleteWalkInLead(req, id)),
    assignWalkInLead: run((req, id, data) => DialService.assignWalkInLead(req, id, data)),
    convertWalkInLead: run((req, id, data) => DialService.convertWalkInLead(req, id, data)),
    createWalkInCallLog: run((req, id, data) => DialService.createWalkInCall(req, id, data))
};
