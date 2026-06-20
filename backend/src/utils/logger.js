const ActivityLog = require("../models/activityLog");

/**
 * وظيفة تسجيل النشاطات في قاعدة البيانات مع دعم الأمان
 * @param {Object} data - بيانات النشاط (action, details, user, store, severity, ipAddress)
 */
const logActivity = async ({ action, details, user = null, store = null, severity = "info", ipAddress = null }) => {
    try {
        await ActivityLog.create({
            action,
            details,
            user,
            store,
            severity,
            ipAddress
        });
    } catch (error) {
        console.error("Failed to log activity:", error.message);
    }
};

module.exports = logActivity;
