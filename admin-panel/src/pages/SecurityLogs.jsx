import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Lock, Eye, AlertTriangle, Terminal } from 'lucide-react';

const SecurityLogs = () => {
    const [logs, setLogs] = useState([
        { id: 1, type: 'danger', event: 'محاولة دخول فاشلة متكررة', ip: '192.168.1.45', time: 'منذ دقيقتين', user: 'admin_test' },
        { id: 2, type: 'warning', event: 'تغيير كلمة مرور أدمن', ip: '10.0.0.5', time: 'منذ ساعة', user: 'super_admin' },
        { id: 3, type: 'info', event: 'تسجيل دخول ناجح', ip: '172.16.0.10', time: 'منذ 3 ساعات', user: 'mod_1' },
    ]);

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div className="admin-title">
                    <h1>سجل الأمن والحماية</h1>
                    <p>مراقبة الدخول، محاولات الاختراق، وتغييرات الصلاحيات الحساسة</p>
                </div>
                <div className="flex gap-3">
                    <div className="admin-card py-2 px-4 bg-success/5 border-success/20 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-success" />
                        <span className="text-xs font-bold text-success">نظام الحماية: نشط</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <div className="admin-card text-center">
                    <p className="text-muted text-xs mb-1">محاولات فاشلة (24س)</p>
                    <h2 className="text-2xl font-bold text-danger">15</h2>
                </div>
                <div className="admin-card text-center">
                    <p className="text-muted text-xs mb-1">عناوين IP محظورة</p>
                    <h2 className="text-2xl font-bold text-warning">3</h2>
                </div>
                <div className="admin-card text-center">
                    <p className="text-muted text-xs mb-1">جلسات نشطة</p>
                    <h2 className="text-2xl font-bold text-secondary">4</h2>
                </div>
                <div className="admin-card text-center">
                    <p className="text-muted text-xs mb-1">آخر فحص للنظام</p>
                    <h2 className="text-sm font-bold text-success">منذ 10 دقائق</h2>
                </div>
            </div>

            <div className="admin-table-wrapper">
                <div className="p-4 border-b border-border-color/50 bg-dark/20 flex items-center gap-2">
                    <Terminal size={18} className="text-muted" />
                    <span className="text-sm font-mono text-muted">system_security_monitor.log</span>
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>الحدث الأمني</th>
                            <th>المسؤول/المستخدم</th>
                            <th>عنوان IP</th>
                            <th>الوقت</th>
                            <th className="text-left">الإجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id}>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${log.type === 'danger' ? 'bg-danger/10 text-danger' : log.type === 'warning' ? 'bg-warning/10 text-warning' : 'bg-secondary/10 text-secondary'}`}>
                                            {log.type === 'danger' ? <Lock size={16} /> : <AlertTriangle size={16} />}
                                        </div>
                                        <span className="font-bold">{log.event}</span>
                                    </div>
                                </td>
                                <td><span className="text-muted">{log.user}</span></td>
                                <td><code className="text-xs bg-dark px-2 py-1 rounded border border-border-color">{log.ip}</code></td>
                                <td><span className="text-xs text-muted">{log.time}</span></td>
                                <td className="text-left">
                                    <button className="icon-action-btn"><Eye size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SecurityLogs;
