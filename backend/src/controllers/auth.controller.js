const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user");

const register = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, phone, password: hashedPassword, role:"customer" });
        res.status(201).json({ message: "تم إنشاء الحساب بنجاح",
             user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
    } });
    }catch (error) {
    console.error(error.stack);

    res.status(500).json({
        message: error.message
    });
}
};


const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // 1. البحث عن المستخدم
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { phone: identifier }
            ]
        });

        if (!user) {
            return res.status(400).json({ message: "بيانات الدخول غير صحيحة" });
        }

        // 2. التحقق من كلمة المرور
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "بيانات الدخول غير صحيحة" });
        }

        // 3. إنشاء token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // 4. تجهيز user آمن (بدون password)
        const safeUser = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        };

        // 5. الإرسال للواجهة
        res.json({
            message: "تم تسجيل الدخول بنجاح",
            token,
            user: safeUser
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resetAdminPassword = async (req, res) => {
    try {
        const { masterKey, newPassword } = req.body;
        if (masterKey !== process.env.MASTER_KEY) return res.status(401).json({ message: "خطأ في المفتاح" });
        const admin = await User.findOne({ role: "admin" });
        if (!admin) return res.status(404).json({ message: "الأدمن غير موجود" });
        admin.password = await bcrypt.hash(newPassword, 10);
        await admin.save();
        res.json({ message: "تم تحديث كلمة المرور" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { register, login, resetAdminPassword };
