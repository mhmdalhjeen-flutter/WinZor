import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { Layers, Plus, Pencil, Trash2, X, Loader2, CornerDownLeft } from 'lucide-react';
import { queryKeys } from '../lib/queryClient';
import { unwrapList } from '../utils/unwrapList';
import LightLoadingHint from '../shared/LightLoadingHint';

const EMPTY = { name: '', icon: '', description: '', parent: '', type: 'store', isActive: true };

const Categories = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: queryKeys.adminCategories,
    queryFn: async () => {
      const { data } = await axios.get('/categories?all=true');
      return unwrapList(data, ['categories']);
    },
    staleTime: 60 * 1000,
  });

  const refreshCategories = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminCategories });
  };

  // ترتيب هرمي للعرض: الجذور ثم أبناؤها بمسافة بادئة.
  const buildOrdered = () => {
    const byParent = {};
    categories.forEach((c) => {
      const p = c.parent || 'root';
      (byParent[p] = byParent[p] || []).push(c);
    });
    const out = [];
    const walk = (parentId, depth) => {
      (byParent[parentId] || [])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach((c) => {
          out.push({ ...c, depth });
          walk(c._id, depth + 1);
        });
    };
    walk('root', 0);
    return out;
  };

  const nameById = (id) => categories.find((c) => c._id === id)?.name || '—';

  const openCreate = (parent = '') => {
    setEditingId(null);
    setForm({ ...EMPTY, parent });
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditingId(cat._id);
    setForm({
      name: cat.name || '',
      icon: cat.icon || '',
      description: cat.description || '',
      parent: cat.parent || '',
      type: cat.type || 'store',
      isActive: cat.isActive !== false,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, parent: form.parent || null };
      if (editingId) await axios.put(`/categories/${editingId}`, payload);
      else await axios.post('/categories', payload);
      setShowModal(false);
      await refreshCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر حفظ التصنيف');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('حذف هذا التصنيف؟')) return;
    try {
      await axios.delete(`/categories/${id}`);
      await refreshCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر حذف التصنيف');
    }
  };

  const ordered = buildOrdered();

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div className="admin-title">
          <h1>التصنيفات الهرمية</h1>
          <p>أنشئ تصنيفات متعدّدة المستويات للمتاجر والمنتجات (مثال: ملابس ← أطفال ← رجالي)</p>
        </div>
        <button className="btn-primary" onClick={() => openCreate('')}>
          <Plus size={20} /> تصنيف جديد
        </button>
      </div>

      {isLoading && categories.length === 0 && (
        <LightLoadingHint label="جاري تحميل التصنيفات..." />
      )}

      {!isLoading && error && <div className="admin-card text-danger text-center">{error}</div>}

      {!isLoading && !error && ordered.length === 0 && (
        <div className="admin-card text-center text-muted py-12">لا توجد تصنيفات بعد.</div>
      )}

      {!isLoading && !error && ordered.length > 0 && (
        <div className="admin-card p-0 overflow-hidden">
          {ordered.map((cat) => (
            <div
              key={cat._id}
              className="flex items-center justify-between px-5 py-3 border-b border-border-color/40 hover:bg-dark/30"
            >
              <div className="flex items-center gap-3" style={{ paddingRight: `${cat.depth * 24}px` }}>
                {cat.depth > 0 && <CornerDownLeft size={14} className="text-muted/50" />}
                <span className="text-xl">{cat.icon || '📁'}</span>
                <div>
                  <span className="font-bold">{cat.name}</span>
                  {!cat.isActive && <span className="badge badge-danger mr-2">معطّل</span>}
                  <div className="text-[11px] text-muted">
                    {cat.parent ? `ضمن: ${nameById(cat.parent)}` : 'مستوى أعلى'} · {cat.type === 'store' ? 'متاجر' : 'منتجات'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openCreate(cat._id)} title="إضافة فرعي"
                  className="icon-action-btn text-secondary"><Plus size={16} /></button>
                <button onClick={() => openEdit(cat)} title="تعديل"
                  className="icon-action-btn"><Pencil size={16} /></button>
                <button onClick={() => handleDelete(cat._id)} title="حذف"
                  className="icon-action-btn text-danger"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border-color rounded-3xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingId ? 'تعديل تصنيف' : 'تصنيف جديد'}</h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">الاسم *</label>
                <input name="name" value={form.name} onChange={handleChange} required className="admin-input w-full" placeholder="مثال: ملابس" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">الأيقونة (إيموجي)</label>
                  <input name="icon" value={form.icon} onChange={handleChange} className="admin-input w-full" placeholder="👕" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">النوع</label>
                  <select name="type" value={form.type} onChange={handleChange} className="admin-input w-full">
                    <option value="store">متاجر</option>
                    <option value="product">منتجات</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">التصنيف الأب (للهرمية)</label>
                <select name="parent" value={form.parent} onChange={handleChange} className="admin-input w-full">
                  <option value="">— بدون (مستوى أعلى) —</option>
                  {categories
                    .filter((c) => c._id !== editingId)
                    .map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">الوصف</label>
                <input name="description" value={form.description} onChange={handleChange} className="admin-input w-full" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                <span className="text-sm font-bold">مُفعّل</span>
              </label>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="animate-spin" size={18} /> : (editingId ? 'حفظ' : 'إنشاء')}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-dark hover:bg-border-color rounded-xl font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
