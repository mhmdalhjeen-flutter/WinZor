import React, { useState } from 'react';
import { ChevronRight, Gift, Sparkles, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useVerificationGate } from '../context/VerificationGateContext';
import { useToast } from '../shared/Toast';
import { unwrapList } from '../utils/unwrapList';
import LightLoadingHint from '../shared/LightLoadingHint';

const BOX_STYLES = [
  { color: 'from-amber-700 to-amber-900', icon: '📦' },
  { color: 'from-slate-400 to-slate-600', icon: '🥈' },
  { color: 'from-yellow-400 to-orange-600', icon: '🏆' },
];

const TreasureChests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const { toast } = useToast();
  const [openingId, setOpeningId] = useState(null);

  const { data: boxes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['treasure', 'available'],
    queryFn: async () => {
      const { data } = await api.get('/treasure/available');
      return unwrapList(data, ['data', 'boxes']);
    },
    staleTime: 30 * 1000,
  });

  const openBox = async (boxId) => {
    setOpeningId(boxId);
    try {
      const { data } = await api.post(`/treasure/open/${boxId}`);
      toast(data.message || 'مبروك! فتحت الصندوق', 'success');
      refetch();
    } catch (err) {
      if (handleApiVerificationError(err, () => openBox(boxId))) return;
      toast(err.response?.data?.message || 'تعذّر فتح الصندوق', 'error');
    } finally {
      setOpeningId(null);
    }
  };

  const onOpenClick = (boxId) => runWithVerification(() => openBox(boxId));

  return (
    <div className="space-y-8 pb-10 text-right" dir="rtl">
      <section className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-gray-100 bg-white p-2 shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-800">صناديق الجوائز</h1>
            <p className="text-[10px] font-bold text-gray-400">تصفّح الصناديق — الفتح يتطلب توثيق</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2">
          <Sparkles size={16} className="fill-primary text-primary" />
          <span className="text-sm font-black text-primary">{user?.energy ?? 0} طاقة</span>
        </div>
      </section>

      {isLoading && boxes.length === 0 && (
        <LightLoadingHint label="جاري تحميل الصناديق..." />
      )}

      {!isLoading && !isError && boxes.length === 0 && (
        <div className="mx-2 rounded-[28px] border border-gray-100 bg-white p-8 text-center">
          <Gift size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="font-black text-gray-500">لا توجد صناديق متاحة حالياً</p>
        </div>
      )}

      {isError && !isLoading && (
        <div className="mx-2 rounded-[28px] border border-red-100 bg-red-50 p-8 text-center">
          <p className="font-black text-red-600">تعذّر تحميل الصناديق</p>
          <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-black text-primary underline">
            إعادة المحاولة
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 px-2">
        {boxes.map((box, index) => {
          const style = BOX_STYLES[index % BOX_STYLES.length];
          return (
            <motion.div
              key={box._id}
              whileHover={{ scale: 1.01 }}
              className="group relative overflow-hidden transition-all active:scale-[0.99]"
            >
              <div className={`relative z-10 rounded-[32px] bg-gradient-to-br ${style.color} p-6 text-white shadow-xl`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black">{box.title}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                      {box.boxType === 'daily' ? 'صندوق يومي' : 'صندوق ترويجي'}
                    </p>
                    {box.description && (
                      <p className="text-xs font-bold text-white/90">{box.description}</p>
                    )}
                    {box.store?.name && (
                      <p className="text-[10px] font-bold text-white/60">برعاية {box.store.name}</p>
                    )}
                  </div>
                  <span className="text-5xl drop-shadow-lg">{style.icon}</span>
                </div>

                <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-xs font-black">
                    <Trophy size={16} className="text-yellow-300" />
                    {box.costInEnergy > 0 ? `${box.costInEnergy} طاقة لفتحه` : 'مجاني — مرة يومياً'}
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenClick(box._id)}
                    disabled={openingId === box._id}
                    className="rounded-xl bg-white px-6 py-2 text-xs font-black text-gray-900 shadow-lg disabled:opacity-60"
                  >
                    {openingId === box._id ? '...' : 'افتح الآن'}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <section className="mx-2 flex gap-4 rounded-[24px] border border-blue-100 bg-blue-50 p-6">
        <div className="h-fit rounded-2xl bg-blue-100 p-3 text-blue-600">
          <Gift size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-blue-900">كيف تعمل الصناديق؟</h4>
          <p className="text-[11px] font-bold leading-relaxed text-blue-700">
            يمكنك مشاهدة الصناديق بدون توثيق. عند محاولة الفتح ستُطلب منك خطوة توثيق سريعة — وتحصل على 5 نقاط
            هدية بعد النجاح.
          </p>
        </div>
      </section>
    </div>
  );
};

export default TreasureChests;
