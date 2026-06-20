import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Gift, Plus, Trash2, Edit, ToggleLeft, ToggleRight, 
  CheckCircle, AlertCircle, Store, Tag, Coins, Ticket 
} from 'lucide-react';
import '../style/prizes.css';

const Prizes = () => {
    const [prizes, setPrizes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState(null);

    const [newPrize, setNewPrize] = useState({
        title: '', prizeType: 'points', value: '', store: '', isActive: true, probability: 1
    });

    const fetchPrizes = async () => {
        try {
            setPrizes([
                { _id: '1', title: '50 نقطة مجانية', prizeType: 'points', value: 50, isActive: true, probability: 1 },
                { _id: '2', title: 'كود خصم 20% - مطعم الطابون', prizeType: 'discount_code', value: 'TABON20', isActive: true, probability: 2 },
                { _id: '3', title: 'فرصة دخول إضافية', prizeType: 'entries', value: 1, isActive: false, probability: 1 }
            ]);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchPrizes(); }, []);

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div className="admin-title">
                    <h1>إدارة الجوائز</h1>
                    <p>تحكم في الهدايا اليومية وجوائز صندوق الكنز</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    <Plus size={20} /> إضافة جائزة جديدة
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <div className="prizes-grid">
                {prizes.map((prize) => (
                    <div key={prize._id} className="prize-card">
                        <div className="prize-card-header">
                            <div className={`prize-icon-wrapper prize-type-${prize.prizeType === 'points' ? 'points' : prize.prizeType === 'discount_code' ? 'discount' : 'entries'}`}>
                                {prize.prizeType === 'points' ? <Coins size={24} /> :
                                 prize.prizeType === 'discount_code' ? <Tag size={24} /> : <Ticket size={24} />}
                            </div>
                            <button className="bg-transparent border-none">
                                {prize.isActive ? 
                                    <ToggleRight className="text-success" size={32} /> : 
                                    <ToggleLeft className="text-muted" size={32} />
                                }
                            </button>
                        </div>

                        <h3 className="prize-title">{prize.title}</h3>
                        
                        <div className="prize-meta">
                            <span className="prize-badge">قيمة: {prize.value}</span>
                            <span className="prize-badge">ندرة: {prize.probability}</span>
                        </div>

                        <div className="prize-actions">
                            <button className="btn-prize-action btn-prize-edit">
                                <Edit size={14} /> تعديل
                            </button>
                            <button className="btn-prize-action btn-prize-delete font-bold">
                                <Trash2 size={14} /> حذف
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal إضافة جائزة */}
            {showModal && (
                <div className="fixed inset-0 admin-modal-overlay flex items-center justify-center z-50 p-4" dir="rtl">
                    <div className="admin-modal-content w-full max-w-lg p-8">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Gift className="text-primary" /> إضافة جائزة جديدة
                        </h2>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm text-muted mb-2">اسم الجائزة</label>
                                <input type="text" className="admin-input w-full" placeholder="مثلاً: 50 نقطة XP" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-muted mb-2">نوع الجائزة</label>
                                    <select className="admin-input w-full">
                                        <option value="points">نقاط XP</option>
                                        <option value="discount_code">كود خصم</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-muted mb-2">القيمة</label>
                                    <input type="text" className="admin-input w-full" />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button className="btn-primary flex-1 justify-center">حفظ الجائزة</button>
                                <button onClick={() => setShowModal(false)} className="flex-1 bg-dark text-white rounded-xl font-bold">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Prizes;
