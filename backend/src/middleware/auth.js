const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please log in."
        });
    }

    const token = header.slice(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email
        };

        return next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Your session has expired. Please log in again."
        });
    }
};

module.exports = requireAuth;
