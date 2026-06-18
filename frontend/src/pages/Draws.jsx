import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, MapPin, Users, ChevronRight, CheckCircle2, Timer } from 'lucide-react';

const Draws = () => {
  const [selectedDraw, setSelectedDraw] = useState(null);

  // بيانات تجريبية للسحوبات المفتوحة
  const activeDraws = [
    {
      id: '1',
      name: 'سحب مهرجان الشتاء الأكبر',
      prizes: 'ثلاجة شارب + 5 كوبونات تسوق',
      drawDate: '30 ديسمبر',
      minParticipants: 500,
      currentParticipants: 380,
      requiredRank: 'silver',
      status: 'voting',
      locationOptions: [
        { name: 'الرمال - ساحة الجندي', votes: 120 },
        { name: 'الشمال - نادي جباليا', votes: 85 }
      ]
    },
    {
      id: '2',
      name: 'سحب الجمعة البيضاء الخفيف',
      prizes: 'طقم عطور فاخر + قسيمة شرائية',
      drawDate: '25 نوفمبر',
      minParticipants: 100,
      currentParticipants: 95,
      requiredRank: 'all',
      status: 'open',
      locationOptions: []
    }
  ];

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-left-4 duration-700 text-right" dir="rtl">
      <div className="px-2">
        <h1 className="text-2xl font-black text-gray-900">ساحة السحوبات 🎡</h1>
        <p className="text-sm text-gray-500 font-bold mt-1">شارك بفرصك وصوّت لمكان السحب المفضل لديك</p>
      </div>

      <div className="space-y-6">
        {activeDraws.map((draw) => (
          <div key={draw.id} className="bg-white rounded-[35px] border border-gray-100 shadow-sm overflow-hidden relative active:scale-[0.98] transition-transform">
            {/* شارة الرتبة المطلوبة */}
            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              draw.requiredRank === 'silver' ? 'bg-rank-silver/20 text-gray-600' : 'bg-green-100 text-green-600'
            }`}>
              {draw.requiredRank === 'silver' ? 'للرتبة الفضية فأعلى' : 'متاح للجميع'}
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <Trophy size={32} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-gray-900 leading-tight">{draw.name}</h2>
                  <p className="text-xs text-gray-500 font-bold">{draw.prizes}</p>
                </div>
              </div>

              {/* شريط النصاب (المشاركين) */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-primary">بقي {draw.minParticipants - draw.currentParticipants} مشارك ليبدأ السحب!</span>
                  <span className="text-gray-400">{draw.currentParticipants} / {draw.minParticipants}</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(draw.currentParticipants / draw.minParticipants) * 100}%` }}
                    className="h-full bg-primary rounded-full shadow-lg shadow-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="flex items-center gap-2 text-gray-500">
                  <Timer size={16} className="text-primary" />
                  <span className="text-xs font-bold">{draw.drawDate}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Users size={16} className="text-primary" />
                  <span className="text-xs font-bold">{draw.currentParticipants} مشارك</span>
                </div>
              </div>

              {/* قسم التصويت إذا كان متاحاً */}
              {draw.status === 'voting' && (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <h3 className="text-xs font-black text-gray-400 mb-3 flex items-center gap-1 uppercase tracking-wider">
                    <MapPin size={14} /> صوّت لمكان السحب
                  </h3>
                  <div className="space-y-2">
                    {draw.locationOptions.map((loc, i) => (
                      <button key={i} className="w-full bg-white border border-gray-200 p-3 rounded-xl flex justify-between items-center hover:border-primary transition-colors active:scale-95 group">
                        <span className="text-xs font-black text-gray-700">{loc.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-bold">{loc.votes} صوت</span>
                          <div className="w-4 h-4 rounded-full border-2 border-gray-200 group-focus:border-primary group-focus:bg-primary/10"></div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button className="w-full btn-primary py-4 rounded-2xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2">
                دخول السحب الآن <ChevronRight size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* قسم الجوائز الفائزة (سجل الشرف المصغر) */}
      <section className="bg-gradient-to-br from-primary to-primary-dark rounded-[40px] p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10 space-y-4 text-center">
          <div className="inline-flex p-3 bg-white/20 rounded-2xl backdrop-blur-md mb-2">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-xl font-black italic">لوحة شرف الفائزين</h2>
          <p className="text-xs font-bold opacity-80 leading-relaxed">أحمد محمد فاز للتو بكوبون بقيمة 50 شيكل من سوبر ماركت غزة!</p>
          <button className="bg-white text-primary px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-primary-dark/50 active:scale-95 transition-transform">
            شاهد كل الفائزين
          </button>
        </div>
      </section>
    </div>
  );
};

export default Draws;
