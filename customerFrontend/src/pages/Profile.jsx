import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  User, Share2, Copy, Check, LogOut, Camera, X, 
  Gift, Star, ShieldCheck, ChevronLeft
} from 'lucide-react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [copied, setCopied] = useState(false);

  const defaultAvatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Bubba",
    "https://api.dicebear.com/7.x/bottts/svg?seed=TechBot",
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user?.referralCode || "OT-12345");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-24 text-right" dir="rtl">
      
      {/* رأس البروفايل */}
      <div className="flex flex-col items-center pt-4 space-y-4">
        <div className="relative group">
          <div className="w-28 h-28 rounded-[35px] bg-gradient-to-tr from-primary to-purple-600 p-1 shadow-2xl relative">
            <div className="w-full h-full bg-white rounded-[32px] p-1 overflow-hidden">
              <img 
                src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"} 
                alt="Avatar" 
                className="w-full h-full rounded-[28px] object-cover" 
              />
            </div>
            <button 
              onClick={() => setShowAvatarPicker(true)}
              className="absolute -bottom-1 -right-1 bg-white text-primary p-2 rounded-2xl shadow-lg border border-gray-100 hover:scale-110 transition-transform"
            >
              <Camera size={16} />
            </button>
          </div>
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900">{user?.name || 'مستخدم جديد'}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
             <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase italic">
               رتبة {user?.rank || 'برونزية'}
             </span>
          </div>
        </div>
      </div>

      {/* إحصائيات اللؤلؤ والجوائز */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-[28px] shadow-sm text-center border border-gray-100">
          <div className="w-6 h-6 bg-blue-400 rounded-full mx-auto mb-1 shadow-[0_0_10px_rgba(96,165,250,0.6)] border-2 border-white"></div>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">نقاط</p>
          <p className="text-lg font-black text-gray-800">{user?.pearls || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-[28px] shadow-sm text-center border border-gray-100">
          <Star size={20} className="mx-auto mb-1 text-yellow-500" fill="currentColor" />
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">الأكواد</p>
          <p className="text-lg font-black text-gray-800">{user?.codesUsed || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-[28px] shadow-sm text-center border border-gray-100">
          <Gift size={20} className="mx-auto mb-1 text-red-500" fill="currentColor" />
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">الجوائز</p>
          <p className="text-lg font-black text-gray-800">{user?.prizesCount || 0}</p>
        </div>
      </div>

      {/* كود الإحالة (دعوة صديق) */}
      <section className="bg-[#1a1c1e] rounded-[32px] p-6 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-sm flex items-center gap-2 italic">
               <Share2 size={18} className="text-primary" /> شارك الجوائز مع أصدقائك
            </h3>
            <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">+10 نقطة</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <span className="font-mono font-black text-xl text-primary tracking-widest">{user?.referralCode || 'OT-12345'}</span>
            <button onClick={handleCopyCode} className="bg-white/10 p-2 rounded-xl">
              {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
            </button>
          </div>
        </div>
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
      </section>

      {/* الخيارات الأخرى */}
      <div className="space-y-3">
        <button className="w-full bg-white p-5 rounded-[24px] border border-gray-100 flex items-center justify-between font-bold text-gray-700 active:scale-95 transition-all">
          <div className="flex items-center gap-3">
             <div className="bg-blue-50 p-2 rounded-xl text-blue-500"><ShieldCheck size={20} /></div>
             <span>الأمان والخصوصية</span>
          </div>
          <ChevronLeft size={18} className="text-gray-300" />
        </button>

        <button 
          onClick={handleLogout}
          className="w-full bg-red-50 p-5 rounded-[24px] border border-red-100 flex items-center justify-center gap-2 font-black text-red-600 active:scale-95 transition-all"
        >
          <LogOut size={20} /> تسجيل الخروج
        </button>
      </div>

    </div>
  );
};

export default Profile;
