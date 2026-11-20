// TEMPORARY DEVELOPMENT MIDDLEWARE
// Replace with shared JWT authentication before production.

exports.protect = (req, res, next) => {
    if (process.env.NODE_ENV === "production") {
        return res.status(503).json({
            success: false,
            message: "JWT authentication has not been integrated."
        });
    }

    const userId = req.headers["x-user-id"];
    const organizationId = req.headers["x-org-id"];
    const role = req.headers["x-user-role"];

    if (!userId || !organizationId || !role) {
        return res.status(401).json({
            success: false,
            message: "Provide development authentication headers."
        });
    }

    if (!["MENTOR", "CANDIDATE"].includes(role)) {
        return res.status(403).json({
            success: false,
            message: "Invalid role."
        });
    }

    req.user = {
        id: userId,
        organizationId,
        role
    };

    next();
};