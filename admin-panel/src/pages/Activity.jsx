import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Activity, 
  User, 
  Store, 
  Clock, 
  AlertCircle, 
  Info, 
  ShieldAlert,
  Search,
  Filter
} from 'lucide-react';

const ActivityPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('all');

    const fetchLogs = async () => {
        try {
            const response = await axios.get('/admin/activity-logs');
            setLogs(response.data);
        } catch (err) {
            console.error("Error fetching logs", err);
            // بيانات تجريبية في حال فشل الاتصال
            setLogs([
                {
                    _id: '1',
                    action: 'إدخال كود',
                    details: 'الزبون أحمد قام بإدخال كود لمتجر حلويات المدينة',
                    severity: 'info',
                    createdAt: new Date(),
                    user: { name: 'أحمد' },
                    store: { name: 'حلويات المدينة' }
                },
                {
                    _id: '2',
                    action: 'محاولة دخول مشبوهة',
                    details: 'محاولة دخول متكررة بكلمة مرور خاطئة من IP: 192.168.1.1',
                    severity: 'danger',
                    createdAt: new Date(Date.now() - 3600000),
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'danger': return <ShieldAlert size={18} className="text-red-500" />;
            case 'warning': return <AlertCircle size={18} className="text-yellow-500" />;
            default: return <Info size={18} className="text-blue-500" />;
        }
    };

    const getSeverityClass = (severity) => {
        switch (severity) {
            case 'danger': return 'bg-red-900/20 border-red-500/50 text-red-200';
            case 'warning': return 'bg-yellow-900/20 border-yellow-500/50 text-yellow-200';
            default: return 'bg-blue-900/20 border-blue-500/50 text-blue-200';
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             log.action.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
        return matchesSearch && matchesSeverity;
    });

    return (
        <div className="space-y-8 text-white animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Activity className="text-primary" /> سجل النشاطات (عين الأدمن)
                    </h1>
                    <p className="text-gray-400 mt-1">مراقبة حية لكل ما يحدث داخل المنصة لحظة بلحظة.</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute right-3 top-3 text-gray-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="بحث في التفاصيل..." 
                            className="bg-gray-800 border border-gray-700 rounded-lg px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none"
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                    >
                        <option value="all">كل المستويات</option>
                        <option value="info">معلومات</option>
                        <option value="warning">تحذيرات</option>
                        <option value="danger">خطر / أمن</option>
                    </select>
                </div>
            </div>

            <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
                <div className="divide-y divide-gray-700">
                    {loading ? (
                        <div className="p-20 text-center text-gray-500">جاري جلب السجلات الحية...</div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-20 text-center text-gray-500">لا توجد نشاطات مسجلة حالياً</div>
                    ) : filteredLogs.map((log) => (
                        <div key={log._id} className="p-6 hover:bg-gray-700/30 transition-all flex items-start gap-4">
                            <div className={`p-3 rounded-xl border ${getSeverityClass(log.severity)}`}>
                                {getSeverityIcon(log.severity)}
                            </div>
                            
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg">{log.action}</h3>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Clock size={12} />
                                        {new Date(log.createdAt).toLocaleString('ar-EG')}
                                    </div>
                                </div>
                                <p className="text-gray-300">{log.details}</p>
                                
                                <div className="flex gap-4 pt-2">
                                    {log.user && (
                                        <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded">
                                            <User size={12} /> {log.user.name}
                                        </div>
                                    )}
                                    {log.store && (
                                        <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded">
                                            <Store size={12} /> {log.store.name}
                                        </div>
                                    )}
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
