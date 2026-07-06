import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Medal, Users, Clock, Loader2, X, Trophy, MapPin, Coins, CheckCircle2, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useVerificationGate } from '../context/VerificationGateContext';
import { useCompetitionsList } from '../hooks/useCompetitionsList';
import { queryKeys } from '../lib/queryClient';

const timeLeft = (endDate) => {
  if (!endDate) return '—';
  const diff = new Date(endDate) - Date.now();
  if (diff <= 0) return 'انتهت';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  return d > 0 ? `${d} يوم ${h} س` : `${h} ساعة`;
};

const CompetitionModal = ({ competition, userPoints, onClose, onJoined }) => {
  const [entries, setEntries] = useState(1);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { updateUser } = useAuth();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const qc = useQueryClient();

  if (!competition) return null;

  const joined = competition.joined || competition.hasJoined;
  const ended = competition.hasEnded || (competition.endDate && new Date(competition.endDate) <= Date.now());
  const eligible = userPoints >= (competition.minPoints || 0);
  const maxEntries = Math.max(0, Math.floor(userPoints / (competition.pointsPerEntry || 1)));
  const cost = entries * (competition.pointsPerEntry || 1);

  const handleJoin = async () => {
    setJoining(true);
    setError('');
    try {
      const { data } = await api.post(`/competitions/${competition._id}/join`, { entries });
      setSuccess(true);
      if (data.userPoints != null) updateUser({ points: data.userPoints });
      qc.invalidateQueries({ queryKey: queryKeys.competitionsList });
      qc.invalidateQueries({ queryKey: queryKeys.me });
      onJoined?.(data.competition);
    } catch (err) {
      if (handleApiVerificationError(err, handleJoin)) return;
      setError(err.response?.data?.message || 'تعذّر الانضمام');
    } finally {
      setJoining(false);
    }
  };

  const onJoinClick = () => runWithVerification(handleJoin);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="relative aspect-[16/10] bg-gradient-to-br from-purple-600 to-indigo-800">
          {competition.image ? (
            <img src={competition.image} alt="" className="w-full h-full object-cover mix-blend-overlay opacity-80" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-40">🏆</div>
          )}
          <button type="button" onClick={onClose} className="absolute top-4 left-4 bg-black/30 p-2 rounded-full text-white"><X size={20} /></button>
          {joined && (
            <span className="absolute top-4 right-4 bg-green-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 size={14} /> تم الانضمام
            </span>
          )}
        </div>
        <div className="p-5 space-y-4 text-right">
          <h2 className="text-xl font-black text-gray-900">{competition.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{competition.description}</p>
          <div className="flex flex-wrap gap-2 text-[11px] font-bold text-gray-500">
            <span className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1"><Coins size={12} /> {competition.minPoints}+ نقطة</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1"><Users size={12} /> {competition.participantsCount ?? 0}</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1"><Clock size={12} /> {timeLeft(competition.endDate)}</span>
            {competition.location && <span className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1"><MapPin size={12} /> {competition.location}</span>}
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700 font-bold text-center space-y-3">
              <p>تمت إضافة {entries} مشاركة بنجاح!</p>
              <button
                type="button"
                onClick={() => { setSuccess(false); setEntries(1); }}
                className="text-sm text-green-800 underline font-black"
              >
                إضافة مشاركات أخرى
              </button>
            </div>
          ) : ended ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 font-bold text-center">
              انتهت هذه المسابقة
            </div>
          ) : (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              {joined && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-green-700 text-xs font-bold">
                  أنت مشارك — لديك {competition.myEntries || 0} مشاركة. يمكنك شراء المزيد.
                </div>
              )}
              <p className="text-sm font-bold">نقاطك: <span className="text-primary">{userPoints}</span></p>
              {!eligible && <p className="text-xs text-amber-600 font-bold">تحتاج {competition.minPoints} نقطة على الأقل</p>}
              {eligible && (
                <>
                  <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-3">
                    <span className="text-sm font-bold">{joined ? 'مشاركات إضافية' : 'عدد المشاركات'}</span>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setEntries((n) => Math.max(1, n - 1))} className="w-8 h-8 rounded-full bg-white border flex items-center justify-center"><Minus size={14} /></button>
                      <span className="font-black w-6 text-center">{entries}</span>
                      <button type="button" onClick={() => setEntries((n) => Math.min(maxEntries, n + 1))} className="w-8 h-8 rounded-full bg-white border flex items-center justify-center"><Plus size={14} /></button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">التكلفة: {cost} نقطة</p>
                </>
              )}
              {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
              <button type="button" disabled={!eligible || joining} onClick={onJoinClick} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-black disabled:opacity-50 flex items-center justify-center gap-2">
                {joining ? <Loader2 className="animate-spin" size={20} /> : <Trophy size={18} />}
                {joined ? 'شراء مشاركات إضافية' : 'انضم الآن'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const Competitions = () => {
  const [selected, setSelected] = useState(null);
  const { user } = useAuth();
  const { data: list = [], isLoading, isError, refetch } = useCompetitionsList();
  const userPoints = user?.points ?? 0;

  return (
    <div className="pb-24 space-y-5 text-right" dir="rtl">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-purple-700 via-indigo-700 to-violet-900 p-6 text-white">
        <div className="absolute -left-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <h1 className="text-2xl font-black flex items-center gap-2 relative z-10">
          <Medal size={28} className="text-yellow-300" /> صندوق المسابقات
        </h1>
        <p className="text-sm text-white/80 font-bold mt-1 relative z-10">انضم، تنافس، واربح جوائز حقيقية!</p>
        <p className="text-xs text-white/60 font-bold mt-2 relative z-10">نقاطك: {userPoints}</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={28} /></div>
      )}

      {isError && (
        <div className="text-center py-12 space-y-3">
          <p className="text-red-500 font-bold">تعذّر تحميل المسابقات</p>
          <button type="button" onClick={() => refetch()} className="text-sm font-black text-primary underline">
            إعادة المحاولة
          </button>
        </div>
      )}

      {!isLoading && !isError && list.length === 0 && (
        <p className="text-center text-gray-400 py-16 font-bold">لا مسابقات متاحة حالياً</p>
      )}

      {!isLoading && !isError && list.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => setSelected(c)}
              className="text-right w-full bg-white rounded-[22px] border border-gray-100/80 shadow-sm overflow-hidden active:scale-[0.98] transition-all hover:shadow-md hover:border-purple-100 group"
            >
              <div className="flex items-stretch gap-3 p-3.5">
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <h3 className="flex-1 font-black text-[15px] leading-snug text-gray-900 line-clamp-2 group-hover:text-purple-700 transition-colors">
                      {c.title}
                    </h3>
                    {c.isFeatured && (
                      <span className="shrink-0 bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full">
                        ⭐
                      </span>
                    )}
                  </div>

                  {c.description && (
                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{c.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-auto pt-0.5">
                    <span className="inline-flex items-center gap-1 rounded-xl bg-violet-50 px-2.5 py-1.5 text-[11px] font-black text-violet-700">
                      <Coins size={12} className="shrink-0" />
                      {c.minPoints}+ نقطة
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-sky-50 px-2.5 py-1.5 text-[11px] font-black text-sky-700">
                      <Users size={12} className="shrink-0" />
                      {c.participantsCount ?? 0} مشارك
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-2.5 py-1.5 text-[11px] font-black text-gray-600">
                      <Clock size={12} className="shrink-0" />
                      {timeLeft(c.endDate)}
                    </span>
                  </div>

                  {(c.joined || c.hasJoined) && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-black text-green-700 border border-green-100">
                      <CheckCircle2 size={11} /> تم الانضمام
                    </span>
                  )}
                </div>

                <div className="relative shrink-0 w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-[18px] overflow-hidden bg-gradient-to-br from-purple-100 to-indigo-100 ring-1 ring-gray-100">
                  {c.image ? (
                    <img
                      src={c.image}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🏆</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <CompetitionModal
            competition={selected}
            userPoints={userPoints}
            onClose={() => setSelected(null)}
            onJoined={(updated) => setSelected((s) => (updated || (s && { ...s, joined: true })))}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Competitions;
