import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Trophy, Plus, Pencil, Trash2, X, Loader2, GripVertical } from 'lucide-react';

const EMPTY = {
  name: '',
  description: '',
  icon: '🏆',
  image: '',
  pointsRequired: 20,
  sortOrder: 0,
  isActive: true,
};

const AchievementManagement = () => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/admin/achievements');
      setMilestones(data.milestones || []);
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر التحميل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY, sortOrder: milestones.length + 1 });
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditingId(m._id);
    setForm({
      name: m.name || '',
      description: m.description || '',
      icon: m.icon || '🏆',
      image: m.image || '',
      pointsRequired: m.pointsRequired ?? 0,
      sortOrder: m.sortOrder ?? 0,
      isActive: m.isActive !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        pointsRequired: Number(form.pointsRequired) || 0,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editingId) {
        await axios.put(`/admin/achievements/${editingId}`, payload);
      } else {
        await axios.post('/admin/achievements', payload);
      }
      setShowModal(false);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('حذف هذه الجائزة؟')) return;
    try {
      await axios.delete(`/admin/achievements/${id}`);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل الحذف');
    }
  };

  const moveUp = async (idx) => {
    if (idx <= 0) return;
    const ordered = [...milestones];
    [ordered[idx - 1], ordered[idx]] = [ordered[idx], ordered[idx - 1]];
    setMilestones(ordered);
    try {
      await axios.patch('/admin/achievements/reorder', {
        orderedIds: ordered.map((m) => m._id),
      });
    } catch {
      fetchAll();
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div className="admin-title">
          <h1>مسار الإنجازات</h1>
          <p>حدّد الجوائز على مسار النقاط — الاسم، الأيقونة، الصورة، وعدد النقاط المطلوبة</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus size={20} /> جائزة جديدة
        </button>
      </div>

      <div className="space-y-3">
          {milestones.map((m, idx) => (
            <div key={m._id} className="admin-card flex items-center gap-4 p-4">
              <button type="button" onClick={() => moveUp(idx)} className="text-muted hover:text-white" title="أعلى">
                <GripVertical size={18} />
              </button>
              <span className="text-2xl">{m.image ? <img src={m.image} alt="" className="w-10 h-10 object-contain" /> : m.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{m.name}</p>
                <p className="text-xs text-muted">{m.pointsRequired} نقطة · ترتيب {m.sortOrder}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${m.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {m.isActive ? 'نشط' : 'معطّل'}
              </span>
              <button type="button" onClick={() => openEdit(m)} className="p-2 hover:bg-dark rounded-lg"><Pencil size={16} /></button>
              <button type="button" onClick={() => handleDelete(m._id)} className="p-2 hover:bg-danger/20 text-danger rounded-lg"><Trash2 size={16} /></button>
            </div>
          ))}
          {!milestones.length && <p className="text-center text-muted py-12">لا توجد جوائز — أضف أول جائزة على المسار</p>}
        </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-card border border-border-color rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingId ? 'تعديل جائزة' : 'جائزة جديدة'}</h2>
              <button type="button" onClick={() => setShowModal(false)}><X size={22} /></button>
            </div>
            <input className="admin-input" placeholder="اسم الجائزة *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <textarea className="admin-input" placeholder="الوصف" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <input className="admin-input" placeholder="أيقونة (emoji)" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} />
              <input className="admin-input" type="number" placeholder="النقاط المطلوبة" value={form.pointsRequired} onChange={(e) => setForm((f) => ({ ...f, pointsRequired: e.target.value }))} />
            </div>
            <input className="admin-input" placeholder="رابط الصورة (اختياري)" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <input className="admin-input" type="number" placeholder="الترتيب" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                نشط
              </label>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
              {saving ? <Loader2 className="animate-spin" size={18} /> : 'حفظ'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AchievementManagement;
