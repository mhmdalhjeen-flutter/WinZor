import React, { useState, useEffect } from 'react';
import { CreditCard, Coins, ChevronRight, Info, Star, RefreshCw, Zap } from 'lucide-react';
import axios from '../api/axios';

const Inventory = () => {
    const [userCards, setUserCards] = useState([]);
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [redeemingId, setRedeemingId] = useState(null);

    const fetchInventory = async () => {
        try {
            const res = await axios.get('/api/users/me'); 
            setUserCards(res.data.inventory?.cards || []);
            setPoints(res.data.points);
        } catch (err) {
            console.error("Error fetching inventory", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleRedeem = async (cardTypeId) => {
        setRedeemingId(cardTypeId);
        try {
            const res = await axios.post('/api/users/redeem-card', { cardTypeId });
            
            // تحديث البيانات محلياً فوراً ليشعر المستخدم بالسرعة
            setPoints(res.data.newPoints);
            setUserCards(prev => prev.map(item => 
                item.cardType._id === cardTypeId 
                ? { ...item, count: res.data.remainingCount } 
                : item
            ).filter(item => item.count > 0)); // إخفاء البطاقة إذا انتهت

            // تنبيه نجاح (يمكن استبداله بـ Toast لاحقاً)
            console.log("تم التبديل بنجاح!");
        } catch (err) {
            alert(err.response?.data?.message || "فشل التبديل");
        } finally {
            setRedeemingId(null);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <RefreshCw className="animate-spin mb-2" size={32} />
            <p>جاري فتح الخزنة...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-20">
            {/* بطاقة الرصيد الإجمالية */}
            <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-gray-400 text-sm font-medium mb-1">رصيد نقاط XP الحالي</p>
                    <div className="flex items-center gap-3">
                        <h1 className="text-5xl font-black">{points}</h1>
                        <div className="bg-primary text-white p-2 rounded-full animate-pulse">
                            <Zap size={24} fill="currentColor" />
                        </div>
                    </div>
                    <div className="mt-6 flex gap-2">
                        <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full text-gray-300">رتبة: برونزي</span>
                        <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full text-gray-300">البطاقات: {userCards.length}</span>
                    </div>
                </div>
                <CreditCard className="absolute -left-10 -bottom-10 text-white/5 w-64 h-64 rotate-12" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 px-2">مخزن البطاقات 🃏</h2>

            {/* قائمة البطاقات القابلة للتبديل */}
            <div className="grid grid-cols-1 gap-4">
                {userCards.length > 0 ? userCards.map((item) => (
                    <div key={item.cardType._id} className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div 
                                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner relative"
                                style={{ backgroundColor: `${item.cardType.color}20`, color: item.cardType.color }}
                            >
                                <CreditCard size={28} />
                                <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center">
                                    {item.count}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{item.cardType.name}</h3>
                                <div className="flex items-center gap-1 text-xs text-green-600 font-bold">
                                    <Coins size={12} />
                                    تعطي {item.cardType.pointsValue} نقطة
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => handleRedeem(item.cardType._id)}
                            disabled={redeemingId === item.cardType._id}
                            className="bg-gray-100 hover:bg-primary hover:text-white text-gray-600 px-4 py-3 rounded-2xl text-xs font-black transition-all active:scale-90 disabled:opacity-50 flex items-center gap-2"
                        >
                            {redeemingId === item.cardType._id ? <RefreshCw className="animate-spin" size={14} /> : 'تبديل'}
                        </button>
                    </div>
                )) : (
                    <div className="text-center py-20 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                        <div className="bg-gray-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <Star size={32} />
                        </div>
                        <p className="text-gray-500 font-medium">مخزنك فارغ حالياً..<br/>افتح الصناديق لتبدأ بجمع البطاقات!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inventory;
