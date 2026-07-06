import React, { useCallback, useEffect, useState } from 'react';
import {
  TrendingUp,
  Users,
  Activity,
  Store,
  Tag,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import axios from '../api/axios';
import PeriodFilter from '../components/analytics/PeriodFilter';
import BarChartPanel from '../components/analytics/BarChartPanel';
import RankPanel from '../components/analytics/RankPanel';
import DistributionBars, { PERIOD_LABELS } from '../components/analytics/DistributionBars';
import '../style/index.css';

const SectionTitle = ({ children, subtitle }) => (
  <div className="mb-4 mt-2">
    <h2 className="text-lg font-extrabold text-main">{children}</h2>
    {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
  </div>
);

const GrowthCard = ({ label, icon: Icon, color, rate, current, previous }) => (
  <div className="admin-card p-4 sm:p-5">
    <div className="mb-3 flex items-center justify-between">
      <div className="rounded-xl p-2.5" style={{ backgroundColor: `${color}18`, color }}>
        <Icon size={20} />
      </div>
      <span
        className={`text-sm font-black ${rate >= 0 ? 'text-success' : 'text-danger'}`}
      >
        {rate >= 0 ? '+' : ''}
        {rate}%
      </span>
    </div>
    <p className="text-xs text-muted">{label}</p>
    <p className="mt-1 text-2xl font-extrabold">{(current ?? 0).toLocaleString('ar')}</p>
    <p className="mt-1 text-[10px] text-muted">
      الفترة السابقة: {(previous ?? 0).toLocaleString('ar')}
    </p>
  </div>
);

const Analytics = () => {
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError('');
      try {
        const { data: res } = await axios.get(`/admin/analytics?period=${period}`);
        setData(res);
      } catch (err) {
        setError(err.response?.data?.message || 'تعذّر تحميل التحليلات');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period]
  );

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 60000);
    return () => clearInterval(timer);
  }, [load]);

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

  const g = data?.growthRate || {};

  return (
    <div className="admin-page-container">
      <div className="admin-header flex-col gap-4 lg:flex-row">
        <div className="admin-title">
          <h1>تحليلات الأعمال</h1>
          <p>مؤشرات النمو والنشاط — {PERIOD_LABELS[period] || period}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PeriodFilter value={period} onChange={setPeriod} disabled={refreshing} />
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="admin-card flex items-center gap-2 px-3 py-2"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-primary' : 'text-muted'} />
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">
        <GrowthCard
          label="معدل نمو المستخدمين"
          icon={Users}
          color="#6366f1"
          rate={g.users?.ratePercent ?? 0}
          current={g.users?.current}
          previous={g.users?.previous}
        />
        <GrowthCard
          label="معدل نمو المتاجر"
          icon={Store}
          color="#22c55e"
          rate={g.stores?.ratePercent ?? 0}
          current={g.stores?.current}
          previous={g.stores?.previous}
        />
        <GrowthCard
          label="معدل نمو العروض"
          icon={Tag}
          color="#ef4444"
          rate={g.offers?.ratePercent ?? 0}
          current={g.offers?.current}
          previous={g.offers?.previous}
        />
        <GrowthCard
          label="معدل نمو النشاط"
          icon={Activity}
          color="#f59e0b"
          rate={g.activity?.ratePercent ?? 0}
          current={g.activity?.current}
          previous={g.activity?.previous}
        />
        <div className="admin-card col-span-2 flex items-center gap-4 p-4 lg:col-span-1">
          <div className="rounded-xl bg-secondary/15 p-3 text-secondary">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-xs text-muted">مستخدمون جدد</p>
            <p className="text-2xl font-extrabold">{(data?.newUsers ?? 0).toLocaleString('ar')}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BarChartPanel
          title="النشاط اليومي"
          subtitle="تفاعلات المستخدمين + سجل النظام"
          data={data?.dailyActivity}
          color="#6366f1"
        />
        <BarChartPanel
          title="النشاط الشهري"
          subtitle="آخر 12 شهراً"
          data={data?.monthlyActivity}
          valueKey="count"
          color="#22c55e"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <RankPanel
          title="أكثر المناطق استخداماً"
          subtitle="تسجيلات + نشاط المستخدمين"
          rows={data?.regions?.mostActive}
          labelKey="label"
          valueKey="usageCount"
          valueLabel="نشاط"
        />
        <RankPanel
          title="أقل المناطق استخداماً"
          rows={data?.regions?.leastActive}
          labelKey="label"
          valueKey="usageCount"
          valueLabel="نشاط"
        />
        <RankPanel
          title="أكثر المناطق طلباً"
          rows={data?.regions?.mostOrders}
          labelKey="label"
          valueKey="orders"
          valueLabel="طلب"
        />
        <RankPanel
          title="أقل المناطق طلباً"
          rows={data?.regions?.leastOrders}
          labelKey="label"
          valueKey="orders"
          valueLabel="طلب"
        />
      </div>

      <SectionTitle subtitle="Top 10 — العروض والمنتجات">العروض والمنتجات</SectionTitle>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <RankPanel
          title="أكثر العروض مشاهدة"
          rows={data?.topOffersByViews?.map((o) => ({ ...o, name: o.title }))}
          labelKey="name"
          valueKey="views"
          valueLabel="مشاهدة"
        />
        <RankPanel
          title="أكثر العروض طلباً"
          rows={data?.topOffersByOrders?.map((o) => ({ ...o, name: o.title }))}
          labelKey="name"
          valueKey="orders"
          valueLabel="طلب"
        />
        <RankPanel
          title="أكثر المنتجات مشاهدة"
          rows={data?.topProductsByViews}
          labelKey="name"
          valueKey="views"
          valueLabel="مشاهدة"
        />
        <RankPanel
          title="أكثر المنتجات طلباً"
          rows={data?.topProductsByOrders}
          labelKey="name"
          valueKey="orders"
          valueLabel="طلب"
        />
        <RankPanel
          title="أفضل 10 منتجات تقييماً"
          rows={data?.topRatedProducts?.map((p) => ({
            ...p,
            name: `${p.name} (${(p.ratingAvg || 0).toFixed(1)}★)`,
          }))}
          labelKey="name"
          valueKey="ratingCount"
          valueLabel="تقييم"
        />
        <RankPanel
          title="أفضل 10 عروض تقييماً"
          rows={data?.topRatedOffers?.map((o) => ({
            ...o,
            name: `${o.title} (${(o.ratingAvg || 0).toFixed(1)}★)`,
          }))}
          labelKey="name"
          valueKey="ratingCount"
          valueLabel="تقييم"
        />
      </div>

      <SectionTitle subtitle="Top 10 — المتاجر">المتاجر</SectionTitle>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <RankPanel
          title="أكثر المتاجر مشاهدة"
          rows={data?.topStoresByVisits}
          labelKey="name"
          valueKey="visits"
          valueLabel="زيارة"
        />
        <RankPanel
          title="أكثر المتاجر طلباً"
          rows={data?.topStoresByOrders}
          labelKey="name"
          valueKey="orders"
          valueLabel="طلب"
        />
        <RankPanel
          title="أكثر المتاجر طلباً للأكواد"
          rows={data?.topStoresByPromoCodes}
          labelKey="name"
          valueKey="redemptions"
          valueLabel="استخدام"
        />
      </div>

      <SectionTitle subtitle="الجوائز المادية حسب المنطقة">الجوائز والمناطق</SectionTitle>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <RankPanel
          title="أكثر المناطق فوزاً بجوائز مادية"
          rows={data?.prizesByRegion?.most}
          labelKey="label"
          valueKey="prizes"
          valueLabel="جائزة"
        />
        <RankPanel
          title="أقل المناطق فوزاً"
          rows={data?.prizesByRegion?.least}
          labelKey="label"
          valueKey="prizes"
          valueLabel="جائزة"
        />
        <RankPanel
          title="أكثر المسابقات مشاركة"
          rows={data?.topCompetitions?.map((c) => ({ ...c, name: c.title }))}
          labelKey="name"
          valueKey="entries"
          valueLabel="مشاركة"
        />
      </div>

      {data?.generatedAt && (
        <p className="text-center text-[10px] text-muted">
          آخر تحديث: {new Date(data.generatedAt).toLocaleString('ar')}
        </p>
      )}
    </div>
  );
};

export default Analytics;
