const dns = require('dns');
dns.setServers(['8.8.4.4', '8.8.8.8']);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const connectDB = require("./src/config/db");
const User = require("./src/models/user");

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
const activationRoutes = require("./src/routes/activation.routes");

const monitorOffers = require("./src/utils/offerMonitor");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ================= ROUTES ================= */
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
app.use("/api/activation", activationRoutes);

/* ================= SEED ADMIN ================= */
const seedAdmin = async () => {
    try {
        const adminEmail = "admin@offers.com";
        const adminPassword = "admin123456";
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const existing = await User.findOne({ email: adminEmail });
        if (existing) return;

        await User.create({
            name: "مدير المنصة",
            email: adminEmail,
            password: hashedPassword,
            role: "admin",
            status: "active"
        });

        console.log("🚀 Admin created");
    } catch (err) {
        console.error("❌ Seed Admin Error:", err.message);
    }
};

/* ================= START SERVER ================= */
const startServer = async () => {
    try {
        await connectDB();


        await seedAdmin();

        monitorOffers();

        setInterval(() => {
            monitorOffers();
        }, 24 * 60 * 60 * 1000);

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (err) {
        console.error("Server Error:", err.message);
        process.exit(1);
    }
};

startServer();

/* ================= HOME ================= */
app.get("/", (req, res) => {
    res.send("Offers Tech API Running 🚀");
});