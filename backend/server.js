const dns = require('dns');
dns.setServers(['8.8.4.4', '8.8.8.8']);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const User = require("./src/models/user");
const bcrypt = require("bcryptjs");

// Routes
const authRoutes = require("./src/routes/auth.routes");
const userRoutes = require("./src/routes/user.routes"); 
const adminRoutes = require("./src/routes/admin.routes");
const storeRoutes = require("./src/routes/store.routes");
const offerRoutes = require("./src/routes/offer.routes");
const productRoutes = require("./src/routes/product.routes");
const promoRoutes = require("./src/routes/promo.routes");
const drawRoutes = require("./src/routes/draw.routes");
const chestRoutes = require("./src/routes/chest.routes");
const honorRoutes = require("./src/routes/honor.routes");
const treasureRoutes = require("./src/routes/treasure.routes");

const monitorOffers = require("./src/utils/offerMonitor"); 

dotenv.config();
connectDB();

// وظيفة إصلاح الأدمن القوية
const seedAdmin = async () => {
    try {
        const adminEmail = "admin@offers.com";
        const adminPassword = "admin123456";
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // استخدام updateOne لضمان عدم تدخل أي وظائف تلقائية (Hooks) في التشفير
        await User.updateOne(
            { email: adminEmail },
            { 
                $set: { 
                    name: "مدير المنصة",
                    password: hashedPassword,
                    role: "admin",
                    status: "active"
                } 
            },
            { upsert: true }
        );
        console.log("🚀 تم تأكيد بيانات الأدمن: " + adminEmail + " | الباسورد: " + adminPassword);
    } catch (err) {
        console.error("❌ فشل عملية Seed الأدمن:", err.message);
    }
};
seedAdmin();

const app = express();
app.use(cors());
app.use(express.json());

// API Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); 
app.use("/api/admin", adminRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/promo", promoRoutes);
app.use("/api/draws", drawRoutes);
app.use("/api/chest", chestRoutes);
app.use("/api/honor", honorRoutes);
app.use("/api/treasure", treasureRoutes);

// Cron-like monitor
setInterval(() => monitorOffers(), 24 * 60 * 60 * 1000);
monitorOffers();

app.get("/", (req, res) => res.send("Offers Tech API Running 🚀"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
