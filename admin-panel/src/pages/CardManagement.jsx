import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { CreditCard, Plus, Trash2, CheckCircle, AlertCircle, Hash, Coins } from 'lucide-react';
import "../style/card-management.css"

const CardManagement = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        // محاكاة بيانات البطاقات
        setCards([
            { _id: '1', name: 'البطاقة الذهبية', color: '#facc15', pointsValue: 1000, description: 'بطاقة نادرة تعطي 1000 نقطة XP' },
            { _id: '2', name: 'البطاقة الفضية', color: '#94a3b8', pointsValue: 500, description: 'بطاقة متوسطة تعطي 500 نقطة XP' },
            { _id: '3', name: 'البطاقة البرونزية', color: '#b45309', pointsValue: 100, description: 'بطاقة شائعة تعطي 100 نقطة XP' },
        ]);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchCards();
  }, []);

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div className="admin-title">
          <h1>إدارة البطاقات الملونة</h1>
          <p>قم بإنشاء وتعديل أنواع البطاقات التي يجمعها الزبائن من الصناديق</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> إضافة نوع بطاقة جديد
        </button>
      </div>

      <div className="cards-grid">
        {cards.map(card => (
          <div key={card._id} className="physical-card-preview group">
            {/* لمعة البطاقة */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="flex justify-between items-start relative z-10">
                <div className="card-chip"></div>
                <div className="badge badge-success" style={{background: `${card.color}20`, color: card.color, borderColor: `${card.color}40`}}>
                    {card.pointsValue} XP
                </div>
            </div>

            <div className="relative z-10">
                <h3 className="card-number mb-2">{card.name}</h3>
                <p className="text-xs text-muted leading-relaxed max-w-[200px]">{card.description}</p>
            </div>

            <div className="card-footer relative z-10">
                <div className="card-holder">
                    <span className="block opacity-50 text-[10px]">القيمة النقطية</span>
                    <span className="font-bold text-white flex items-center gap-1"><Coins size={12}/> {card.pointsValue} نقطة</span>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 bg-dark/50 hover:bg-danger/20 rounded-lg text-danger transition-all">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardManagement;
