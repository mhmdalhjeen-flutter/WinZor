import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Ticket, Plus, Download, Store, CheckCircle, 
  History, AlertCircle, Coins, Hash
} from 'lucide-react';
import '../style/promo-codes.css';

const PromoCodes = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    
    const [selectedStore, setSelectedStore] = useState('');
    const [count, setCount] = useState(50);
    const [points, setPoints] = useState(10);
    const [entries, setEntries] = useState(1);
    const [batchName, setBatchName] = useState('');
    
    const [generatedCodes, setGeneratedCodes] = useState([]);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                // const response = await axios.get('/admin/stores');
                // setStores(response.data.filter(s => s.isActive));
                setStores([{ _id: '1', name: 'مطعم الطابون' }, { _id: '2', name: 'سوبر ماركت الهدى' }]);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchStores();
    }, []);

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div className="admin-title">
                    <h1>إدارة وتوليد الأكواد</h1>
                    <p>قم بإنتاج دفعات أكواد مطبوعة وربطها بالمتاجر والجوائز</p>
                </div>
            </div>

            <div className="promo-generation-grid">
                {/* نموذج التوليد */}
                <div className="generator-form-card">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Plus size={20} className="text-primary" /> توليد دفعة جديدة
                    </h2>
                    
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm text-muted mb-2">اختر المتجر المستهدف</label>
                            <select className="admin-input w-full">
                                <option value="">-- اختر متجر --</option>
                                {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-muted mb-2">كمية الأكواد المطلوبة</label>
                            <input type="number" className="admin-input w-full" defaultValue={50} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-muted mb-2">نقاط XP</label>
                                <input type="number" className="admin-input w-full" defaultValue={10} />
                            </div>
                            <div>
                                <label className="block text-sm text-muted mb-2">فرص السحب</label>
                                <input type="number" className="admin-input w-full" defaultValue={1} />
                            </div>
                        </div>

                        <button className="btn-primary w-full justify-center py-4 mt-4">
                            توليد الأكواد الآن
                        </button>
                    </form>
                </div>

                {/* عرض الأكواد */}
                <div className="codes-display-area">
                    <div className="codes-header">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <History size={20} className="text-secondary" /> الأكواد الناتجة
                        </h2>
                        {generatedCodes.length > 0 && (
                            <button className="btn-primary bg-success hover:bg-green-700 shadow-success/20">
                                <Download size={18} /> تصدير Excel
                            </button>
                        )}
                    </div>

                    {generatedCodes.length === 0 ? (
                        <div className="empty-codes-state">
                            <Ticket size={64} />
                            <p className="text-lg">لم يتم توليد أي أكواد في هذه الجلسة بعد</p>
                            <span className="text-sm text-muted text-center max-w-xs">استخدم النموذج الجانبي لتوليد الأكواد وستظهر هنا فوراً للطباعة أو التصدير</span>
                        </div>
                    ) : (
                        <div className="codes-grid">
                            {generatedCodes.map((c, i) => (
                                <div key={i} className="code-item">{c.code}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromoCodes;
