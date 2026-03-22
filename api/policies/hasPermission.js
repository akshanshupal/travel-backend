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
        const isMailTemplateLookup = action === "view" && method === "GET" && resourceAliases.includes("mailtemplate");
        if (isMailTemplateLookup) {
            const accessResource = req && req.query && req.query.accessResource ? String(req.query.accessResource).toLowerCase() : "";
            const accessAction = req && req.query && req.query.accessAction ? String(req.query.accessAction).toLowerCase() : "";
            if (accessResource && accessAction && hasAccess(accessResource, accessAction)) {
                return next();
            }
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
