import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Activity, Clock, User, Filter, Search } from 'lucide-react';
import '../style/activity.css';

const ActivityPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            // const response = await axios.get('/admin/activity-logs');
            // setLogs(response.data);
            setLogs([
                { _id: '1', user: { name: 'أحمد الإدمن' }, action: 'تعديل حالة متجر', target: 'مطعم البيك', time: 'منذ 5 دقائق', severity: 'info' },
                { _id: '2', user: { name: 'نظام عروض تك' }, action: 'توليد 500 كود', target: 'دفعة العيد', time: 'منذ ساعة', severity: 'success' },
                { _id: '3', user: { name: 'سارة المشرفة' }, action: 'حذف مستخدم', target: 'user_123', time: 'منذ ساعتين', severity: 'warning' },
            ]);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, []);

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div className="admin-title">
                    <h1>سجل النشاطات الإدارية</h1>
                    <p>مراقبة شاملة لكل العمليات التي يقوم بها فريق الإدارة والنظام</p>
                </div>
                <div className="flex gap-2">
                    <button className="admin-input flex items-center gap-2">
                        <Filter size={18} /> تصفية
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="activity-timeline">
                    {logs.map((log) => (
                        <div key={log._id} className="activity-log-item">
                            <div className={`activity-icon icon-${log.severity}`}>
                                <Activity size={20} />
                            </div>
                            <div className="activity-content">
                                <div className="activity-header">
                                    <span className="activity-user flex items-center gap-1">
                                        <User size={14} /> {log.user.name}
                                    </span>
                                    <span className="activity-time flex items-center gap-1">
                                        <Clock size={12} /> {log.time}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="activity-message">
                                        قام بـ <span className="text-white font-bold">{log.action}</span> على <span className="text-secondary">{log.target}</span>
                                    </p>
                                    <span className={`severity-tag bg-${log.severity}/10 text-${log.severity === 'info' ? 'secondary' : log.severity}`}>
                                        {log.severity}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ActivityPage;
