const DrawBatch = require("../models/drawBatch");
const User = require("../models/user");
const logActivity = require("../utils/logger");

// ================= الحصول على كافة السحوبات المفتوحة =================
exports.getOpenDraws = async (req, res) => {
    try {
        const draws = await DrawBatch.find({ 
            status: { $in: ["open", "voting"] } 
        }).select("name description drawDate drawType prizes locationOptions totalEntries totalVoters status");
        
        res.status(200).json(draws);
    } catch (error) {
        res.status(500).json({ message: "خطأ في جلب السحوبات", error: error.message });
    }
};

// ================= التصويت على موقع السحب =================
exports.voteLocation = async (req, res) => {
    try {
        const { drawId, locationName } = req.body;
        const userId = req.user.id;

        const draw = await DrawBatch.findById(drawId);
        if (!draw || draw.status !== "voting") {
            return res.status(400).json({ message: "التصويت غير متاح حالياً" });
        }

        const participant = draw.participants.find(p => p.user.toString() === userId);
        if (!participant) {
            return res.status(400).json({ message: "يجب المشاركة في السحب أولاً لتتمكن من التصويت" });
        }

        if (participant.votedLocation) {
            return res.status(400).json({ message: "لقد قمت بالتصويت مسبقاً" });
        }

        const location = draw.locationOptions.find(l => l.name === locationName);
        if (!location) return res.status(400).json({ message: "موقع غير صحيح" });

        location.votes += 1;
        participant.votedLocation = locationName;
        draw.totalVoters += 1;

        await draw.save();

        // تسجيل النشاط
        await logActivity({
            action: "تصويت على موقع",
            details: `المستخدم قام بالتصويت للموقع: ${locationName} في سحب: ${draw.name}`,
            user: userId
        });

        res.status(200).json({ message: "تم تسجيل صوتك بنجاح", locationOptions: draw.locationOptions });

    } catch (error) {
        res.status(500).json({ message: "خطأ أثناء التصويت", error: error.message });
    }
};

// ================= المشاركة في سحب معين =================
exports.joinDraw = async (req, res) => {
    try {
        const { drawId, entriesToSpend } = req.body;
        const userId = req.user.id;

        const draw = await DrawBatch.findById(drawId);
        if (!draw || (draw.status !== "open" && draw.status !== "voting")) {
            return res.status(400).json({ message: "هذا السحب غير متاح حالياً" });
        }

        const user = await User.findById(userId);
        if (user.entriesWallet < entriesToSpend) {
            return res.status(400).json({ message: "رصيدك من الفرص غير كافٍ" });
        }

        user.entriesWallet -= entriesToSpend;
        await user.save();

        const existingParticipant = draw.participants.find(p => p.user.toString() === userId);

        if (existingParticipant) {
            existingParticipant.entriesCount += entriesToSpend;
        } else {
            draw.participants.push({ user: userId, entriesCount: entriesToSpend });
        }

        draw.totalEntries += entriesToSpend;
        await draw.save();

        // تسجيل النشاط
        await logActivity({
            action: "انضمام لسحب",
            details: `المستخدم ${user.name} شارك بـ ${entriesToSpend} فرصة في سحب: ${draw.name}`,
            user: userId
        });

        res.status(200).json({
            message: `تمت المشاركة بنجاح بـ ${entriesToSpend} فرصة`,
            remainingWallet: user.entriesWallet,
            prizes: draw.prizes
        });

    } catch (error) {
        res.status(500).json({ message: "خطأ أثناء المشاركة", error: error.message });
    }
};

// ================= عرض سحوبات المستخدم =================
exports.getMyDraws = async (req, res) => {
    try {
        const draws = await DrawBatch.find({
            "participants.user": req.user.id
        }).select("name drawDate status winners prizes finalLocation");

        res.status(200).json(draws);
    } catch (error) {
        res.status(500).json({ message: "خطأ في جلب سحوباتك", error: error.message });
    }
};
