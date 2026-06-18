import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Store, 
  CheckCircle, 
  XCircle, 
  Phone, 
  MapPin, 
  Search,
  ExternalLink
} from 'lucide-react';

const Stores = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchStores = async () => {
        try {
            const response = await axios.get('/admin/stores');
            setStores(response.data);
        } catch (err) {
            console.error("Error fetching stores", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    const handleToggleStatus = async (storeId) => {
        try {
            await axios.patch(`/admin/stores/${storeId}/toggle-status`);
            // تحديث القائمة محلياً بعد التغيير
            setStores(stores.map(s => s._id === storeId ? { ...s, isActive: !s.isActive } : s));
        } catch (err) {
            alert("فشل في تغيير حالة المتجر");
        }
    };

    const filteredStores = stores.filter(store => 
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.subRegion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 text-white animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Store className="text-primary" /> إدارة المتاجر
                    </h1>
                    <p className="text-gray-400 mt-1">يمكنك تفعيل، إيقاف، أو مراجعة كافة المتاجر المشتركة.</p>
                </div>
                
                <div className="relative">
                    <Search className="absolute right-3 top-3 text-gray-500" size={20} />
                    <input 
                        type="text" 
                        placeholder="ابحث عن متجر أو منطقة..." 
                        className="bg-gray-800 border border-gray-700 rounded-lg px-10 py-2.5 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
                <table className="w-full text-right">
                    <thead className="bg-gray-900/50 border-b border-gray-700 text-gray-400 text-sm">
                        <tr>
                            <th className="px-6 py-4 font-semibold">المتجر</th>
                            <th className="px-6 py-4 font-semibold">المالك</th>
                            <th className="px-6 py-4 font-semibold">الموقع</th>
                            <th className="px-6 py-4 font-semibold">الحالة</th>
                            <th className="px-6 py-4 font-semibold text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-10">جاري تحميل البيانات...</td></tr>
                        ) : filteredStores.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-10">لا توجد متاجر مطابقة للبحث</td></tr>
                        ) : filteredStores.map((store) => (
                            <tr key={store._id} className="hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-gray-600 rounded-lg flex items-center justify-center font-bold">
                                            {store.logo ? <img src={store.logo} alt="" className="rounded-lg" /> : store.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold">{store.name}</p>
                                            <p className="text-xs text-gray-400">{store.category}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm">{store.owner?.name || 'غير معروف'}</p>
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <Phone size={12} /> {store.phone}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex items-center gap-1">
                                        <MapPin size={14} className="text-primary" />
                                        {store.region} - {store.subRegion}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {store.isActive ? (
                                        <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                            <CheckCircle size={12} /> نشط
                                        </span>
                                    ) : (
                                        <span className="bg-red-900/30 text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                            <XCircle size={12} /> متوقف
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => handleToggleStatus(store._id)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                                store.isActive 
                                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                        >
                                            {store.isActive ? 'إيقاف المتجر' : 'تفعيل الآن'}
                                        </button>
                                        <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors">
                                            <ExternalLink size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Stores;
