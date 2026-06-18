import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Users, 
  Store, 
  Ticket, 
  TrendingUp, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeStores: 0,
        pendingStores: 0,
        totalCodesUsed: 0,
        activeDraws: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // سنقوم بربط هذه لاحقاً بالباك اند الحقيقي
                // const response = await axios.get('/admin/stats');
                // setStats(response.data);
                
                // بيانات تجريبية حالياً للعرض
                setStats({
                    totalUsers: 1250,
                    activeStores: 45,
                    pendingStores: 12,
                    totalCodesUsed: 890,
                    activeDraws: 3
                });
            } catch (err) {
                console.error("Error fetching stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        { name: 'إجمالي المستخدمين', value: stats.totalUsers, icon: <Users size={24} />, color: 'bg-blue-600' },
        { name: 'المتاجر النشطة', value: stats.activeStores, icon: <Store size={24} />, color: 'bg-green-600' },
        { name: 'متاجر بانتظار التفعيل', value: stats.pendingStores, icon: <AlertTriangle size={24} />, color: 'bg-yellow-600' },
        { name: 'أكواد تم استخدامها', value: stats.totalCodesUsed, icon: <Ticket size={24} />, color: 'bg-purple-600' },
        { name: 'السحوبات النشطة', value: stats.activeDraws, icon: <TrendingUp size={24} />, color: 'bg-red-600' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white">مركز القيادة (عين الأدمن)</h1>
                <p className="text-gray-400 mt-2">إحصائيات حية لكل ما يحدث في المنصة</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl hover:border-primary transition-all duration-300 group">
                        <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            {stat.icon}
                        </div>
                        <p className="text-gray-400 text-sm font-medium">{stat.name}</p>
                        <h3 className="text-2xl font-bold text-white mt-1">
                            {loading ? '...' : stat.value.toLocaleString()}
                        </h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* سجل النشاطات المختصر */}
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Clock className="text-primary" /> آخر النشاطات
                        </h2>
                        <button className="text-primary text-sm hover:underline">عرض الكل</button>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="flex items-center gap-4 p-4 rounded-xl bg-gray-900/50 border border-gray-800">
                                <div className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center text-primary font-bold">ز</div>
                                <div>
                                    <p className="text-white text-sm">زبون جديد أدخل كوداً لمتجر <span className="text-primary font-bold">أبو طلال</span></p>
                                    <p className="text-gray-500 text-xs mt-1">منذ 5 دقائق</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* تنبيهات النظام */}
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-white mb-6">تنبيهات النظام</h2>
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-600/50 text-yellow-200">
                            <p className="text-sm font-bold">متجر جديد بانتظار التفعيل</p>
                            <p className="text-xs mt-1 opacity-80">قام متجر "حلويات الشمال" بالتسجيل وبانتظار كود التفعيل منك.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-red-900/20 border border-red-600/50 text-red-200">
                            <p className="text-sm font-bold">سحب ينتهي غداً</p>
                            <p className="text-xs mt-1 opacity-80">سحب "مهرجان الشتاء" ينتهي غداً بانتظار إجراء السحب الميداني.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
