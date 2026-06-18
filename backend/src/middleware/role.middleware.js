const roleMiddleware = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: No user data" });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Access denied: Required role not found` });
        }

        next();
    };
};

module.exports = roleMiddleware;
