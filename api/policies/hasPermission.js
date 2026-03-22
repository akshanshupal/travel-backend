module.exports = async function (req, res, next) {
    const user = req && req.session ? req.session.user : undefined;
    if (!user) {
        return res.forbidden({ code: "UnAuthorised", message: "Please login!" });
    }

    if (String(user.type || "").toUpperCase() === "ADMIN") {
        return next();
    }

    const role = user.role;
    const permissions = (role && role.permissions) ? role.permissions : {};

    const query = req && req.query ? req.query : {};
    const accessContext = req && req.accessContext ? req.accessContext : {};
    const accessMode = (accessContext && accessContext.accessMode ? String(accessContext.accessMode) : (query && query.accessMode ? String(query.accessMode) : "")).toLowerCase();
    const accessResource = (accessContext && accessContext.accessResource ? String(accessContext.accessResource) : (query && query.accessResource ? String(query.accessResource) : "")).toLowerCase();
    const accessAction = (accessContext && accessContext.accessAction ? String(accessContext.accessAction) : (query && query.accessAction ? String(query.accessAction) : "")).toLowerCase();
    if (query) {
        if (query.accessPath) delete query.accessPath;
        if (query.accessResource) delete query.accessResource;
        if (query.accessAction) delete query.accessAction;
        if (query.accessMode) delete query.accessMode;
    }

    const method = String(req.method || "").toUpperCase();
    const action =
        method === "GET"
            ? "view"
            : method === "POST"
                ? "add"
                : method === "PUT" || method === "PATCH"
                    ? "edit"
                    : method === "DELETE"
                        ? "delete"
                        : "view";

    const controller = String(req.options && req.options.controller ? req.options.controller : "").toLowerCase();
    const parts = String(req.path || "").split("/").filter(Boolean);
    const resource = (controller || parts[1] || "").toLowerCase();

    if (!resource) {
        return res.forbidden({ code: "Error", message: "Not authorised!!" });
    }

    const resolveResourceAliases = (key) => {
        if (key === "saveditinerary") return ["saveditinerary", "saved-itinerary"];
        if (key === "saved-itinerary") return ["saved-itinerary", "saveditinerary"];
        if (key === "sendmail") return ["sendmail", "itineraryreports"];
        return [key];
    };
    const resourceAliases = resolveResourceAliases(resource);

    const hasAccess = (resourceKey, accessAction) => {
        const keys = resolveResourceAliases(resourceKey);
        return keys.some((k) => Boolean(permissions && permissions[k] && permissions[k][accessAction]));
    };

    const allowed = resourceAliases.some((key) => Boolean(permissions && permissions[key] && permissions[key][action]));
    if (!allowed) {
        const canBypassViewForLookup =
            method === "GET" &&
            action === "view" &&
            accessMode === "lookup" &&
            accessResource &&
            (accessAction === "add" || accessAction === "edit" || accessAction === "view") &&
            hasAccess(accessResource, accessAction);
        if (canBypassViewForLookup) {
            return next();
        }

        const isUserListLookup =
            action === "view" &&
            method === "GET" &&
            resourceAliases.includes("user") &&
            parts[0] === "api" &&
            parts[1] === "user" &&
            parts.length === 2;

        if (isUserListLookup) {
            return next();
        }

        return res.forbidden({ code: "Error", message: "Not authorised!!" });
    }

    next();
};
