import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import {
  Package, Plus, Trash2, Link as LinkIcon, 
  CheckCircle, AlertCircle, Store, Eye, Gift
} from 'lucide-react';
import '../style/box-management.css';

const BoxManagement = () => {
  const [boxes, setBoxes] = useState([]);
  const [stores, setStores] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // محاكاة بيانات
        setBoxes([
            { _id: '1', title: 'صندوق الجمعة البيضاء', description: 'يحتوي على بطاقات خصم عالية', store: { name: 'مطعم الطابون' }, requirements: { followLink: 'fb.com/tabon' }, rewards: [{}, {}] },
            { _id: '2', title: 'صندوق المتابعين الجدد', description: 'هدية لكل من يتابع صفحتنا', store: null, requirements: { followLink: '' }, rewards: [{}] }
        ]);
        setStores([{ _id: 's1', name: 'مطعم الطابون' }]);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div className="admin-title">
          <h1>إدارة صناديق الكنز</h1>
          <p>قم بإنشاء حملات ترويجية للمتاجر عبر صناديق الهدايا التفاعلية</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> إنشاء صندوق جديد
        </button>
      </div>

      <div className="boxes-grid">
        {boxes.map(box => (
          <div key={box._id} className="treasure-box-card group">
            <div className="box-visual">🎁</div>
            <h3 className="box-title">{box.title}</h3>
            <span className="box-price text-sm text-secondary">
              {box.store ? `برعاية: ${box.store.name}` : 'صندوق عام من المنصة'}
            </span>
            
            <div className="box-content-list">
                <div className="content-item">
                    <span className="flex items-center gap-1"><Gift size={14}/> الجوائز</span>
                    <span>{box.rewards.length} بطاقات</span>
                </div>
                {box.requirements.followLink && (
                    <div className="content-item">
                        <span className="flex items-center gap-1"><LinkIcon size={14}/> المتطلب</span>
                        <span className="text-primary font-bold">متابعة الرابط</span>
                    </div>
                )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-border-color/50">
              <button className="flex-1 py-2 bg-dark hover:bg-border-color rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                <Eye size={14} /> استعراض
              </button>
              <button className="p-2 text-danger hover:bg-danger/10 rounded-xl transition-all">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Modal - سيعمل بنفس نظام المودال في Prizes */}
    </div>
  );
};

export default BoxManagement;
