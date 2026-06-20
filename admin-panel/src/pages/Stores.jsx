import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Store, Plus, Search, Edit, Trash2, CheckCircle, 
  XCircle, ExternalLink, MapPin, Tag 
} from 'lucide-react';
import '../style/stores.css';

const Stores = () => {
    const [stores, setStores] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchStores = async () => {
        try {
            // const response = await axios.get('/admin/stores');
            // setStores(response.data);
            setStores([
                { _id: '1', name: 'مطعم الطابون', category: 'مطاعم', status: 'active', owner: 'أحمد علي', city: 'نابلس', logo: 'ط' },
                { _id: '2', name: 'سوبر ماركت الهدى', category: 'تسوق', status: 'inactive', owner: 'محمد خالد', city: 'رام الله', logo: 'هـ' },
                { _id: '3', name: 'مجوهرات الأماني', category: 'ذهب', status: 'active', owner: 'ياسر حسن', city: 'الخليل', logo: 'أ' },
            ]);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchStores(); }, []);

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div className="admin-title">
                    <h1>إدارة المتاجر والشركاء</h1>
                    <p>أضف، عدّل، أو تحكم في حالة المتاجر المشتركة في المنصة</p>
                </div>
                <button className="btn-primary">
                    <Plus size={20} /> إضافة متجر جديد
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="search-wrapper" style={{maxWidth: '500px'}}>
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="ابحث عن متجر بالاسم، المدينة، أو التصنيف..." 
                        className="admin-input w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select className="admin-input">
                        <option>كل التصنيفات</option>
                        <option>مطاعم</option>
                        <option>تسوق</option>
                    </select>
                </div>
            </div>

            <div className="stores-grid">
                {stores.map((store) => (
                    <div key={store._id} className="store-card">
                        <div className="status-toggle">
                            <span className={`badge ${store.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                {store.status === 'active' ? 'نشط' : 'متوقف'}
                            </span>
                        </div>
                        
                        <div className="store-card-header">
                            <div className="store-logo-wrapper">
                                {store.logo}
                            </div>
                            <div className="store-info">
                                <h3>{store.name}</h3>
                                <p className="flex items-center gap-1"><MapPin size={12} /> {store.city}</p>
                            </div>
                        </div>

                        <div className="store-card-body">
                            <div className="store-stats">
                                <div className="stat-item">
                                    <span className="label">التصنيف</span>
                                    <span className="value flex items-center justify-center gap-1"><Tag size={12} /> {store.category}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="label">المالك</span>
                                    <span className="value">{store.owner}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-muted mb-4">
                                <CheckCircle size={14} className="text-success" />
                                <span>موثق من قبل الإدارة</span>
                            </div>
                        </div>

                        <div className="store-actions">
                            <button className="btn-edit flex items-center justify-center gap-2">
                                <Edit size={14} /> تعديل
                            </button>
                            <button className="icon-action-btn" title="حذف">
                                <Trash2 size={16} className="text-danger" />
                            </button>
                            <button className="icon-action-btn" title="زيارة">
                                <ExternalLink size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Stores;
