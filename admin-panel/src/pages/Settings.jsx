import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Settings as SettingsIcon, Save, Globe, Lock, 
  Bell, Database, ShieldCheck, RefreshCw 
} from 'lucide-react';

const Settings = () => {
    const [settings, setSettings] = useState({
        siteName: 'عروض تك',
        supportEmail: 'support@offers-tech.com',
        maintenanceMode: false,
        minWithdrawPoints: 1000,
        registrationReward: 50
    });

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div className="admin-title">
                    <h1>إعدادات المنصة المركزية</h1>
                    <p>تحكم في القواعد الأساسية، مستويات الأمان، وتفضيلات النظام</p>
                </div>
                <button className="btn-primary">
                    <Save size={20} /> حفظ جميع التغييرات
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Settings Tabs */}
                <div className="lg:col-span-1 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20">
                        <Globe size={18} /> الإعدادات العامة
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:bg-card transition-all">
                        <Lock size={18} /> الحماية والأمان
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:bg-card transition-all">
                        <Bell size={18} /> التنبيهات والرسائل
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:bg-card transition-all">
                        <Database size={18} /> النسخ الاحتياطي
                    </button>
                </div>

                {/* Settings Form Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="admin-card">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-border-color/50 pb-4">
                            <SettingsIcon size={20} className="text-primary" /> المعلومات الأساسية
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm text-muted">اسم المنصة (يظهر في المتصفح)</label>
                                <input type="text" className="admin-input w-full" defaultValue={settings.siteName} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-muted">بريد الدعم الفني</label>
                                <input type="email" className="admin-input w-full" defaultValue={settings.supportEmail} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-muted">الحد الأدنى لتحويل النقاط</label>
                                <input type="number" className="admin-input w-full" defaultValue={settings.minWithdrawPoints} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-muted">مكافأة التسجيل الجديد (XP)</label>
                                <input type="number" className="admin-input w-full" defaultValue={settings.registrationReward} />
                            </div>
                        </div>
                    </div>

                    <div className="admin-card border-danger/20 bg-danger/5">
                        <h3 className="text-lg font-bold mb-4 text-danger flex items-center gap-2">
                            <ShieldCheck size={20} /> وضع الصيانة والحماية
                        </h3>
                        <div className="flex items-center justify-between p-4 bg-dark/50 rounded-2xl border border-danger/10">
                            <div>
                                <p className="font-bold text-white">تفعيل وضع الصيانة</p>
                                <p className="text-xs text-muted">عند التفعيل، سيتم إيقاف التطبيق والموقع عن العمل للزبائن</p>
                            </div>
                            <div className="w-14 h-7 bg-dark border border-border-color rounded-full relative cursor-pointer">
                                <div className="absolute left-1 top-1 w-5 h-5 bg-muted rounded-full transition-all"></div>
                            </div>
                        </div>
                        
                        <div className="mt-6 flex gap-4">
                            <button className="btn-primary bg-danger hover:bg-red-700 shadow-danger/20">
                                <RefreshCw size={18} /> إعادة تشغيل السيرفر
                            </button>
                            <button className="px-6 py-3 bg-dark text-white rounded-xl font-bold border border-border-color">
                                تفريغ الكاش (Cache)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
