import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Lightbulb, Loader2, Check, Archive } from 'lucide-react';

const UserSuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [newCount, setNewCount] = useState(0);
  const [filter, setFilter] = useState('new');
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/admin/suggestions', { params: { status: filter } });
      setSuggestions(data.suggestions || []);
      setNewCount(data.newCount ?? 0);
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر التحميل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/admin/suggestions/${id}`, { status });
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل التحديث');
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div className="admin-title">
          <h1>اقتراحات المستخدمين</h1>
          <p>رسائل واقتراحات تصل مباشرة من مركز المستخدم</p>
        </div>
        {newCount > 0 && (
          <span className="bg-amber-500/20 text-amber-400 px-4 py-2 rounded-full text-sm font-bold">
            {newCount} جديد
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { id: 'new', label: 'جديد' },
          { id: 'read', label: 'مقروء' },
          { id: 'archived', label: 'مؤرشف' },
          { id: 'all', label: 'الكل' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${filter === f.id ? 'bg-primary text-white' : 'bg-dark text-muted hover:text-white'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
          {suggestions.map((s) => (
            <div key={s._id} className="admin-card p-5 space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
                    <Lightbulb size={20} />
                  </div>
                  <div>
                    <p className="font-bold">{s.user?.name || 'مستخدم'}</p>
                    <p className="text-xs text-muted">{s.user?.email} · {s.user?.phone}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  s.status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                  s.status === 'read' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {s.status === 'new' ? 'جديد' : s.status === 'read' ? 'مقروء' : 'مؤرشف'}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{s.message}</p>
              <p className="text-[10px] text-muted">{new Date(s.createdAt).toLocaleString('ar')}</p>
              <div className="flex gap-2">
                {s.status === 'new' && (
                  <button type="button" onClick={() => updateStatus(s._id, 'read')} className="btn-secondary text-xs flex items-center gap-1">
                    <Check size={14} /> مقروء
                  </button>
                )}
                {s.status !== 'archived' && (
                  <button type="button" onClick={() => updateStatus(s._id, 'archived')} className="text-xs flex items-center gap-1 text-muted hover:text-white">
                    <Archive size={14} /> أرشفة
                  </button>
                )}
              </div>
            </div>
          ))}
          {!loading && !suggestions.length && <p className="text-center text-muted py-16">لا توجد اقتراحات</p>}
        </div>
    </div>
  );
};

export default UserSuggestions;
