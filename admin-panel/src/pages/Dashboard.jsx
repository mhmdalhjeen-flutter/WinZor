import React, { useState, useEffect } from 'react';
import {
  Users, Store, Ticket, TrendingUp, Clock, AlertTriangle, 
  ChevronLeft, ShieldAlert, Package, CreditCard
} from 'lucide-react';
import '../style/index.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 1250, activeStores: 45, pendingStores: 12, 
    totalCodesUsed: 890, activeDraws: 3, totalCards: 500, activeBoxes: 8
  });

  const statCards = [
    { name: 'إجمالي المستخدمين', value: stats.totalUsers, icon: <Users size={24} />, color: 'var(--secondary)' },
    { name: 'المتاجر النشطة', value: stats.activeStores, icon: <Store size={24} />, color: 'var(--success)' },
    { name: 'بانتظار التفعيل', value: stats.pendingStores, icon: <AlertTriangle size={24} />, color: 'var(--warning)' },
    { name: 'أكواد مستخدمة', value: stats.totalCodesUsed, icon: <Ticket size={24} />, color: 'var(--primary)' },
  ];

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div className="admin-title">
          <h1>لوحة التحكم الاستراتيجية</h1>
          <p>مرحباً بك مجدداً، إليك ملخص أداء المنصة اليوم</p>
        </div>
        <div className="flex gap-3">
            <div className="admin-card py-2 px-4 flex items-center gap-2 border-primary/20 bg-primary/5">
                <ShieldAlert size={18} className="text-primary" />
                <span className="text-sm font-bold text-primary">3 تنبيهات أمنية</span>
            </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="admin-card flex items-center gap-5 hover:border-primary/50 cursor-default">
            <div className="p-4 rounded-2xl" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <p className="text-muted text-sm font-medium">{stat.name}</p>
              <h2 className="text-2xl font-extrabold mt-1">{stat.value.toLocaleString()}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 admin-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Clock size={20} className="text-secondary" /> آخر النشاطات
            </h3>
            <button className="text-sm text-secondary hover:underline">عرض الكل</button>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-4 p-4 rounded-xl bg-dark/30 border border-border-color/50 hover:border-secondary/30 transition-all">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">ز</div>
                <div className="flex-1">
                  <p className="text-sm text-main">قام المستخدم <span className="font-bold text-secondary">أحمد علي</span> باستخدام كود في متجر <span className="text-primary font-bold">البيك</span></p>
                  <span className="text-xs text-muted">منذ 10 دقائق</span>
                </div>
                <ChevronLeft size={16} className="text-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* System Health & Alerts */}
        <div className="space-y-6">
          <div className="admin-card border-warning/30 bg-warning/5">
            <h3 className="text-warning font-bold flex items-center gap-2 mb-4">
                <AlertTriangle size={18} /> تنبيهات النظام
            </h3>
            <div className="space-y-3">
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
                    <strong>متجر جديد:</strong> "حلويات دمشق" بانتظار الموافقة.
                </div>
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
                    <strong>سحب أوشك على الانتهاء:</strong> سحب الجائزة الكبرى.
                </div>
            </div>
          </div>

          <div className="admin-card">
             <h3 className="font-bold mb-4">أداء السحوبات</h3>
             <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted">سحب الأسبوع</span>
                        <span className="text-success">85% اكتمال</span>
                    </div>
                    <div className="w-full h-2 bg-dark rounded-full overflow-hidden">
                        <div className="h-full bg-success w-[85%]"></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted">سحب العيد</span>
                        <span className="text-secondary">40% اكتمال</span>
                    </div>
                    <div className="w-full h-2 bg-dark rounded-full overflow-hidden">
                        <div className="h-full bg-secondary w-[40%]"></div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
