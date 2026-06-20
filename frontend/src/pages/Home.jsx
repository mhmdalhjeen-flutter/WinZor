import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Target, 
  Zap, 
  Trophy, 
  ArrowRight,
  Package,
  Gift
} from 'lucide-react';
import axios from '../api/axios';

const Home = () => {
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/embed/dQw4w9WgXcQ"); // رابط افتراضي
  const [loading, setLoading] = useState(true);

  // جلب إعدادات الفيديو من الأدمن مستقبلاً
  useEffect(() => {
    const fetchSettings = async () => {
       try {
         // const res = await axios.get('/api/settings/home-video');
         // setVideoUrl(res.data.url);
       } catch (err) {} finally { setLoading(false); }
    };
    fetchSettings();
  }, []);

  return (
    <div className="space-y-8 pb-24">
      {/* قسم الإدهاش - الفيديو */}
      <section className="relative rounded-[32px] overflow-hidden bg-black aspect-video shadow-2xl border-4 border-white">
        <iframe 
          className="w-full h-full"
          src={videoUrl}
          title="شرح عروض تك"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
        <div className="absolute top-4 right-4 bg-primary/90 text-white px-4 py-1 rounded-full text-xs font-bold animate-pulse">
          شاهد وتعلم كيف تربح! 🚀
        </div>
      </section>

      {/* مربعات الشرح الاحترافية */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
            <Zap size={24} />
          </div>
          <h3 className="font-bold text-gray-800">جمع الطاقة</h3>
          <p className="text-xs text-gray-500 leading-relaxed">تابع المتاجر وادعُ أصدقاءك لزيادة رصيد طاقتك اليومي.</p>
        </div>

        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Package size={24} />
          </div>
          <h3 className="font-bold text-gray-800">افتح الصناديق</h3>
          <p className="text-xs text-gray-500 leading-relaxed">استخدم طاقتك لفتح صناديق الكنز والحصول على بطاقات ملونة.</p>
        </div>

        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="h-10 w-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
            <Gift size={24} />
          </div>
          <h3 className="font-bold text-gray-800">جوائز حقيقية</h3>
          <p className="text-xs text-gray-500 leading-relaxed">حول بطاقاتك الملونة إلى نقاط XP أو خصومات مباشرة من المتاجر.</p>
        </div>

        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <Trophy size={24} />
          </div>
          <h3 className="font-bold text-gray-800">كن أسطورة</h3>
          <p className="text-xs text-gray-500 leading-relaxed">نافس للوصول إلى لوحة الشرف واربح جوائز شهرية كبرى.</p>
        </div>
      </section>

      {/* زر البدء السريع */}
      <button className="w-full bg-primary text-white py-5 rounded-[24px] font-bold text-lg shadow-lg shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-transform">
        ابدأ رحلة الربح الآن <ArrowRight size={20} />
      </button>
    </div>
  );
};

export default Home;
