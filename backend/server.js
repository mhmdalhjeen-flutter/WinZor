const dns = require('dns');
dns.setServers(['8.8.4.4', '8.8.8.8']);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/auth.routes");
const storeRoutes = require("./src/routes/store.routes");
const offerRoutes = require("./src/routes/offer.routes");
const productRoutes = require("./src/routes/product.routes");
const promoRoutes = require("./src/routes/promo.routes");
const adminRoutes = require("./src/routes/admin.routes");
const drawRoutes = require("./src/routes/draw.routes");
const monitorOffers = require("./src/utils/offerMonitor"); // استيراد المراقب التلقائي

dotenv.config();

// connect MongoDB
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/promo", promoRoutes);
app.use("/api/draws", drawRoutes);

// تشغيل المراقب التلقائي مرة كل 24 ساعة
setInterval(() => {
    console.log("[System]: جاري فحص العروض والمنتجات المنتهية...");
    monitorOffers();
}, 24 * 60 * 60 * 1000);

// تشغيل الفحص لمرة واحدة عند تشغيل السيرفر للتأكد من المزامنة
monitorOffers();

app.get("/", (req, res) => {
    res.send("Offers Tech API Running 🚀");
});

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
