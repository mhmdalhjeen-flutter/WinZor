const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
        
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        
    },
   
    googleId: String,
    provider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
},

    password: {
    type: String,
    default: null,
    },
    
    avatar: {
        type: String,
        default: null 
    },
    points: {
        type: Number,
        default: 0,
    },
    energy: { 
        type: Number,
        default: 0,
    },
    // --- مخزن البطاقات الملونة ---
    inventory: {
        cards: [{
            cardType: { type: mongoose.Schema.Types.ObjectId, ref: "CardType" },
            count: { type: Number, default: 0 }
        }]
    },
    referralCode: { 
        type: String,
        unique: true,
    },
    referredBy: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    entriesWallet: { 
        type: Number,
        default: 0,
    },
    codesUsed: { 
        type: Number,
        default: 0,
    },
    rank: { 
        type: String,
        enum: ["bronze", "silver", "gold", "platinum"],
        default: "bronze",
    },
    followedStores: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store"
    }],
    lastChestOpened: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ["active", "suspended", "banned"],
        default: "active",
    },
    role: {
        type: String,
        enum: ["customer", "store", "supplier", "admin"],
        default: "customer",
    },
   

address: {
  type: String,
  default: ""
},
}, {
    timestamps: true,
});

userSchema.pre("validate", function () {
    if (!this.email && !this.phone) {
        throw new Error("يجب توفير البريد الإلكتروني أو رقم الهاتف على الأقل");
    }

    if (!this.referralCode) {
        this.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
});

userSchema.pre("save", function () {
    if (this.isModified("codesUsed")) {
        if (this.codesUsed >= 100) this.rank = "platinum";
        else if (this.codesUsed >= 50) this.rank = "gold";
        else if (this.codesUsed >= 10) this.rank = "silver";
        else this.rank = "bronze";
    }
});
module.exports = mongoose.models.user || mongoose.model("User", userSchema);
