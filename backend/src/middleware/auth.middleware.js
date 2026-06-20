const jwt = require("jsonwebtoken");
const User = require("../models/user");


const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");

        // 🔴 check header
        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        // 🔴 check format
        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Invalid token format" });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Token missing" });
        }

        // 🔐 verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 👤 find user
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // 📌 attach user to request
        req.user = {
            id: user._id,
            role: user.role,
            email: user.email,
        };

        next();

    } catch (error) {
    console.error("Auth middleware error:", error.message);

    return res.status(401).json({
        message: "Invalid or expired token"
    });
}
};

module.exports = authMiddleware;