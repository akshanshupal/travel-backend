module.exports = async function (req, res, next) {
    const user = req?.session?.user;
    if (!user) {
        return res.forbidden({ code: "UnAuthorised", message: "Please login!" });
    }

    if (String(user?.type || "").toUpperCase() === "ADMIN") {
        return next();
    }

    const role = user.role;
    const permissions = role?.permissions || {};

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

    const controller = String(req.options?.controller || "").toLowerCase();
    const parts = String(req.path || "").split("/").filter(Boolean);
    const resource = (controller || parts[1] || "").toLowerCase();

    if (!resource) {
        return res.forbidden({ code: "Error", message: "Not authorised!!" });
    }

    const resourceAliases = (() => {
        if (resource === "saveditinerary") return ["saveditinerary", "saved-itinerary"];
        if (resource === "saved-itinerary") return ["saved-itinerary", "saveditinerary"];
        if (resource === "sendmail") return ["sendmail", "itineraryreports"];
        return [resource];
    })();

    const allowed = resourceAliases.some((key) => Boolean(permissions?.[key]?.[action]));
    if (!allowed) {
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
