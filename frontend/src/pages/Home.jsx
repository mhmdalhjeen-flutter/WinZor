import React from 'react';
import { Trophy, Flame, Zap, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  // بيانات تجريبية للعرض البصري
  const topUsers = [
    { name: 'أحمد محمد', codes: 125, rank: 'platinum' },
    { name: 'سارة خالد', codes: 88, rank: 'gold' },
    { name: 'محمد علي', codes: 45, rank: 'silver' },
  ];

  const categories = [
    { name: 'مطاعم', icon: '🍔', color: 'bg-orange-100 text-orange-600' },
    { name: 'ملابس', icon: '👗', color: 'bg-purple-100 text-purple-600' },
    { name: 'صيدلية', icon: '💊', color: 'bg-blue-100 text-blue-600' },
    { name: 'إلكترونيات', icon: '📱', color: 'bg-red-100 text-red-600' },
    { name: 'سوبر ماركت', icon: '🛒', color: 'bg-green-100 text-green-600' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* قسم لوحة الشرف - Podium */}
      <section className="relative pt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Trophy className="text-rank-gold" size={24} />
            لوحة الشرف اليومية
          </h2>
          <button className="text-primary text-xs font-bold flex items-center">
            عرض الكل <ChevronLeft size={14} />
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 shadow-premium overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <div className="flex justify-around items-end pt-4 h-40">
            {/* المركز الثاني */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full border-2 border-rank-silver overflow-hidden bg-gray-700 p-1">
                <img src={`https://ui-avatars.com/api/?name=${topUsers[1].name}&background=random`} alt="" className="rounded-full w-full h-full" />
              </div>
              <div className="bg-rank-silver h-16 w-12 rounded-t-xl flex items-center justify-center font-black text-gray-800 text-xl shadow-lg">2</div>
              <p className="text-[10px] text-white font-bold truncate w-16 text-center">{topUsers[1].name}</p>
            </div>

            {/* المركز الأول */}
            <div className="flex flex-col items-center gap-2">
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 rounded-full border-4 border-rank-gold overflow-hidden bg-gray-700 p-1 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
              >
                <img src={`https://ui-avatars.com/api/?name=${topUsers[0].name}&background=random`} alt="" className="rounded-full w-full h-full" />
              </motion.div>
              <div className="bg-rank-gold h-24 w-16 rounded-t-xl flex items-center justify-center font-black text-gray-900 text-3xl shadow-[0_-10px_30px_rgba(255,215,0,0.2)]">1</div>
              <p className="text-xs text-white font-black truncate w-20 text-center">{topUsers[0].name}</p>
            </div>

            {/* المركز الثالث */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full border-2 border-rank-bronze overflow-hidden bg-gray-700 p-1">
                <img src={`https://ui-avatars.com/api/?name=${topUsers[2].name}&background=random`} alt="" className="rounded-full w-full h-full" />
              </div>
              <div className="bg-rank-bronze h-12 w-12 rounded-t-xl flex items-center justify-center font-black text-gray-800 text-lg shadow-lg">3</div>
              <p className="text-[10px] text-white font-bold truncate w-16 text-center">{topUsers[2].name}</p>
            </div>
          </div>
        </div>
      </section>

      {/* شريط التصنيفات السريع */}
      <section>
        <h2 className="text-lg font-black mb-4">اكتشف العروض</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {categories.map((cat, i) => (
            <button key={i} className="flex flex-col items-center gap-2 min-w-fit">
              <div className={`${cat.color} w-16 h-16 rounded-3xl flex items-center justify-center text-2xl shadow-sm border border-white/50 active:scale-90 transition-transform`}>
                {cat.icon}
              </div>
              <span className="text-[11px] font-bold text-gray-600">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* قسم العروض الساخنة */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="bg-red-100 p-1.5 rounded-lg">
            <Flame className="text-primary" size={18} />
          </div>
          <h2 className="text-lg font-black">عروض تشتعل الآن</h2>
        </div>

        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div key={item} className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm relative overflow-hidden active:scale-[0.98] transition-transform">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-2xl overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center text-gray-400">
                    صورة
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">خصم 50%</span>
                  <h3 className="font-black text-gray-900 leading-tight">بيتزا كبيرة + لتر كولا بـ 35 شيكل فقط</h3>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 font-bold">
                    <span>مطعم الطابون</span>
                    <span className="text-gray-300">•</span>
                    <span>الشمال</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary pt-1 font-black text-xs">
                    <Zap size={14} fill="currentColor" />
                    <span>ينتهي خلال 3 ساعات</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
