import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, Sparkles, ExternalLink, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import HorizontalSwipe from '../components/ui/HorizontalSwipe';
import { queryKeys } from '../lib/queryClient';
import { unwrapList } from '../utils/unwrapList';
import LightLoadingHint from '../shared/LightLoadingHint';

const HonorBoard = () => {
  const { data: items = [], isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.honor,
    queryFn: async () => {
      const { data } = await api.get('/honor/active');
      return unwrapList(data, ['items']);
    },
    staleTime: 2 * 60 * 1000,
  });

  const primary = items.find((i) => i.isPrimary);
  const secondary = items.filter((i) => !i.isPrimary);

  const WinnerCard = ({ item, large = false }) => {
    const name = item.user?.name || 'فائز';
    const photo = item.winnerImage || item.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    const prizeImg = item.awardImage || item.prizeImage;
    const prize = item.prizeName || item.title;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-[28px] border border-yellow-200/30 bg-gradient-to-br from-[#1a1033] via-[#2d1b4e] to-[#0b1220] p-5 text-white shadow-xl ${large ? 'col-span-full' : ''}`}
      >
        {item.isPrimary && (
          <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
            <Crown size={12} /> فائز رئيسي
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <img src={photo} alt={name} loading="lazy" decoding="async" className={`rounded-2xl object-cover border-2 border-yellow-400/50 ${large ? 'w-24 h-24' : 'w-16 h-16'}`} />
          <div className="flex-1 text-center sm:text-right">
            <h3 className={`font-black ${large ? 'text-xl' : 'text-base'}`}>{name}</h3>
            <p className="text-yellow-200/90 text-sm font-bold mt-1">{prize}</p>
            <p className="text-white/60 text-xs mt-1 leading-relaxed">{item.message}</p>
            {item.receivedAt && (
              <p className="text-[10px] text-white/40 mt-2">
                🗓 {new Date(item.receivedAt).toLocaleDateString('ar')}
              </p>
            )}
            {item.competitionLink && (
              <a href={item.competitionLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-cyan-300 mt-2 font-bold">
                المسابقة <ExternalLink size={10} />
              </a>
            )}
          </div>
          {prizeImg && (
            <img src={prizeImg} alt={prize} loading="lazy" decoding="async" className="w-20 h-20 rounded-xl object-cover border border-white/20" />
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="pb-24 space-y-6 text-right" dir="rtl">
      <div className="text-center space-y-2 py-4">
        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3 }}>
          <Trophy className="mx-auto text-yellow-400 drop-shadow-lg" size={48} />
        </motion.div>
        <h1 className="text-2xl font-black text-gray-900">لوحة الشرف</h1>
        <p className="text-sm text-gray-500 font-bold max-w-sm mx-auto">
          🌟 كل فائز هنا قصة نجاح — وأنت قد تكون التالي!
        </p>
      </div>

      {isLoading && items.length === 0 && <LightLoadingHint label="جاري تحميل لوحة الشرف..." />}

      {!isLoading && !isError && items.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-b from-yellow-50 to-white rounded-3xl border border-yellow-100">
          <Star className="mx-auto text-yellow-300 mb-2" size={32} />
          <p className="font-black text-gray-600">لا فائزين حالياً</p>
          <p className="text-xs text-gray-400 mt-1">شارك في المسابقات وكن أول من يظهر هنا!</p>
        </div>
      )}

      {isError && !isLoading && (
        <div className="text-center py-12 space-y-3">
          <p className="font-black text-red-500">تعذّر تحميل لوحة الشرف</p>
          <button type="button" onClick={() => refetch()} className="text-sm font-black text-primary underline">
            إعادة المحاولة
          </button>
        </div>
      )}

      {!isLoading && primary && (
        <div className="space-y-2">
          <h2 className="text-sm font-black text-yellow-600 flex items-center gap-1">
            <Sparkles size={16} /> بطل الأسبوع
          </h2>
          <WinnerCard item={primary} large />
        </div>
      )}

      {!isLoading && secondary.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black text-gray-700">فائزون آخرون</h2>
          <HorizontalSwipe spaceBetween={12}>
            {secondary.map((item) => (
              <div key={item._id} className="w-[min(88vw,320px)] shrink-0">
                <WinnerCard item={item} />
              </div>
            ))}
          </HorizontalSwipe>
        </div>
      )}

      <p className="text-center text-xs text-primary font-black italic pt-4">
        « النجاح ليس صدفة — إنه قرار » 💪
      </p>
    </div>
  );
};

export default HonorBoard;
