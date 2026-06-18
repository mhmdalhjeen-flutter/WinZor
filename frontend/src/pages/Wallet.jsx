import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Sparkles, TrendingUp, ChevronRight, Zap } from 'lucide-react';

const Wallet = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // بيانات تجريبية للمستخدم
  const user = {
    points: 450,
    entries: 12,
    codesUsed: 8,
    rank: 'silver',
    nextRank: 'gold',
    progress: 80 // نسبة التقدم للرتبة التالية
  };

  const handleRedeem = (e) => {
    e.preventDefault();
    setLoading(true);
    // محاكاة عملية التحقق
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* بطاقة الرتبة والرصيد */}
      <section className="relative">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-[40px] p-8 shadow-2xl overflow-hidden border border-white/5">
          {/* تأثير ضوئي خلفي */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-rank-silver/20 rounded-full blur-[80px]"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-rank-silver rounded-3xl rotate-12 flex items-center justify-center shadow-lg shadow-rank-silver/20 mb-4"
            >
              <span className="text-gray-900 font-black text-3xl -rotate-12">S</span>
            </motion.div>
            
            <h2 className="text-white font-black text-2xl mb-1">المستوى الفضي</h2>
            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">Silver Member</p>

            <div className="grid grid-cols-2 gap-4 w-full mt-8">
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10">
                <p className="text-gray-500 text-[10px] font-bold mb-1">نقاط الخبرة</p>
                <p className="text-white text-xl font-black">{user.points} XP</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10">
                <p className="text-gray-500 text-[10px] font-bold mb-1">فرص السحب</p>
                <p className="text-primary-light text-xl font-black">{user.entries}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* شريط التقدم للرتبة التالية */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-sm font-black text-gray-900">طريقك للرتبة الذهبية</h3>
            <p className="text-xs text-gray-500 font-bold mt-1">بقي لك 2 كود فقط!</p>
          </div>
          <Sparkles className="text-rank-gold" size={20} />
        </div>
        
        <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden p-0.5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${user.progress}%` }}
            className="h-full bg-gradient-to-r from-rank-silver to-rank-gold rounded-full shadow-inner"
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-gray-400">
          <span>فضي</span>
          <span>ذهبي</span>
        </div>
      </section>

      {/* نموذج إدخال الكود */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Zap size={18} className="text-primary" fill="currentColor" />
          <h2 className="text-lg font-black text-gray-900">أدخل كود الفوز</h2>
        </div>

        <form onSubmit={handleRedeem} className="space-y-4">
          <div className="relative group">
            <Ticket className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={22} />
            <input 
              type="text" 
              placeholder="مثلاً: ABU-X2Y3Z"
              className="w-full bg-white border-2 border-gray-100 rounded-[25px] py-5 px-14 font-black text-lg focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-gray-300 uppercase tracking-widest text-center"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-5 rounded-[25px] shadow-xl shadow-primary/20 text-lg group overflow-hidden relative"
          >
            <span className={loading ? 'opacity-0' : 'flex items-center gap-2'}>
              تحقق من الكود <ChevronRight size={20} />
            </span>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
          </button>
        </form>
      </section>

      {/* سجل الأكواد الأخير */}
      <section className="space-y-4">
        <h3 className="text-sm font-black text-gray-400 px-2 uppercase tracking-wider">آخر الأكواد المستخدمة</h3>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-primary">
                  <Ticket size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 uppercase">OT-X92B1Z</p>
                  <p className="text-[10px] text-gray-500 font-bold">مطعم الطابون • أمس</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-600 text-xs font-black">+10 XP</p>
                <p className="text-primary text-[10px] font-black">+1 فرصة</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Wallet;
