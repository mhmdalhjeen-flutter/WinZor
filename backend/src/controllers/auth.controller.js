const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logActivity = require("../utils/logger");

// ================= REGISTER =================
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || "customer"
        });

        // تسجيل النشاط
        await logActivity({
            action: "تسجيل جديد",
            details: `مستخدم جديد باسم ${name} قام بإنشاء حساب رتبة ${user.role}`,
            user: user._id
        });

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            await logActivity({
                action: "فشل دخول",
                details: `محاولة دخول فاشلة ببريد إلكتروني غير موجود: ${email}`,
                severity: "warning"
            });
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await logActivity({
                action: "فشل دخول",
                details: `كلمة مرور خاطئة للمستخدم: ${email}`,
                user: user._id,
                severity: "warning"
            });
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // تسجيل النشاط
        await logActivity({
            action: "تسجيل دخول",
            details: `المستخدم ${user.name} قام بتسجيل الدخول للنظام`,
            user: user._id
        });

        res.json({
            message: "Login successful",
            token,
            user
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ================= RESET ADMIN PASSWORD (EMERGENCY) =================
exports.resetAdminPassword = async (req, res) => {
    try {
        const { masterKey, email, newPassword } = req.body;

        if (!masterKey || masterKey !== process.env.ADMIN_RECOVERY_KEY) {
            await logActivity({
                action: "اختراق محتمل",
                details: `محاولة فاشلة لاستخدام مفتاح الطوارئ للبريد: ${email}`,
                severity: "danger"
            });
            return res.status(401).json({ message: "Unauthorized: Invalid Master Key" });
        }

        const user = await User.findOne({ email, role: 'admin' });
        if (!user) {
            return res.status(404).json({ message: "Admin user not found" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        await logActivity({
            action: "استعادة كلمة المرور",
            details: `تمت استعادة كلمة مرور الأدمن بنجاح باستخدام مفتاح الطوارئ`,
            user: user._id,
            severity: "warning"
        });

        res.status(200).json({ message: "Admin password reset successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};