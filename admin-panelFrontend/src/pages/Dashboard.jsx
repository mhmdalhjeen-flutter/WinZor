import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Store,
  Truck,
  Package,
  Tag,
  Trophy,
  Gift,
  Ticket,
  Coins,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import axios from '../api/axios';
import GrowthChart from '../components/dashboard/GrowthChart';
import { queryKeys } from '../lib/queryClient';
import LightLoadingHint from '../shared/LightLoadingHint';
import '../style/index.css';

const DASHBOARD_DAYS = 30;

const CARD_DEFS = [
  { key: 'users', label: 'المستخدمون', icon: Users, color: '#6366f1' },
  { key: 'stores', label: 'المتاجر', icon: Store, color: '#22c55e' },
  { key: 'suppliers', label: 'الموردون', icon: Truck, color: '#14b8a6' },
  { key: 'products', label: 'المنتجات', icon: Package, color: '#f59e0b' },
  { key: 'offers', label: 'العروض', icon: Tag, color: '#ef4444' },
  { key: 'competitions', label: 'المسابقات', icon: Trophy, color: '#a855f7' },
  { key: 'prizes', label: 'الجوائز', icon: Gift, color: '#ec4899' },
  { key: 'codes', label: 'الأكواد', icon: Ticket, color: '#0ea5e9' },
  { key: 'pointsDistributed', label: 'النقاط الموزعة', icon: Coins, color: '#fbbf24' },
  { key: 'referrals', label: 'الدعوات', icon: UserPlus, color: '#818cf8' },
];

const formatRelativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  return new Date(dateStr).toLocaleDateString('ar');
};

const Dashboard = () => {
  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.dashboard(DASHBOARD_DAYS),
    queryFn: async () => {
      const { data: res } = await axios.get(`/admin/dashboard?days=${DASHBOARD_DAYS}`);
      return res;
    },
    staleTime: 30 * 1000,
  });

  const error = queryError?.response?.data?.message || (queryError ? 'تعذّر تحميل لوحة التحكم' : '');
  const refreshing = isFetching && !isLoading && !!data;

  if (error && !data) {
    return (
      <div className="admin-page-container">
        <div className="admin-card border-danger/40 bg-danger/10 text-center">
          <AlertTriangle className="mx-auto mb-3 text-danger" size={32} />
          <p className="font-bold text-main">{error}</p>
          <button type="button" onClick={() => refetch()} className="btn-primary mx-auto mt-4">
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const cards = data?.cards || {};
  const growth = data?.growth || {};

  return (
    <div className="admin-page-container">
      <div className="admin-header flex-col gap-4 sm:flex-row">
        <div className="admin-title">
          <h1>لوحة المتابعة</h1>
          <p>نظرة عامة على أداء المنصة — استخدم القائمة الجانبية للتنقل</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {data?.security?.count > 0 && (
            <div className="admin-card flex items-center gap-2 border-warning/30 bg-warning/10 py-2 px-4">
              <ShieldAlert size={18} className="text-warning" />
              <span className="text-sm font-bold text-warning">
                {data.security.count} تنبيه أمني
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={refreshing}
            className="admin-card flex items-center gap-2 py-2 px-4 transition hover:border-primary/40"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-primary' : 'text-muted'} />
            <span className="text-sm font-bold text-muted">تحديث</span>
          </button>
        </div>
      </div>

      {isLoading && !data && (
        <LightLoadingHint label="جاري تحميل لوحة التحكم..." />
      )}

      <p className="mb-3 text-xs font-bold text-muted">إحصائيات المنصة</p>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {CARD_DEFS.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="admin-card flex items-center gap-3 p-4 sm:gap-4 sm:p-5"
          >
            <div
              className="shrink-0 rounded-2xl p-3 sm:p-4"
              style={{ backgroundColor: `${color}18`, color }}
            >
              <Icon size={22} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-muted sm:text-sm">{label}</p>
              {isLoading && !data ? (
                <div className="mt-2 h-7 w-16 animate-pulse rounded-lg bg-slate-100 sm:h-8 sm:w-20" />
              ) : (
                <h2 className="mt-0.5 text-xl font-extrabold sm:text-2xl">
                  {(cards[key] ?? 0).toLocaleString('ar')}
                </h2>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {isLoading && !data ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="admin-card h-64 animate-pulse bg-slate-50" />
          ))
        ) : (
          <>
            <GrowthChart
              title="نمو المستخدمين"
              subtitle="إجمالي الزبائن المسجّلين"
              data={growth.users}
              color="#6366f1"
              gradientId="usersGradient"
            />
            <GrowthChart
              title="نمو المتاجر"
              subtitle="إجمالي المتاجر في المنصة"
              data={growth.stores}
              color="#22c55e"
              gradientId="storesGradient"
            />
            <GrowthChart
              title="نمو العروض"
              subtitle="إجمالي العروض المنشورة"
              data={growth.offers}
              color="#ef4444"
              gradientId="offersGradient"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="admin-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <Clock size={20} className="text-secondary" /> آخر النشاطات
            </h3>
          </div>
          <div className="space-y-3">
            {(data?.recentActivity || []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">لا توجد نشاطات مسجّلة بعد</p>
            ) : (
              data.recentActivity.map((log) => (
                <div
                  key={log._id}
                  className="flex items-start gap-3 rounded-xl border border-border-color bg-slate-50 p-3 sm:p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-black text-secondary">
                    {(log.user?.name || 'ن').charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-main">
                      <span className="font-bold text-secondary">{log.action}</span>
                      {log.details ? ` — ${log.details}` : ''}
                    </p>
                    <span className="text-xs text-muted">{formatRelativeTime(log.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="admin-card">
            <h3 className="mb-4 font-bold">ملخص سريع</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between gap-2">
                <span className="text-muted">متاجر نشطة</span>
                <span className="font-bold text-success">{(cards.activeStores ?? 0).toLocaleString('ar')}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-muted">بانتظار التفعيل</span>
                <span className="font-bold text-warning">{(cards.pendingStores ?? 0).toLocaleString('ar')}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-muted">أكواد ترويجية</span>
                <span className="font-bold">{(cards.promoCodes ?? 0).toLocaleString('ar')}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-muted">أكواد تفعيل</span>
                <span className="font-bold">{(cards.activationCodes ?? 0).toLocaleString('ar')}</span>
              </li>
            </ul>
          </div>

          {(data?.security?.alerts || []).length > 0 && (
            <div className="admin-card border-warning/30 bg-warning/5">
              <h3 className="mb-3 flex items-center gap-2 font-bold text-warning">
                <AlertTriangle size={18} /> تنبيهات (24 ساعة)
              </h3>
              <div className="space-y-2">
                {data.security.alerts.map((alert) => (
                  <div
                    key={alert._id}
                    className="rounded-lg border border-warning/20 bg-warning/10 p-3 text-xs leading-relaxed"
                  >
                    <strong>{alert.action}:</strong> {alert.details || '—'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
