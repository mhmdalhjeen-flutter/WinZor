import React, { useState, useEffect } from 'react';
import { Package, ExternalLink, Lock, CheckCircle2, Gift, Loader2, Sparkles, Timer } from 'lucide-react';
import axios from '../api/axios';

const TreasureChests = () => {
    const [chests, setChests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [opening, setOpening] = useState(null); 
    const [reward, setReward] = useState(null);
    const [isShaking, setIsShaking] = useState(false);
    
    // حالات التحقق الذكي
    const [clickedLinks, setClickedLinks] = useState({}); // تتبع الروابط التي تم الضغط عليها
    const [verifying, setVerifying] = useState({}); // عدادات الثواني لكل صندوق

    useEffect(() => {
        fetchChests();
    }, []);

    const fetchChests = async () => {
        try {
            const res = await axios.get('/api/treasure/available');
            setChests(res.data.data);
        } catch (err) {
            console.error("Error fetching chests", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLinkClick = (chestId) => {
        if (clickedLinks[chestId]) return;

        setClickedLinks(prev => ({ ...prev, [chestId]: true }));
        let seconds = 10;
        setVerifying(prev => ({ ...prev, [chestId]: seconds }));

        const interval = setInterval(() => {
            seconds -= 1;
            if (seconds <= 0) {
                clearInterval(interval);
                setVerifying(prev => ({ ...prev, [chestId]: 0 }));
            } else {
                setVerifying(prev => ({ ...prev, [chestId]: seconds }));
            }
        }, 1000);
    };

    const handleOpenBox = async (chestId) => {
        setIsShaking(true);
        setOpening(chestId);
        
        setTimeout(async () => {
            try {
                const res = await axios.post(`/api/treasure/open/${chestId}`);
                setIsShaking(false);
                setReward(res.data.wonCard);
                fetchChests();
            } catch (err) {
                setIsShaking(false);
                setOpening(null);
                alert(err.response?.data?.message || "فشل فتح الصندوق");
            }
        }, 1500);
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-700">
            <style>{`
                @keyframes box-shake {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(5deg); }
                    50% { transform: rotate(-5deg); }
                    75% { transform: rotate(5deg); }
                    100% { transform: rotate(0deg); }
                }
                .animate-shake { animation: box-shake 0.2s infinite; }
            `}</style>

            <div className="text-center py-6">
                <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-1 rounded-full text-xs font-black mb-2 animate-bounce">
                    <Sparkles size={14} /> مهام ذكية.. جوائز حقيقية
                </div>
                <h1 className="text-4xl font-black text-gray-900">صناديق الكنز 🎁</h1>
                <p className="text-gray-500 text-sm mt-1">نفذ المهام وانتظر التحقق لفتح الكنز</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {chests.map((chest) => {
                    const isUnlocked = clickedLinks[chest._id] && verifying[chest._id] === 0;
                    const isTimerRunning = verifying[chest._id] > 0;

                    return (
                        <div key={chest._id} className="bg-white rounded-[40px] p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-5 rounded-[24px] transition-all duration-500 ${opening === chest._id && isShaking ? 'animate-shake bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <Package size={48} />
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">
                                        {chest.boxType}
                                    </span>
                                    <h3 className="text-2xl font-black text-gray-900 mt-2">{chest.title}</h3>
                                </div>
                            </div>

                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">{chest.description}</p>

                            <div className="bg-gray-50 rounded-[24px] p-5 mb-6 border border-gray-100">
                                <h4 className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                                    {isUnlocked ? <CheckCircle2 className="text-green-500" size={14} /> : <Lock size={12} />}
                                    {isUnlocked ? 'تم التحقق من المهمة' : 'المهمة التسويقية'}
                                </h4>
                                
                                <a 
                                    href={chest.requirements.followLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={() => handleLinkClick(chest._id)}
                                    className={`flex items-center justify-between p-4 rounded-2xl shadow-sm border transition-all active:scale-95 ${isUnlocked ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100 hover:border-primary'}`}
                                >
                                    <span className={`text-sm font-bold ${isUnlocked ? 'text-green-700' : 'text-gray-800'}`}>
                                        {isUnlocked ? 'تمت الزيارة بنجاح ✅' : 'تابع صفحة المعلن الآن'}
                                    </span>
                                    {isTimerRunning ? (
                                        <div className="flex items-center gap-1 text-primary font-black">
                                            <Timer size={18} className="animate-spin" />
                                            {verifying[chest._id]}s
                                        </div>
                                    ) : <ExternalLink size={20} className={isUnlocked ? 'text-green-500' : 'text-primary'} />}
                                </a>
                            </div>

                            <button 
                                onClick={() => handleOpenBox(chest._id)}
                                disabled={!isUnlocked || opening === chest._id}
                                className={`w-full py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${isUnlocked ? 'bg-gray-900 text-white hover:bg-black shadow-gray-300' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                            >
                                {opening === chest._id ? <Loader2 className="animate-spin" /> : (isUnlocked ? <Gift size={24} /> : <Lock size={24} />)}
                                {opening === chest._id ? 'يتم استخراج الكنز...' : (isUnlocked ? 'افتح الصندوق الآن' : 'أكمل المهمة أولاً')}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Modal الجائزة - كما هو */}
            {reward && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50 flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[50px] p-10 w-full max-w-sm text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: reward.color }}></div>
                        <div className="relative z-10 animate-in zoom-in-50 duration-500">
                            <div className="w-28 h-28 mx-auto mb-8 rounded-[35px] flex items-center justify-center shadow-2xl animate-bounce" style={{ backgroundColor: reward.color, color: '#fff' }}>
                                <Sparkles size={56} />
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 mb-2">أنت محظوظ!</h2>
                            <p className="text-gray-500 mb-8 font-medium">حصلت على <span className="font-black" style={{ color: reward.color }}>{reward.name}</span></p>
                            <div className="bg-gray-50 p-6 rounded-[30px] mb-8 border border-gray-100 text-4xl font-black text-gray-900">
                                {reward.points} <span className="text-sm text-primary">XP</span>
                            </div>
                            <button onClick={() => { setReward(null); setOpening(null); }} className="w-full bg-gray-900 text-white py-5 rounded-[24px] font-black shadow-xl hover:bg-black transition-all active:scale-95">استلم الجائزة 🚀</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TreasureChests;
