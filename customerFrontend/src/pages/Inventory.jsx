import React from 'react';
import { Package, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { unwrapList } from '../utils/unwrapList';
import usePlatformSettings from '../hooks/usePlatformSettings';
import LightLoadingHint from '../shared/LightLoadingHint';

const STATUS = {
  pending: 'بانتظار الاستلام',
  contacted: 'تم التواصل',
  delivered: 'تم التسليم',
  cancelled: 'ملغاة',
};

const Inventory = () => {
  const navigate = useNavigate();
  const { data: platformSettings } = usePlatformSettings();
  const showWheelLink = platformSettings?.features?.wheel !== false
    && platformSettings?.wheel?.placements?.inventory !== false;

  const { data: wins = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['wheel', 'my-wins'],
    queryFn: async () => {
      const { data } = await api.get('/wheel/my-wins');
      return unwrapList(data, ['wins']);
    },
    staleTime: 60 * 1000,
  });

  return (
    <div className="space-y-6 pb-10 text-right" dir="rtl">
      <section className="flex items-center gap-3 px-2">
        <button type="button" onClick={() => navigate(-1)} className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <ChevronRight size={20} />
        </button>
        <h1 className="text-xl font-black text-gray-800">مخزن جوائزي</h1>
      </section>

      {isLoading && wins.length === 0 && (
        <LightLoadingHint label="جاري تحميل جوائزك..." />
      )}

      {!isLoading && !isError && wins.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <Package size={64} className="mx-auto text-gray-200" />
          <p className="text-gray-400 font-bold text-sm">مخزنك فارغ{showWheelLink ? ' — جرّب عجلة الحظ!' : ''}</p>
          {showWheelLink && (
            <button type="button" onClick={() => navigate('/wheel')} className="text-primary font-black text-sm underline">
              عجلة الحظ
            </button>
          )}
        </div>
      )}

      {isError && !isLoading && (
        <div className="py-12 text-center space-y-3">
          <p className="font-black text-red-500">تعذّر تحميل جوائزك</p>
          <button type="button" onClick={() => refetch()} className="text-sm font-black text-primary underline">
            إعادة المحاولة
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 px-2">
        {wins.map((w) => (
          <div key={w._id} className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-sm flex">
            <div className="w-4 shrink-0" style={{ background: w.prize?.color || '#6366f1' }} />
            <div className="flex-grow p-5 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-2xl">{w.prize?.icon || '🎁'}</span>
                  <h3 className="font-black text-gray-800 text-sm mt-1">{w.prizeName}</h3>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 font-bold">
                    <Clock size={10} /> {new Date(w.wonAt).toLocaleDateString('ar')}
                  </p>
                </div>
                <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-1 rounded-lg">
                  {STATUS[w.deliveryStatus] || w.deliveryStatus}
                </span>
              </div>
              {w.prize?.description && (
                <p className="text-xs text-gray-500">{w.prize.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inventory;
