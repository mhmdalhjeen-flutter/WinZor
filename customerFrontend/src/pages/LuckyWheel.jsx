import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, Lock, Sparkles, Trophy, CircleDot } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useVerificationGate } from '../context/VerificationGateContext';
import { queryClient, queryKeys } from '../lib/queryClient';
import WheelVisual from '../components/WheelVisual';
import WheelResultPopup from '../components/WheelResultPopup';
import { setPointsFloatOrigin, commitPointsUpdate } from '../utils/pointsAnimation';

const spinIdempotency = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const LuckyWheel = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [userPoints, setUserPoints] = useState(user?.points ?? 0);
  const spinBtnRef = useRef(null);

  const loadConfig = useCallback(async () => {
    try {
      const { data } = await api.get('/wheel/config');
      setConfig(data);
      setUserPoints(data.userPoints ?? 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const calcRotation = (segmentIndex, segmentCount, currentRot) => {
    const angle = 360 / segmentCount;
    const target = 360 - (segmentIndex * angle + angle / 2);
    const fullSpins = 8 * 360;
    const base = currentRot % 360;
    return currentRot + fullSpins + (target - base + 360) % 360;
  };

  const doSpin = async () => {
    if (spinning || !config?.segments?.length) return;

    setSpinning(true);
    setResult(null);
    const idemKey = spinIdempotency();

    try {
      const { data } = await api.post('/wheel/spin', {}, {
        headers: { 'Idempotency-Key': idemKey },
      });

      const segCount = data.segmentCount || config.segments.length;
      const newRot = calcRotation(data.segmentIndex, segCount, rotation);
      setRotation(newRot);

      await new Promise((r) => setTimeout(r, 7200));

      setUserPoints(data.userPoints);
      if (data.userPoints != null) {
        const btn = spinBtnRef.current;
        if (btn) {
          const r = btn.getBoundingClientRect();
          setPointsFloatOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        }
        commitPointsUpdate(updateUser, data.userPoints);
        queryClient.invalidateQueries({ queryKey: queryKeys.me });
      }
      setResult(data);
      loadConfig();
    } catch (err) {
      if (handleApiVerificationError(err, doSpin)) return;
      alert(err.response?.data?.message || 'تعذّر الدوران');
    } finally {
      setSpinning(false);
    }
  };

  const spin = () => runWithVerification(doSpin);

  const playTick = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      o.start();
      o.stop(ctx.currentTime + 0.15);
    } catch { /* optional sound */ }
  };

  useEffect(() => {
    if (spinning) playTick();
  }, [spinning]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (config?.enabled === false) {
    return (
      <div className="py-24 text-center px-6 space-y-4" dir="rtl">
        <CircleDot size={48} className="mx-auto text-gray-300" />
        <h2 className="text-lg font-black text-gray-700">عجلة الحظ غير متاحة حالياً</h2>
        <p className="text-sm text-gray-400 font-bold">تم إيقاف الميزة من إعدادات المنصة</p>
        <button type="button" onClick={() => navigate(-1)} className="text-primary font-black text-sm underline">
          العودة
        </button>
      </div>
    );
  }

  const segments = config?.segments || [];
  const spinCost = config?.spinCost || 5;

  return (
    <div className="space-y-6 pb-24 text-right" dir="rtl">
      <section className="flex items-center justify-between px-1 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
            <ChevronRight size={20} />
          </button>
          <h1 className="text-xl font-black text-gray-800">عجلة الحظ</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1 shadow-lg"
          >
            <Trophy size={14} /> جوائزي
          </button>
          <div className="bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <span className="text-sm font-black text-amber-700">{userPoints} نقطة</span>
          </div>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-8 items-center justify-center px-2">
        <div className="flex flex-col items-center">
          <WheelVisual segments={segments} rotation={rotation} size={300} spinning={spinning} />
          <button
            ref={spinBtnRef}
            type="button"
            onClick={spin}
            disabled={spinning}
            className="mt-8 bg-gradient-to-r from-primary to-purple-600 text-white px-10 py-4 rounded-3xl font-black text-lg shadow-xl active:scale-95 disabled:opacity-50 transition-all"
          >
            {spinning ? 'جاري الدوران...' : `جرّب حظك (${spinCost} نقاط)`}
          </button>
          {userPoints < spinCost && (
            <p className="text-xs text-amber-600 font-bold mt-2">قد تحتاج {spinCost} نقاط إذا لم تتوقف على جائزة مقفلة</p>
          )}
        </div>

        {/* Legend */}
        <div className="w-full max-w-xs bg-white rounded-3xl border border-gray-100 p-4 shadow-sm space-y-2">
          <h3 className="font-black text-gray-800 text-sm mb-3">دليل الجوائز</h3>
          {segments.map((seg) => (
            <div key={seg._id} className={`flex items-center gap-3 p-2 rounded-xl ${seg.locked ? 'opacity-60 bg-gray-50' : ''}`}>
              <div className="w-5 h-5 rounded-md shrink-0 border border-gray-200" style={{ background: seg.color }} />
              <span className="text-lg">{seg.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-800 truncate">{seg.name}</p>
                {seg.minPoints > 0 && (
                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                    {seg.locked ? <Lock size={10} className="text-amber-500" /> : null}
                    {seg.locked ? `مقفلة — ${seg.minPoints}+ نقطة` : `من ${seg.minPoints} نقطة`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <WheelResultPopup
        open={Boolean(result)}
        result={result}
        onClose={() => setResult(null)}
        onViewInventory={() => navigate('/inventory')}
      />

      <p className="text-center text-[10px] text-gray-400 px-6 font-bold">
        * النتيجة تُحدَّد على الخادم — لا يمكن التلاعب بالعجلة من الواجهة.
      </p>
    </div>
  );
};

export default LuckyWheel;
