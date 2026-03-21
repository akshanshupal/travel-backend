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

    const allowed = Boolean(permissions?.[resource]?.[action]);
    if (!allowed) {
        return res.forbidden({ code: "Error", message: "Not authorised!!" });
    }

    next();
};
