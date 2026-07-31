import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Coins,
  X, Minus, Plus, PartyPopper, AlertTriangle, Loader2, CheckCircle2,
  Sparkles, ExternalLink,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../lib/queryClient';
import { commitPointsUpdate } from '../utils/pointsAnimation';
import { resolveImageUrl } from '../utils/mediaUrl';
import { useSecondTick } from '../hooks/useSecondTick';
import { formatCompetitionCountdown } from './CompetitionCountdownLabel';

const getRemaining = (endDate) => {
  if (!endDate) return null;
  const diff = new Date(endDate) - new Date();
  if (diff <= 0) return { days: 0, hours: 0, ended: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours, ended: false };
};

function CompetitionCountdownBadge({ endDate }) {
  const time = formatCompetitionCountdown(endDate);
  const parts = time.split(' و ');
  const daysPart = parts.length > 1 ? parts[0] : null;
  const clockPart = parts.length > 1 ? parts[1] : parts[0];

  return (
    <div className="competition-countdown-badge" aria-label={`متبقي ${time}`}>
      <span className="competition-countdown-badge__label">متبقي</span>
      {daysPart && (
        <span className="competition-countdown-badge__days">{daysPart}</span>
      )}
      <span className="competition-countdown-badge__clock">{clockPart}</span>
    </div>
  );
}

export default function CompetitionCardItem({
  competition: initialCompetition,
  userPoints: initialUserPoints = 0,
  embedded = false,
  onUpdate,
}) {
  const { updateUser } = useAuth();
  const qc = useQueryClient();
  const [competition, setCompetition] = useState(initialCompetition);
  const [userPoints, setUserPoints] = useState(initialUserPoints);
  const [showModal, setShowModal] = useState(false);
  const [entries, setEntries] = useState(1);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setUserPoints(initialUserPoints);
  }, [initialUserPoints]);

  const showCountdown = Boolean(competition?.endDate) && !competition?.hasEnded;
  useSecondTick(showCountdown);

  if (!competition) return null;

  const containerClass = embedded
    ? 'relative w-full'
    : 'max-w-4xl mx-auto relative';

  const remaining = getRemaining(competition.endDate);
  const hasEnded = competition.hasEnded || remaining?.ended;
  const hasJoined = competition.joined || competition.hasJoined;
  const myEntries = competition.myEntries || 0;

  const eligible = userPoints >= competition.minPoints;
  const missingPoints = Math.max(0, competition.minPoints - userPoints);
  const maxEntries = Math.max(0, Math.floor(userPoints / competition.pointsPerEntry));
  const cost = entries * competition.pointsPerEntry;

  const prizeImage = competition.prizeImage || competition.image;
  const prizeImageSrc = resolveImageUrl(prizeImage, { width: 200 });
  const prizeName = competition.prizeName || competition.title;

  const openModal = () => {
    setEntries(1);
    setJoinError('');
    setSuccess(false);
    setShowModal(true);
  };

  const handleJoin = async () => {
    const joinCost = entries * (competition.pointsPerEntry || 1);
    const prevCompetition = competition;
    const prevPoints = userPoints;

    setJoining(true);
    setJoinError('');

    setUserPoints((p) => p - joinCost);
    setCompetition((c) => ({
      ...c,
      joined: true,
      hasJoined: true,
      participantsCount: (c.participantsCount || 0) + entries,
      myEntries: (c.myEntries || 0) + entries,
    }));
    updateUser({ points: Math.max(0, prevPoints - joinCost) });

    try {
      const { data } = await api.post(`/competitions/${competition._id}/join`, { entries });
      setCompetition(data.competition);
      setUserPoints(data.userPoints);
      commitPointsUpdate(updateUser, data.userPoints, { queryClient: qc });
      qc.invalidateQueries({ queryKey: queryKeys.competitionsList });
      qc.invalidateQueries({ queryKey: queryKeys.competitionsFeatured });
      qc.invalidateQueries({ queryKey: queryKeys.competitions });
      onUpdate?.(data.competition, data.userPoints);
      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
      }, 2200);
    } catch (err) {
      setCompetition(prevCompetition);
      setUserPoints(prevPoints);
      updateUser({ points: prevPoints });
      setJoinError(err.response?.data?.message || 'تعذّر إتمام المشاركة');
    } finally {
      setJoining(false);
    }
  };

  if (hasEnded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={containerClass}
      >
        <motion.div
          animate={{
            boxShadow: [
              '0 0 24px rgba(250, 204, 21, 0.35)',
              '0 0 48px rgba(250, 204, 21, 0.65)',
              '0 0 24px rgba(250, 204, 21, 0.35)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="relative overflow-hidden rounded-[20px] border-2 border-yellow-400/70 bg-gradient-to-br from-yellow-500/20 via-amber-600/25 to-purple-900/50 p-3"
        >
          <div className="relative flex items-center gap-3 text-center">
            <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 border-yellow-300/80">
              {prizeImageSrc ? (
                <img src={prizeImageSrc} alt={prizeName} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-yellow-500/20 text-yellow-200">
                  <Trophy size={24} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-right space-y-1">
              <div className="inline-flex items-center gap-1 bg-yellow-400/20 text-yellow-200 px-2 py-0.5 rounded-full text-[9px] font-black border border-yellow-400/30">
                <Sparkles size={10} /> تم إعلان الفائز
              </div>
              <h2 className="text-sm font-black text-white line-clamp-2">{prizeName}</h2>
              {competition.drawLink && (
                <a
                  href={competition.drawLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-black text-amber-300"
                >
                  <ExternalLink size={12} /> مشاهدة السحب
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative bg-gradient-to-br from-[#1e1638] via-[#2a1545] to-[#7f1d1d]/80 border border-white/15 rounded-[16px] p-2.5 flex flex-col shadow-lg shadow-purple-950/20 ${containerClass}`}
      >
        {showCountdown && (
          <div className="absolute top-2 left-2 z-10">
            <CompetitionCountdownBadge endDate={competition.endDate} />
          </div>
        )}

        <div className="flex items-stretch gap-2.5 flex-1 min-h-0">
          <div className="w-[20%] min-w-[3.25rem] max-w-[4rem] shrink-0 rounded-lg overflow-hidden border border-white/20 bg-white/5 self-stretch">
            {prizeImageSrc ? (
              <img
                src={prizeImageSrc}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover min-h-[3.5rem]"
                alt={competition.title}
              />
            ) : (
              <div className="w-full h-full min-h-[3.5rem] flex items-center justify-center text-amber-300/90">
                <Trophy size={22} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
            <h2 className="text-xs sm:text-sm font-black text-white leading-snug line-clamp-2">
              {competition.title}
            </h2>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] sm:text-[11px] text-white/85 font-bold">
              <span className="flex items-center gap-1">
                <Coins size={11} className="text-amber-300 shrink-0" />
                {competition.pointsPerEntry} نقطة / فرصة
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-white/10">
          {hasJoined && myEntries > 0 && (
            <p className="mb-1.5 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
              <CheckCircle2 size={11} />
              عدد الفرص الحالية: {myEntries}
            </p>
          )}
          {eligible ? (
            <button
              type="button"
              onClick={openModal}
              className="competition-enter-btn w-full px-3 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all active:scale-[0.98]"
            >
              {hasJoined ? 'زيادة الفرصة' : 'الدخول للسحب'}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-200 text-[10px] font-bold bg-amber-500/15 px-2.5 py-2 rounded-lg border border-amber-400/25">
              <AlertTriangle size={12} className="shrink-0" />
              تحتاج {missingPoints} نقطة إضافية
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
            onClick={() => !joining && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-white/10 rounded-[28px] w-full max-w-md p-6 text-white"
              dir="rtl"
            >
              {success ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="inline-flex p-5 bg-green-500/20 text-green-400 rounded-full mb-4"
                  >
                    <PartyPopper size={48} />
                  </motion.div>
                  <h3 className="text-2xl font-black mb-2">تمت المشاركة بنجاح!</h3>
                  <p className="text-white/60 font-bold text-sm">حظاً موفقاً في المسابقة</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-xl font-black">
                      {hasJoined ? 'زيادة الفرص' : 'الانضمام للمسابقة'}
                    </h3>
                    <button type="button" onClick={() => setShowModal(false)} className="text-white/50 hover:text-white">
                      <X size={22} />
                    </button>
                  </div>

                  <div className="space-y-3 text-sm font-bold mb-5">
                    <div className="flex justify-between bg-white/5 px-4 py-3 rounded-2xl">
                      <span className="text-white/60">رصيدك من النقاط</span>
                      <span>{userPoints} نقطة</span>
                    </div>
                    <div className="flex justify-between bg-white/5 px-4 py-3 rounded-2xl">
                      <span className="text-white/60">كل فرصة تكلّف</span>
                      <span>{competition.pointsPerEntry} نقطة</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 mb-5">
                    <button
                      type="button"
                      onClick={() => setEntries((n) => Math.max(1, n - 1))}
                      className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    >
                      <Minus size={20} />
                    </button>
                    <span className="text-3xl font-black w-16 text-center">{entries}</span>
                    <button
                      type="button"
                      onClick={() => setEntries((n) => Math.min(maxEntries || 1, n + 1))}
                      className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  <div className="flex justify-between bg-primary/10 border border-primary/20 px-4 py-3 rounded-2xl text-sm font-black mb-4">
                    <span>الإجمالي</span>
                    <span className="text-primary-light">{cost} نقطة</span>
                  </div>

                  {joinError && (
                    <div className="text-red-300 text-xs font-bold mb-3 flex items-center gap-1">
                      <AlertTriangle size={14} /> {joinError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={joining || cost > userPoints || entries < 1}
                    className="w-full py-3 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {joining ? <Loader2 className="animate-spin" size={18} /> : 'تأكيد المشاركة'}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
