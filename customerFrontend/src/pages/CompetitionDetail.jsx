import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight, Trophy, Users, MapPin, Clock, Coins,
  Minus, Plus, Loader2, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useVerificationGate } from '../context/VerificationGateContext';
import { queryKeys } from '../lib/queryClient';

const getRemaining = (endDate) => {
  if (!endDate) return null;
  const diff = new Date(endDate) - new Date();
  if (diff <= 0) return { ended: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    ended: false,
  };
};

const CompetitionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { updateUser, user } = useAuth();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const [entries, setEntries] = useState(1);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [success, setSuccess] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.competition(id),
    queryFn: async () => {
      const { data: compData } = await api.get(`/competitions/${id}`);
      return {
        competition: compData?.competition || compData,
      };
    },
    staleTime: 30 * 1000,
  });

  const competition = data?.competition;
  const userPoints = user?.points ?? 0;

  const handleJoin = async () => {
    const cost = entries * (competition.pointsPerEntry || 1);
    const prevPoints = userPoints;

    setJoining(true);
    setJoinError('');

    updateUser({ points: Math.max(0, prevPoints - cost) });
    if (competition) {
      qc.setQueryData(queryKeys.competition(id), {
        competition: {
          ...competition,
          joined: true,
          hasJoined: true,
          participantsCount: (competition.participantsCount || 0) + entries,
          myEntries: (competition.myEntries || 0) + entries,
        },
      });
    }

    try {
      const { data } = await api.post(`/competitions/${id}/join`, { entries });
      setSuccess(true);
      if (data.competition) {
        qc.setQueryData(queryKeys.competition(id), { competition: data.competition });
      }
      if (data.userPoints != null) updateUser({ points: data.userPoints });
      qc.invalidateQueries({ queryKey: queryKeys.competition(id) });
      qc.invalidateQueries({ queryKey: queryKeys.competitionsList });
      qc.invalidateQueries({ queryKey: queryKeys.me });
    } catch (err) {
      updateUser({ points: prevPoints });
      if (competition) {
        qc.setQueryData(queryKeys.competition(id), { competition });
      }
      if (handleApiVerificationError(err, handleJoin)) return;
      setJoinError(err.response?.data?.message || 'تعذّر الانضمام');
    } finally {
      setJoining(false);
    }
  };

  const onJoinClick = () => runWithVerification(handleJoin);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  if (!competition) {
    return <p className="text-center py-20 text-red-500 font-bold">المسابقة غير موجودة</p>;
  }

  const remaining = getRemaining(competition.endDate);
  const hasEnded = competition.hasEnded || remaining?.ended;
  const progress = competition.requiredParticipants > 0
    ? Math.min(100, Math.round(((competition.participantsCount || 0) / competition.requiredParticipants) * 100))
    : 0;
  const eligible = userPoints >= competition.minPoints;
  const maxEntries = Math.max(0, Math.floor(userPoints / (competition.pointsPerEntry || 1)));
  const cost = entries * (competition.pointsPerEntry || 1);

  return (
    <div className="pb-24 space-y-5 text-right" dir="rtl">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 font-bold text-sm">
        <ChevronRight size={20} /> رجوع
      </button>

      <div className="relative aspect-video rounded-[28px] overflow-hidden bg-gray-100">
        {competition.image ? (
          <img src={competition.image} alt={competition.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🏆</div>
        )}
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl font-black text-gray-900">{competition.title}</h1>
        <p className="text-sm text-gray-600 leading-relaxed">{competition.description}</p>

        <div className="flex flex-wrap gap-3 text-xs font-bold text-gray-500">
          <span className="flex items-center gap-1"><Coins size={14} className="text-primary" /> {competition.minPoints}+ نقطة</span>
          <span className="flex items-center gap-1"><Users size={14} /> {competition.participantsCount || 0} مشارك</span>
          {competition.location && <span className="flex items-center gap-1"><MapPin size={14} /> {competition.location}</span>}
          {remaining && !remaining.ended && (
            <span className="flex items-center gap-1"><Clock size={14} /> {remaining.days}ي {remaining.hours}س</span>
          )}
        </div>

        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-gray-400 font-bold">{progress}% من المشاركين المطلوبين</p>
      </div>

      {hasEnded ? (
        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-yellow-300 rounded-2xl p-5 text-center space-y-3">
          <p className="text-lg font-black text-amber-900">🎉 تم إعلان الفائز</p>
          <p className="text-sm font-bold text-amber-800">{competition.prizeName || competition.title}</p>
          {competition.drawLink && (
            <a
              href={competition.drawLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-amber-500 text-white rounded-2xl font-black"
            >
              مشاهدة السحب
            </a>
          )}
        </div>
      ) : success ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-green-700 font-bold">
            <CheckCircle2 size={22} /> تمت إضافة المشاركات بنجاح!
          </div>
          <button
            type="button"
            onClick={() => { setSuccess(false); setEntries(1); }}
            className="w-full py-3 bg-green-600 text-white rounded-2xl font-black"
          >
            إضافة مشاركات أخرى
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4 shadow-sm">
          {competition.joined && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-green-700 text-xs font-bold">
              لديك {competition.myEntries || 0} مشاركة — يمكنك شراء المزيد
            </div>
          )}
          <p className="text-sm font-bold text-gray-600">نقاطك: <span className="text-primary">{userPoints}</span></p>
          {!eligible && (
            <div className="flex items-center gap-2 text-amber-600 text-sm font-bold">
              <AlertTriangle size={16} /> تحتاج {competition.minPoints - userPoints} نقطة إضافية
            </div>
          )}
          {eligible && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">{competition.joined ? 'مشاركات إضافية' : 'عدد المشاركات'}</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setEntries((e) => Math.max(1, e - 1))} className="w-8 h-8 rounded-lg bg-gray-100"><Minus size={14} /></button>
                  <span className="font-black">{entries}</span>
                  <button type="button" onClick={() => setEntries((e) => Math.min(maxEntries, e + 1))} className="w-8 h-8 rounded-lg bg-gray-100"><Plus size={14} /></button>
                </div>
              </div>
              <p className="text-xs text-gray-400">التكلفة: {cost} نقطة ({competition.pointsPerEntry}/مشاركة)</p>
              {joinError && <p className="text-red-500 text-sm font-bold">{joinError}</p>}
              <button
                type="button"
                onClick={onJoinClick}
                disabled={joining || entries > maxEntries}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {joining ? <Loader2 className="animate-spin" size={20} /> : <Trophy size={20} />}
                {competition.joined ? 'شراء مشاركات إضافية' : 'انضم للمسابقة'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CompetitionDetail;
