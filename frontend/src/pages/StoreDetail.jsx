import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  MapPin, 
  Phone, 
  Users, 
  Flame, 
  Zap, 
  ChevronRight, 
  CheckCircle2,
  Share2,
  Info
} from 'lucide-react';
import axios from '../api/axios';

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowSuccess, setShowFollowSuccess] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await axios.get(`/stores/${id}`);
        setStoreData(response.data);
        setIsFollowing(response.data.isFollowing);
      } catch (err) {
        console.error("Error fetching store", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [id]);

  const handleFollow = async () => {
    try {
      const response = await axios.post(`/stores/${id}/follow`);
      setIsFollowing(response.data.isFollowing);
      if (response.data.isFollowing) {
        setShowFollowSuccess(true);
        setTimeout(() => setShowFollowSuccess(false), 4000);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-400">جاري تحميل المتجر...</div>;
  if (!storeData) return <div className="p-10 text-center font-bold text-red-500">المتجر غير موجود</div>;

  const { store, offers, products } = storeData;

  return (
    <div className="pb-24 -mt-4 animate-in fade-in duration-500 text-right font-almarai" dir="rtl">
      {/* غلاف المتجر */}
      <div className="relative h-48 w-full overflow-hidden">
        <img 
          src={store.coverImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000'} 
          className="w-full h-full object-cover" 
          alt="Cover" 
        />
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-xl text-white border border-white/20"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* معلومات المتجر الأساسية */}
      <div className="px-6 -mt-10 relative z-10">
        <div className="bg-white rounded-[35px] p-6 shadow-xl border border-gray-50 space-y-4">
          <div className="flex items-start justify-between">
            <div className="w-20 h-20 bg-white rounded-3xl p-1 shadow-lg -mt-16 border border-gray-100 overflow-hidden">
               <img src={store.logo || 'https://ui-avatars.com/api/?name=' + store.name} className="w-full h-full object-contain" alt="Logo" />
            </div>
            <div className="flex gap-2">
              <button className="bg-gray-100 p-2.5 rounded-xl text-gray-500"><Share2 size={18} /></button>
              <button className="bg-gray-100 p-2.5 rounded-xl text-gray-500"><Phone size={18} /></button>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-gray-900">{store.name}</h1>
            <div className="flex items-center gap-1 text-xs text-gray-400 font-bold">
              <MapPin size={14} className="text-primary" />
              <span>{store.region} • {store.subRegion}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            {store.description || "أهلاً بك في متجرنا على عروض تك. تابعنا لتصلك أحدث العروض والخصومات الحصرية لزبائننا المميزين."}
          </p>

          <div className="flex items-center gap-6 py-2 border-y border-gray-50">
            <div className="text-center flex-1">
              <p className="text-lg font-black text-gray-900">{store.customersCount || 0}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">الزبائن</p>
            </div>
            <div className="h-8 w-[1px] bg-gray-100"></div>
            <div className="text-center flex-1">
              <p className="text-lg font-black text-gray-900">{offers.length}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">العروض</p>
            </div>
          </div>

          {/* زر الانضمام الذكي */}
          <button 
            onClick={handleFollow}
            className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
              isFollowing 
              ? 'bg-gray-100 text-gray-500 shadow-none' 
              : 'bg-primary text-white shadow-primary/20 hover:scale-[1.02]'
            }`}
          >
            {isFollowing ? (
              <><CheckCircle2 size={20} /> أنت من زبائن المتجر</>
            ) : (
              <><Users size={20} /> انضم لزبائننا الآن</>
            )}
          </button>
        </div>
      </div>

      {/* تنبيه الطاقة - قاعدة الفعل الحقيقي */}
      <AnimatePresence>
        {!isFollowing && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-6 mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-start gap-3"
          >
            <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600">
               <Zap size={18} fill="currentColor" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-black text-yellow-800 underline">احصل على مكافأة الطاقة!</p>
              <p className="text-[10px] text-yellow-700 leading-tight font-bold">
                عند انضمامك للمتجر وإدخال <span className="font-black">أول كود حقيقي</span> منه، ستحصل فوراً على طاقة إضافية (يحددها الأدمن) لزيادة فرص فوزك!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* قسم العروض */}
      <section className="px-6 mt-8 space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="text-primary" size={20} />
          <h2 className="text-lg font-black text-gray-800">العروض المتوفرة</h2>
        </div>

        {offers.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl border border-gray-100 text-center space-y-2">
            <Info className="mx-auto text-gray-300" size={32} />
            <p className="text-xs text-gray-400 font-bold">لا يوجد عروض حالياً لهذا المتجر</p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div key={offer._id} className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm flex gap-4 overflow-hidden relative group active:scale-95 transition-all">
                <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                   <img src={offer.image || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <span className="bg-red-50 text-primary text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">خصم خاص</span>
                  <h3 className="font-black text-sm text-gray-800 leading-snug line-clamp-2">{offer.title}</h3>
                  <div className="flex items-center gap-1 text-primary pt-1 font-black text-[10px]">
                    <Zap size={12} fill="currentColor" />
                    <span>سارع بالاستفادة!</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* إشعار النجاح الطائر */}
      <AnimatePresence>
        {showFollowSuccess && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-6 right-6 z-50 bg-green-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-green-500"
          >
            <CheckCircle2 size={24} />
            <div>
              <p className="text-sm font-black">مبروك! أنت الآن زبون للمحل</p>
              <p className="text-[10px] opacity-90 font-bold">أدخل أول كود من المحل لتكسب مكافأة الطاقة فوراً.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoreDetail;
