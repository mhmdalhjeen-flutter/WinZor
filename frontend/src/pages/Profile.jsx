import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Settings, 
  ShieldCheck, 
  Award, 
  History, 
  Gift, 
  ChevronLeft,
  LogOut,
  Star
} from 'lucide-react';

const Profile = () => {
  // بيانات تجريبية للمستخدم
  const user = {
    name: 'أحمد محمد',
    email: 'ahmed@example.com',
    rank: 'silver', // bronze, silver, gold, platinum
    totalCodes: 25,
    prizesWon: 3,
    joinedDate: 'أكتوبر 2023'
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 'platinum': return 'from-slate-300 via-platinum to-slate-400 text-slate-900 shadow-platinum/30';
      case 'gold': return 'from-yellow-400 via-rank-gold to-yellow-600 text-gray-900 shadow-rank-gold/30';
      case 'silver': return 'from-gray-300 via-rank-silver to-gray-500 text-gray-800 shadow-rank-silver/30';
      default: return 'from-orange-400 to-rank-bronze text-white shadow-rank-bronze/30';
    }
  };

  const rankLabels = {
    platinum: 'العضوية البلاتينية',
    gold: 'العضوية الذهبية',
    silver: 'العضوية الفضية',
    bronze: 'العضوية البرونزية'
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-right-4 duration-700 text-right" dir="rtl">
      {/* رأس الملف الشخصي */}
      <div className="flex flex-col items-center pt-6 space-y-4">
        <div className="relative">
          <div className={`w-28 h-28 rounded-[40px] bg-gradient-to-tr ${getRankStyle(user.rank)} p-1 shadow-2xl`}>
            <div className="w-full h-full bg-white rounded-[38px] p-1 overflow-hidden">
              <img 
                src={`https://ui-avatars.com/api/?name=${user.name}&background=random&size=128`} 
                alt="Avatar" 
                className="w-full h-full rounded-[35px] object-cover"
              />
            </div>
          </div>
          <div className={`absolute -bottom-2 -left-2 p-2 rounded-2xl bg-gradient-to-br ${getRankStyle(user.rank)} shadow-lg`}>
            <ShieldCheck size={20} />
          </div>
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900">{user.name}</h1>
          <p className="text-sm text-gray-400 font-bold">{user.email}</p>
        </div>
      </div>

      {/* بطاقة الرتبة الحالية */}
      <section className={`bg-gradient-to-r ${getRankStyle(user.rank)} rounded-[35px] p-6 shadow-xl relative overflow-hidden active:scale-95 transition-transform`}>
        <div className="absolute top-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mt-12 blur-2xl"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-70">رتبتك الحالية</h3>
            <p className="text-xl font-black">{rankLabels[user.rank]}</p>
          </div>
          <Award size={40} className="opacity-80" />
        </div>
      </section>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[30px] border border-gray-100 shadow-sm text-center space-y-1">
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Star size={20} fill="currentColor" />
          </div>
          <p className="text-xs text-gray-400 font-bold">إجمالي الأكواد</p>
          <p className="text-xl font-black text-gray-900">{user.totalCodes}</p>
        </div>
        <div className="bg-white p-5 rounded-[30px] border border-gray-100 shadow-sm text-center space-y-1">
          <div className="w-10 h-10 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Gift size={20} fill="currentColor" />
          </div>
          <p className="text-xs text-gray-400 font-bold">هدايا فزت بها</p>
          <p className="text-xl font-black text-gray-900">{user.prizesWon}</p>
        </div>
      </div>

      {/* قائمة الخيارات */}
      <section className="bg-white rounded-[35px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          <button className="w-full p-5 flex justify-between items-center hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <History size={20} />
              </div>
              <span className="font-black text-gray-700 text-sm">سجل السحوبات السابقة</span>
            </div>
            <ChevronLeft size={18} className="text-gray-300" />
          </button>

          <button className="w-full p-5 flex justify-between items-center hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Settings size={20} />
              </div>
              <span className="font-black text-gray-700 text-sm">إعدادات الحساب</span>
            </div>
            <ChevronLeft size={18} className="text-gray-300" />
          </button>

          <button className="w-full p-5 flex justify-between items-center hover:bg-red-50 transition-colors group">
            <div className="flex items-center gap-4 text-red-500">
              <div className="p-3 bg-red-50 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-colors">
                <LogOut size={20} />
              </div>
              <span className="font-black text-sm">تسجيل الخروج</span>
            </div>
          </button>
        </div>
      </section>

      <p className="text-center text-[10px] text-gray-300 font-bold">عضو منذ {user.joinedDate} • نسخة v1.0</p>
    </div>
  );
};

export default Profile;
