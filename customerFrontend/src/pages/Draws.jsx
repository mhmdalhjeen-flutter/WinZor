import React, { useState } from 'react';
import {
  Trophy, Users, Star, ChevronRight, Share2, Zap, Loader2, CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../context/AuthGateContext';
import { AUTH_GATE_MESSAGES } from '../utils/authGateMessages';
import { useVerificationGate } from '../context/VerificationGateContext';
import { useToast } from '../shared/Toast';
import { queryKeys } from '../lib/queryClient';
import { unwrapList } from '../utils/unwrapList';
import LightLoadingHint from '../shared/LightLoadingHint';

const RANK_LABELS = {
  bronze: 'برونزية',
  silver: 'فضية',
  gold: 'ذهبية',
  platinum: 'بلاتينية',
  all: 'الجميع',
};

const Draws = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { updateUser } = useAuth();
  const { runWithAuth } = useAuthGate();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const { toast } = useToast();
  const [joiningId, setJoiningId] = useState(null);

  const { data: draws = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['draws', 'open'],
    queryFn: async () => {
      const { data } = await api.get('/draws/open');
      return unwrapList(data, ['draws']);
    },
    staleTime: 30 * 1000,
  });

  const joinDraw = async (drawId) => {
    setJoiningId(drawId);
    try {
      const { data } = await api.post('/draws/join', { drawId, entriesToSpend: 1 });
      toast(data.message || 'تمت المشاركة في السحب', 'success');
      if (data.remainingWallet != null) {
        updateUser({ entriesWallet: data.remainingWallet });
      }
      qc.invalidateQueries({ queryKey: ['draws', 'open'] });
      qc.invalidateQueries({ queryKey: queryKeys.me });
    } catch (err) {
      if (handleApiVerificationError(err, () => joinDraw(drawId))) return;
      toast(err.response?.data?.message || 'تعذّر الانضمام للسحب', 'error');
    } finally {
      setJoiningId(null);
    }
  };

  const onJoinClick = (drawId) => runWithAuth(
    () => runWithVerification(() => joinDraw(drawId)),
    AUTH_GATE_MESSAGES.pointsDraw,
  );

  return (
    <div className="space-y-8 pb-10 text-right" dir="rtl">
      <section className="flex items-center gap-3 px-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-xl border border-gray-100 bg-white p-2 shadow-sm"
        >
          <ChevronRight size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 italic">فرصك الذهبية للربح</h1>
          <p className="text-xs font-bold text-gray-400">
            تصفّح السحوبات بحرية — الانضمام يتطلب توثيق الحساب
          </p>
        </div>
      </section>

      {isLoading && draws.length === 0 && (
        <LightLoadingHint label="جاري تحميل السحوبات..." />
      )}

      {!isLoading && !isError && draws.length === 0 && (
        <div className="mx-2 rounded-[28px] border border-gray-100 bg-white p-8 text-center">
          <Trophy size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="font-black text-gray-500">لا توجد سحوبات مفتوحة حالياً</p>
        </div>
      )}

      {isError && !isLoading && (
        <div className="mx-2 rounded-[28px] border border-red-100 bg-red-50 p-8 text-center">
          <p className="font-black text-red-600">تعذّر تحميل السحوبات</p>
          <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-black text-primary underline">
            إعادة المحاولة
          </button>
        </div>
      )}

      <section className="space-y-6">
        {draws.map((draw) => {
          const participants = draw.participants?.length || 0;
          const min = draw.minParticipants || 1;
          const progress = Math.min(100, Math.round((participants / min) * 100));
          const remaining = Math.max(0, min - participants);

          return (
            <motion.div
              key={draw._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="overflow-hidden rounded-[35px] border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
            >
              <div className="relative h-40 bg-gradient-to-br from-primary/20 to-purple-200">
                <div className="absolute inset-0 flex items-center justify-center text-6xl">🎁</div>
                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-gray-100 bg-white/90 px-3 py-1 shadow-sm backdrop-blur-md">
                  <Star size={12} className="fill-orange-500 text-orange-500" />
                  <span className="text-[10px] font-black text-gray-800">
                    رتبة {RANK_LABELS[draw.requiredRank] || draw.requiredRank || 'الجميع'}
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <h3 className="text-lg font-black text-gray-900">{draw.name}</h3>
                {draw.description && (
                  <p className="text-xs font-bold leading-relaxed text-gray-500">{draw.description}</p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black">
                    <span className="italic text-gray-400">
                      {remaining > 0 ? `باقي ${remaining} مشارك ليكتمل السحب` : 'اكتمل النصاب!'}
                    </span>
                    <div className="flex items-center gap-1 text-primary">
                      <Users size={12} />
                      <span>
                        {participants} / {min}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full border border-gray-100 bg-gray-50">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${progress}%` }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onJoinClick(draw._id)}
                    disabled={joiningId === draw._id}
                    className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-white shadow-lg shadow-primary/20 transition active:scale-95 disabled:opacity-60"
                  >
                    {joiningId === draw._id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        انضم للسحب الآن <Zap size={16} fill="white" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => toast('شارك رابط المنصة مع أصدقائك!', 'info')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-gray-100 py-4 text-sm font-black text-gray-500 transition active:scale-95"
                  >
                    <Share2 size={16} /> دعوة
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      <div className="mx-2 flex gap-4 rounded-[28px] border border-orange-100 bg-orange-50 p-5">
        <div className="h-fit rounded-2xl bg-orange-100 p-3 text-orange-600">
          <CheckCircle2 size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-orange-900">التصفح متاح — التفاعل يحتاج توثيق</h4>
          <p className="text-[10px] font-bold leading-relaxed text-orange-700">
            يمكنك مشاهدة السحوبات الآن. عند الضغط على «انضم» ستظهر نافذة توثيق سريعة مع مكافأة 5 نقاط.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Draws;
