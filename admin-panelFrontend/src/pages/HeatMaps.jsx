import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Users,
  Store,
  Activity,
  ShoppingBag,
  Trophy,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import axios from '../api/axios';
import PeriodFilter from '../components/analytics/PeriodFilter';
import DistributionBars, { PERIOD_LABELS } from '../components/analytics/DistributionBars';
import RankPanel from '../components/analytics/RankPanel';
import '../style/index.css';

const heatColor = (intensity) => {
  if (intensity >= 75) return 'rgba(239, 68, 68, 0.85)';
  if (intensity >= 50) return 'rgba(245, 158, 11, 0.75)';
  if (intensity >= 25) return 'rgba(99, 102, 241, 0.65)';
  return 'rgba(51, 65, 85, 0.55)';
};

const DIMENSIONS = [
  { id: 'all', label: 'شامل' },
  { id: 'stores', label: 'المتاجر' },
  { id: 'offers', label: 'العروض' },
  { id: 'products', label: 'المنتجات' },
  { id: 'orders', label: 'الطلبات' },
  { id: 'prizes', label: 'الجوائز' },
];

const LAYERS = [
  { id: 'combined', label: 'كثافة شاملة' },
  { id: 'activity', label: 'النشاط' },
  { id: 'orders', label: 'الطلبات' },
  { id: 'prizes', label: 'الجوائز' },
  { id: 'users', label: 'المستخدمون' },
  { id: 'stores', label: 'المتاجر' },
];

const HeatMaps = () => {
  const [period, setPeriod] = useState('month');
  const [dimension, setDimension] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [layer, setLayer] = useState('combined');
  const [zoom, setZoom] = useState(1);
  const [focusRegion, setFocusRegion] = useState('');

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError('');
      try {
        const { data: res } = await axios.get(
          `/admin/heatmaps?period=${period}&dimension=${dimension}`
        );
        setData(res);
      } catch (err) {
        setError(err.response?.data?.message || 'تعذّر تحميل خريطة الحرارة');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period, dimension]
  );

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 60000);
    return () => clearInterval(timer);
  }, [load]);

  const regions = useMemo(() => {
    const list = data?.regions || [];
    if (!focusRegion) return list;
    return list.filter((r) => r.key === focusRegion || r.name === focusRegion);
  }, [data?.regions, focusRegion]);

  const mapPoints = useMemo(() => {
    const pts = data?.mapPoints || [];
    if (!focusRegion) return pts;
    return pts.filter((p) => p.name === focusRegion || regions.some((r) => r.name === p.name));
  }, [data?.mapPoints, focusRegion, regions]);

  if (error && !data) {
    return (
      <div className="admin-page-container">
        <div className="admin-card border-danger/30 bg-danger/10 text-center">
          <AlertTriangle className="mx-auto mb-2 text-danger" size={28} />
          <p className="font-bold">{error}</p>
          <button type="button" className="btn-primary mx-auto mt-4" onClick={() => load()}>
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <div className="admin-header flex-col gap-4 lg:flex-row">
        <div className="admin-title">
          <h1>خرائط الحرارة</h1>
          <p>
            {PERIOD_LABELS[period]} — {DIMENSIONS.find((d) => d.id === dimension)?.label}
            {data?.generatedAt && (
              <span className="text-muted"> · محدّث {new Date(data.generatedAt).toLocaleTimeString('ar')}</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PeriodFilter value={period} onChange={setPeriod} disabled={refreshing} />
          <button type="button" onClick={() => load(true)} className="admin-card px-3 py-2">
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-primary' : 'text-muted'} />
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {DIMENSIONS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              setDimension(d.id);
              setFocusRegion('');
            }}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-bold ${
              dimension === d.id ? 'bg-primary text-white' : 'border border-border-color text-muted'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="admin-card flex items-center gap-3 p-4">
          <Users className="text-secondary" size={20} />
          <div>
            <p className="text-xs text-muted">المستخدمون</p>
            <p className="text-lg font-extrabold">{(data?.totals?.users ?? 0).toLocaleString('ar')}</p>
          </div>
        </div>
        <div className="admin-card flex items-center gap-3 p-4">
          <Store className="text-success" size={20} />
          <div>
            <p className="text-xs text-muted">المتاجر</p>
            <p className="text-lg font-extrabold">{(data?.totals?.stores ?? 0).toLocaleString('ar')}</p>
          </div>
        </div>
        <div className="admin-card flex items-center gap-3 p-4">
          <Activity className="text-warning" size={20} />
          <div>
            <p className="text-xs text-muted">النشاط</p>
            <p className="text-lg font-extrabold">{(data?.totals?.activity ?? 0).toLocaleString('ar')}</p>
          </div>
        </div>
        <div className="admin-card flex items-center gap-3 p-4">
          <ShoppingBag className="text-primary" size={20} />
          <div>
            <p className="text-xs text-muted">الطلبات</p>
            <p className="text-lg font-extrabold">{(data?.totals?.orders ?? 0).toLocaleString('ar')}</p>
          </div>
        </div>
        <div className="admin-card flex items-center gap-3 p-4">
          <Trophy className="text-amber-400" size={20} />
          <div>
            <p className="text-xs text-muted">جوائز مادية</p>
            <p className="text-lg font-extrabold">{(data?.totals?.prizes ?? 0).toLocaleString('ar')}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLayer(l.id)}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-bold ${
              layer === l.id ? 'bg-secondary text-white' : 'border border-border-color text-muted'
            }`}
          >
            {l.label}
          </button>
        ))}
        <div className="mr-auto flex gap-1">
          <button type="button" className="admin-card p-2" onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}>
            <ZoomIn size={16} />
          </button>
          <button type="button" className="admin-card p-2" onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}>
            <ZoomOut size={16} />
          </button>
          {focusRegion && (
            <button type="button" className="admin-card px-3 py-2 text-xs font-bold" onClick={() => setFocusRegion('')}>
              عرض الكل
            </button>
          )}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="admin-card">
          <h3 className="mb-4 flex items-center gap-2 font-bold">
            <MapPin size={18} className="text-primary" /> خريطة المناطق
          </h3>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border-color bg-[#0b1220]">
            {mapPoints.length > 0 ? (
              <svg
                viewBox="0 0 100 70"
                className="h-full w-full transition-transform duration-300"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              >
                {mapPoints.map((p) => {
                  const x = ((p.lng - 34.2) / 1.2) * 100;
                  const y = 70 - ((p.lat - 31.2) / 1.6) * 70;
                  const region = (data?.regions || []).find((r) => r.name === p.name);
                  const intensity = region?.intensity?.[layer] ?? p.intensity ?? 0;
                  const r = 3 + (intensity / 100) * 8;
                  return (
                    <g
                      key={p.name}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setFocusRegion(p.name)}
                    >
                      <circle cx={x} cy={y} r={r + 2} fill={heatColor(intensity)} opacity="0.35" />
                      <circle cx={x} cy={y} r={r} fill={heatColor(intensity)} />
                      <text x={x} y={y - r - 2} fill="#94a3b8" fontSize="3" textAnchor="middle">
                        {p.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                لا توجد إحداثيات — العرض حسب المناطق أدناه
              </div>
            )}
          </div>
        </div>

        <div className="admin-card">
          <h3 className="mb-4 font-bold">شبكة كثافة المناطق</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {regions.map((region) => {
              const intensity = region.intensity?.[layer] ?? region.intensity?.combined ?? 0;
              return (
                <button
                  key={region.key}
                  type="button"
                  onClick={() => setFocusRegion(region.name)}
                  className={`rounded-2xl border border-border-color/50 p-4 text-right transition hover:scale-[1.02] ${
                    focusRegion === region.name ? 'ring-2 ring-primary' : ''
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${heatColor(intensity)} 0%, rgba(15,23,42,0.9) 100%)`,
                  }}
                >
                  <p className="text-sm font-black text-white">{region.name}</p>
                  <p className="mt-2 text-[10px] text-white/80">نشاط: {region.activityCount}</p>
                  <p className="text-[10px] text-white/80">طلبات: {region.ordersCount ?? 0}</p>
                  <p className="text-[10px] text-white/80">جوائز: {region.prizesCount ?? 0}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/30">
                    <div className="h-full bg-white/90" style={{ width: `${intensity}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <DistributionBars title="توزيع النشاط" regions={regions} metric="activity" />
        <DistributionBars
          title="توزيع الطلبات"
          regions={regions.map((r) => ({ ...r, activityCount: r.ordersCount ?? 0 }))}
          metric="activity"
        />
        <DistributionBars
          title="توزيع الجوائز"
          regions={regions.map((r) => ({ ...r, activityCount: r.prizesCount ?? 0 }))}
          metric="activity"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <RankPanel
          title="أكثر المناطق طلباً"
          rows={data?.ordersByRegion?.slice(0, 10)}
          labelKey="label"
          valueKey="orders"
          valueLabel="طلب"
        />
        <RankPanel
          title="أكثر المناطق فوزاً بجوائز"
          rows={data?.prizesByRegion?.slice(0, 10)}
          labelKey="label"
          valueKey="prizes"
          valueLabel="جائزة"
        />
      </div>

      <div className="admin-card">
        <h3 className="mb-4 font-bold">ترتيب المناطق — Decision View</h3>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[720px]">
            <thead>
              <tr>
                <th>#</th>
                <th>المنطقة</th>
                <th>النشاط</th>
                <th>الطلبات</th>
                <th>الجوائز</th>
                <th>المستخدمون</th>
                <th>المتاجر</th>
                <th>الكثافة</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((r, i) => (
                <tr key={r.key} className="cursor-pointer hover:bg-dark/20" onClick={() => setFocusRegion(r.name)}>
                  <td>{i +  1}</td>
                  <td className="font-bold">{r.name}</td>
                  <td>{r.activityCount}</td>
                  <td>{r.ordersCount ?? 0}</td>
                  <td>{r.prizesCount ?? 0}</td>
                  <td>{r.usersCount}</td>
                  <td>{r.storesCount}</td>
                  <td>
                    <span
                      className="rounded-full px-2 py-1 text-xs font-black text-white"
                      style={{ backgroundColor: heatColor(r.intensity?.[layer] ?? 0) }}
                    >
                      {r.intensity?.[layer] ?? r.intensity?.combined ?? 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HeatMaps;
