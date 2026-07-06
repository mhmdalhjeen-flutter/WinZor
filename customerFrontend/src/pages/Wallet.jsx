import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle, 
  History, 
  ArrowUpRight, 
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sparkles,
  MapPin,
  ChevronLeft
} from 'lucide-react';

const Wallet = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRedeem = () => {
    if (!code) return;
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        setIsSuccess(false);
        navigate('/store/1'); 
      }, 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-10 relative overflow-hidden min-h-[80vh]">
      
      {/* 1. لوحة الرتبة واللؤلؤ */}
      <section className="bg-gradient-to-br from-[#1a1c1e] to-[#2d3135] rounded-[35px] p-8 text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="bg-blue-500/20 p-4 rounded-[24px] border border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
             <div className="w-8 h-8 bg-blue-400 rounded-full shadow-[0_0_15px_rgba(96,165,250,0.8)] border-2 border-white"></div>
          </div>
          <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 text-center">رتبة المحارب الذهبي</span>
          <h2 className="text-4xl font-black tabular-nums">1,250 <span className="text-sm text-gray-400">لؤلؤة</span></h2>
          
          <div className="w-full mt-6 space-y-2 px-2">
            <div className="flex justify-between text-[10px] font-black italic">
              <span className="text-gray-500 uppercase tracking-widest text-right">المستوى 12</span>
              <span className="text-blue-400 uppercase tracking-widest text-left">المستوى 13</span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                className="bg-gradient-to-l from-blue-400 to-blue-600 h-full rounded-full shadow-[0_0_10px_rgba(96,165,250,0.4)]"
              ></motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. حقل إدخال الكود */}
      <section className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6 text-center">
        <div className="space-y-1">
          <h3 className="font-black text-xl text-gray-900">أدخل كود الكنز 💎</h3>
          <p className="text-[11px] text-gray-400 font-bold">كل كود تدخله يزيد من رصيد نقاطق ويرفع رتبتك!</p>
        </div>
        
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="مثال: OT-778899"
            className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-[24px] py-5 px-6 text-center text-xl font-black tracking-widest transition-all outline-none placeholder:text-gray-300 uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button 
            onClick={handleRedeem}
            disabled={loading || !code}
            className="w-full bg-primary text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {loading ? "جاري تفعيل الكود..." : "تفعيل وشحن النقاط"}
          </button>
        </div>
      </section>

      {/* 3. البطاقة الذكية (نقلت هنا لتكون في مكانها الصحيح) */}
      <section 
        onClick={() => navigate('/personalization')}
        className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[30px] p-6 text-white flex items-center justify-between relative overflow-hidden shadow-xl cursor-pointer active:scale-[0.98] transition-all"
      >
        <div className="space-y-1 relative z-10">
           <h3 className="font-black text-sm">اكشف الجوئز المجاورة! 💎</h3>
           <p className="text-[10px] text-blue-100 font-bold max-w-[180px]">حدد منطقتك واهتماماتك لنعرض لك العروض الأقرب إليك فوراً.</p>
           <div className="flex items-center gap-1 text-[9px] font-black mt-2 bg-white/20 w-fit px-2 py-1 rounded-md">
              <Sparkles size={10} /> احصل على +5 نقاط هدية
           </div>
        </div>
        <MapPin size={40} className="text-white/20 absolute -left-2 -bottom-2" />
        <ChevronLeft size={20} className="relative z-10" />
      </section>

      {/* أنميشن النجاح */}
      <AnimatePresence>
        {isSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/10 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              className="bg-white p-10 rounded-[40px] shadow-2xl flex flex-col items-center gap-4 text-center border-4 border-primary/20"
            >
              <motion.div 
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-16 h-16 bg-blue-400 rounded-full shadow-[0_0_30px_rgba(96,165,250,0.8)] border-4 border-white mb-4"
              ></motion.div>
              <h2 className="text-2xl font-black text-gray-900">مبروك! رصيدك زاد نقطة ✨</h2>
              <p className="text-sm text-gray-500 font-bold">جاري توجيهك لصفحة المتجر...</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. سجل النشاط */}
      <section className="space-y-4 px-2">
        <h3 className="font-black text-lg text-gray-800 flex items-center gap-2 italic">
           <History size={20} className="text-gray-400" /> آخر النشاطات
        </h3>
        <div className="space-y-3">
           <div className="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-50 shadow-sm">
              <div className="flex items-center gap-3">
                 <div className="bg-blue-50 p-2.5 rounded-xl text-blue-500"><CheckCircle2 size={18} /></div>
                 <div>
                    <h4 className="font-bold text-sm text-gray-800">تفعيل كود</h4>
                    <p className="text-[10px] text-gray-400 font-bold">منذ ساعة</p>
                 </div>
              </div>
              <span className="text-sm font-black text-blue-500">+1 نقطة</span>
           </div>
        </div>
      </section>

    </div>
  );
};

export default Wallet;
