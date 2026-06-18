const ActivityLog = require("../models/ActivityLog");

/**
 * وظيفة تسجيل النشاطات في قاعدة البيانات
 * @param {Object} data - بيانات النشاط (action, details, user, store, severity)
 */
const logActivity = async ({ action, details, user = null, store = null, severity = "info" }) => {
    try {
        await ActivityLog.create({
            action,
            details,
            user,
            store,
            severity
        });
    } catch (error) {
        console.error("Failed to log activity:", error.message);
    }
};

module.exports = logActivity;
