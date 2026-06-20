const Store = require("../models/store");
const Offer = require("../models/offer");
const Product = require("../models/product");
const user = require("../models/user");
const logActivity = require("../utils/logger");

// ================= إنشاء متجر جديد =================
exports.createStore = async (req, res) => {
    try {
        const { name, description, phone, address, region, subRegion, category, image } = req.body;

        if (req.user.role !== "store") {
            return res.status(403).json({ message: "هذا الحساب غير مخول لإنشاء متجر. يرجى تفعيل الحساب أولاً." });
        }

        const existingStore = await Store.findOne({ owner: req.user.id });
        if (existingStore) {
            return res.status(400).json({ message: "لديك متجر مسجل بالفعل." });
        }

        const store = await Store.create({
            name,
            description,
            phone,
            address,
            region,
            subRegion,
            category,
            logo: image,
            owner: req.user.id,
            isActive: false 
        });

        await logActivity({
            action: "إنشاء متجر",
            details: `المستخدم قام بإنشاء طلب لمتجر جديد باسم: ${name}`,
            user: req.user.id,
            store: store._id,
            severity: "warning",
            ipAddress: req.ip
        });

        res.status(201).json({
            message: "تم إنشاء المتجر بنجاح، وهو بانتظار تفعيل الإدارة ليظهر للعامة.",
            store
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ================= نظام الانضمام للمتجر (Store Following) =================
exports.followStore = async (req, res) => {
    try {
        const { storeId } = req.params;
        const userId = req.user.id;

        const store = await Store.findById(storeId);
        if (!store) return res.status(404).json({ message: "المتجر غير موجود" });

        const user = await User.findById(userId);
        
        // التحقق إذا كان منضماً بالفعل
        const isFollowing = user.followedStores.includes(storeId);
        
        if (isFollowing) {
            // إلغاء الانضمام
            user.followedStores = user.followedStores.filter(id => id.toString() !== storeId);
            store.customersCount = Math.max(0, store.customersCount - 1);
            await user.save();
            await store.save();
            return res.status(200).json({ message: "تم إلغاء الانضمام للمتجر", isFollowing: false });
        } else {
            // انضمام جديد
            user.followedStores.push(storeId);
            store.customersCount += 1;
            await user.save();
            await store.save();
            
            await logActivity({
                action: "انضمام لمتجر",
                details: `الزبون ${user.name} انضم لقائمة زبائن متجر ${store.name}`,
                user: userId,
                store: storeId
            });

            return res.status(200).json({ message: "تم الانضمام لزبائن المتجر بنجاح", isFollowing: true });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ================= جلب زبائن المتجر (للتاجر والأدمن) =================
exports.getStoreCustomers = async (req, res) => {
    try {
        const { storeId } = req.params;
        
        // التأكد أن الطلب من صاحب المتجر أو الأدمن
        const store = await Store.findById(storeId);
        if (!store) return res.status(404).json({ message: "المتجر غير موجود" });
        
        if (req.user.role !== 'admin' && store.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: "غير مسموح لك برؤية قائمة الزبائن" });
        }

        const customers = await User.find({ followedStores: storeId }).select("name phone rank codesUsed");
        
        res.json({
            count: customers.length,
            customers
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ================= جلب بيانات متجر بالتفصيل =================
exports.getStoreById = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) return res.status(404).json({ message: "المتجر غير موجود" });

        store.totalVisits += 1;
        store.todayVisits += 1;
        await store.save();

        const offers = await Offer.find({ store: store._id, isActive: true });
        const products = await Product.find({ store: store._id, isActive: true });

        // التحقق إذا كان المستخدم الحالي متابعاً للمتجر
        let isFollowing = false;
        if (req.user) {
            const user = await User.findById(req.user.id);
            isFollowing = user.followedStores.includes(store._id);
        }

        res.json({
            store,
            offers,
            products,
            isFollowing
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllStores = async (req, res) => {
    try {
        const { region, category } = req.query;
        let query = { isActive: true };
        if (region) query.region = region;
        if (category) query.category = category;
        const stores = await Store.find(query).select("name logo region subRegion category description customersCount");
        res.json({ count: stores.length, stores });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
