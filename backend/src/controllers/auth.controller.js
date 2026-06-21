const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const ActivationCode = require("../models/ActivationCode");

// ================= REGISTER =================
const register = async (req, res) => {
    
    try {
        const {
            name,
            email,
            phone,
            password,
            accountType,
            activationCode
        } = req.body;

       
        const cleanEmail = email?.trim() || undefined;
        const cleanPhone = phone?.trim() || undefined;

       
        // 🟢 1. تحقق من وجود المستخدم مسبقاً
         const existingUser = await User.findOne({
            $or: [
                cleanEmail ? { email: cleanEmail } : null,
                cleanPhone ? { phone: cleanPhone } : null
            ].filter(Boolean)
            });
       

        if (existingUser) {
            return res.status(400).json({
                message: "هذا الحساب موجود مسبقاً"
            });
        }

        let role = "customer";
        let activation = null;

        // 🟢 2. تحقق الكود فقط لو store أو supplier
        if (accountType === "store" || accountType === "supplier") {

            if (!activationCode) {
                return res.status(400).json({
                    message: "كود التفعيل مطلوب"
                });
            }

            activation = await ActivationCode.findOne({
                code: activationCode,
                type: "store_activation",
                isUsed: false
            });

            if (!activation) {
                return res.status(400).json({
                    message: "كود التفعيل غير صالح أو مستخدم"
                });
            }

            role = accountType;
        }
        
        
        // 🟢 3. إنشاء المستخدم
        const hashedPassword = await bcrypt.hash(password, 10);

         const user = await User.create({
            name,
            email: cleanEmail,
            phone: cleanPhone,
            password: hashedPassword,
            role
            });
       

        // 🟢 4. تفعيل الكود بعد نجاح إنشاء المستخدم فقط
        if (activation) {
            activation.isUsed = true;
            activation.usedBy = user._id;
            await activation.save();
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
            );

            return res.status(201).json({
            message: "تم إنشاء الحساب بنجاح",
            token,
            user
            });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const cleanIdentifier = identifier?.trim();

    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { phone: cleanIdentifier }
      ]
    });

    if (!user) {
      return res.status(400).json({
        message: "بيانات الدخول غير صحيحة"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "بيانات الدخول غير صحيحة"
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "تم تسجيل الدخول بنجاح",
      token,
      user
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
// ================= RESET ADMIN PASSWORD =================
const resetAdminPassword = async (req, res) => {
    try {
        const { masterKey, newPassword } = req.body;

        if (masterKey !== process.env.MASTER_KEY) {
            return res.status(401).json({
                message: "خطأ في المفتاح"
            });
        }

        const admin = await User.findOne({ role: "admin" });

        if (!admin) {
            return res.status(404).json({
                message: "الأدمن غير موجود"
            });
        }

        admin.password = await bcrypt.hash(newPassword, 10);
        await admin.save();

        res.json({ message: "تم تحديث كلمة المرور" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    register,
    login,
    resetAdminPassword
};