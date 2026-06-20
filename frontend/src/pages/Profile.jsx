import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Settings, ShieldCheck, Zap, Share2, Copy, Check, 
  LogOut, Camera, X, Award, Gift, Star
} from 'lucide-react';
import axios from '../api/axios';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);

  // قائمة الأيقونات الافتراضية المقترحة للزبون
  const defaultAvatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Bubba",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
    "https://api.dicebear.com/7.x/bottts/svg?seed=TechBot",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Hero",
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/users/me');
      setUser(res.data);
    } catch (err) {
      console.error("خطأ في جلب الملف الشخصي", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAvatar = async (newAvatar) => {
    setUpdating(true);
    try {
      const res = await axios.patch('/users/update-profile', { avatar: newAvatar });
      setUser(res.data.user);
      setShowAvatarPicker(false);
    } catch (err) {
      alert("فشل تحديث الصورة");
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user?.referralCode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 'platinum': return 'from-indigo-400 via-purple-500 to-indigo-600';
      case 'gold': return 'from-yellow-400 via-yellow-500 to-yellow-600';
      case 'silver': return 'from-gray-300 via-gray-400 to-gray-500';
      default: return 'from-orange-400 to-orange-600';
    }
  };

  if (loading) return <div className="p-10 text-center font-black">جاري تحميل بروفايلك...</div>;

  return (
    <div className="space-y-6 pb-24 text-right bg-gray-50 min-h-screen px-4 font-['Cairo']" dir="rtl">
      
      {/* رأس الملف الشخصي مع زر تعديل الأيقونة */}
      <div className="flex flex-col items-center pt-8 space-y-3">
        <div className="relative group">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className={`w-28 h-28 rounded-[35px] bg-gradient-to-tr ${getRankStyle(user?.rank)} p-1 shadow-2xl relative`}
          >
            <div className="w-full h-full bg-white rounded-[32px] p-1 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-[28px] object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                   <User size={48} />
                </div>
              )}
            </div>
            {/* زر تعديل الصورة */}
            <button 
              onClick={() => setShowAvatarPicker(true)}
              className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-2xl shadow-lg border-4 border-gray-50 hover:scale-110 transition-transform"
            >
              <Camera size={18} />
            </button>
          </motion.div>
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900">{user?.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={`text-[10px] font-black px-3 py-1 rounded-full text-white bg-gradient-to-r ${getRankStyle(user?.rank)}`}>
              رتبة {user?.rank?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* بطاقة كود الإحالة */}
      <section className="bg-white rounded-[30px] p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
            <Share2 size={18} className="text-primary" /> كود الإحالة الخاص بك
          </h3>
          <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg">اكسب 10 طاقة</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-4 flex items-center justify-between">
            <span className="font-mono font-black text-xl text-primary tracking-widest">{user?.referralCode}</span>
            <button onClick={handleCopyCode} className="text-gray-400">
              {copied ? <Check size={22} className="text-green-500" /> : <Copy size={22} />}
            </button>
          </div>
        </div>
      </section>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-[30px] shadow-sm text-center border border-gray-100">
          <Zap size={20} className="mx-auto mb-1 text-yellow-500" fill="currentColor" />
          <p className="text-[10px] text-gray-400 font-bold">الطاقة</p>
          <p className="text-lg font-black">{user?.energy || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-[30px] shadow-sm text-center border border-gray-100">
          <Star size={20} className="mx-auto mb-1 text-blue-500" fill="currentColor" />
          <p className="text-[10px] text-gray-400 font-bold">الأكواد</p>
          <p className="text-lg font-black">{user?.codesUsed || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-[30px] shadow-sm text-center border border-gray-100">
          <Gift size={20} className="mx-auto mb-1 text-red-500" fill="currentColor" />
          <p className="text-[10px] text-gray-400 font-bold">الجوائز</p>
          <p className="text-lg font-black">{user?.entriesWallet || 0}</p>
        </div>
      </div>

      {/* منتقي الأيقونات (Modal) */}
      <AnimatePresence>
        {showAvatarPicker && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end justify-center">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full rounded-t-[40px] p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-gray-800">اختر أيقونتك الأسطورية</h2>
                <button onClick={() => setShowAvatarPicker(false)} className="bg-gray-100 p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {defaultAvatars.map((avatar, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleUpdateAvatar(avatar)}
                    disabled={updating}
                    className="p-1 border-4 border-transparent hover:border-primary rounded-[30px] transition-all overflow-hidden"
                  >
                    <img src={avatar} alt="option" className="w-full h-full object-cover bg-gray-50" />
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400">أو ضع رابط صورة خارجية:</p>
                <input 
                  type="text" 
                  placeholder="رابط الصورة https://..."
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm outline-none focus:ring-2 focus:ring-primary"
                  onBlur={(e) => e.target.value && handleUpdateAvatar(e.target.value)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <button className="w-full py-4 bg-white text-red-500 font-black rounded-[25px] flex items-center justify-center gap-2 shadow-sm border border-red-50">
        <LogOut size={20} /> تسجيل الخروج
      </button>

    </div>
  );
};

export default Profile;
