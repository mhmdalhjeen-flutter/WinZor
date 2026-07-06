import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from '../api/axios';
import SensitiveGate from '../components/SensitiveGate';
import WheelPreview from '../components/WheelPreview';
import {
  Plus, Trash2, Edit, Save, X, Loader2, Eye, ToggleLeft, ToggleRight, Sparkles,
} from 'lucide-react';

const EMPTY = {
  name: '',
  description: '',
  icon: '🎁',
  image: '',
  color: '#6366f1',
  minPoints: 0,
  displayWeight: 10,
  winWeight: 0,
  prizeType: 'item',
  prizeValue: 0,
  isActive: true,
  sortOrder: 0,
};

const DEFAULTS = [
  { name: 'حظ أوفر', description: 'لا جائزة هذه المرة', icon: '😔', color: '#94a3b8', minPoints: 0, displayWeight: 40, winWeight: 50, prizeType: 'none', prizeValue: 0, isActive: true, sortOrder: 0 },
  { name: '10 نقاط', description: 'نقاط إضافية', icon: '⭐', color: '#f59e0b', minPoints: 0, displayWeight: 30, winWeight: 30, prizeType: 'points', prizeValue: 10, isActive: true, sortOrder: 1 },
  { name: 'جائزة متوسطة', description: 'هدية من المتجر', icon: '🎁', color: '#8b5cf6', minPoints: 50, displayWeight: 20, winWeight: 15, prizeType: 'item', prizeValue: 0, isActive: true, sortOrder: 2 },
  { name: 'جائزة VIP', description: 'جائزة كبرى', icon: '👑', color: '#ec4899', minPoints: 200, displayWeight: 10, winWeight: 5, prizeType: 'item', prizeValue: 0, isActive: true, sortOrder: 3 },
];

const WheelManagementContent = () => {
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState('');

  const fetchPrizes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/admin/wheel/prizes');
      setPrizes(data.prizes || []);
    } catch (err) {
      setMsg(err.response?.data?.message || 'تعذّر تحميل الجوائز');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrizes(); }, [fetchPrizes]);

  const previewSegments = useMemo(
    () => prizes.filter((p) => p.isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [prizes],
  );

  const displayTotal = previewSegments.reduce((s, p) => s + (Number(p.displayWeight) || 0), 0);
  const winTotal = previewSegments.reduce((s, p) => s + (Number(p.winWeight) || 0), 0);

  const openCreate = () => {
    setForm({ ...EMPTY, sortOrder: prizes.length });
    setModal('create');
  };

  const openEdit = (p) => {
    setForm({ ...EMPTY, ...p, image: p.image || '' });
    setModal(p._id);
  };

  const closeModal = () => {
    setModal(null);
    setForm(EMPTY);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const payload = { ...form, image: form.image || null };
      if (modal === 'create') {
        await axios.post('/admin/wheel/prizes', payload);
        setMsg('تمت إضافة الجائزة');
      } else {
        await axios.put(`/admin/wheel/prizes/${modal}`, payload);
        setMsg('تم التحديث');
      }
      closeModal();
      fetchPrizes();
    } catch (err) {
      setMsg(err.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('حذف هذه الجائزة؟')) return;
    try {
      await axios.delete(`/admin/wheel/prizes/${id}`);
      fetchPrizes();
    } catch (err) {
      setMsg(err.response?.data?.message || 'فشل الحذف');
    }
  };

  const toggleActive = async (p) => {
    try {
      await axios.put(`/admin/wheel/prizes/${p._id}`, { isActive: !p.isActive });
      fetchPrizes();
    } catch (err) {
      setMsg(err.response?.data?.message || 'فشل التحديث');
    }
  };

  const seedDefaults = async () => {
    if (!window.confirm('إنشاء جوائز افتراضية؟ (لن يحذف الموجود)')) return;
    setSaving(true);
    try {
      for (const d of DEFAULTS) {
        await axios.post('/admin/wheel/prizes', d);
      }
      setMsg('تم إنشاء الجوائز الافتراضية');
      fetchPrizes();
    } catch (err) {
      setMsg(err.response?.data?.message || 'فشل الإنشاء');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page-container" dir="rtl">
      <div className="admin-header">
        <div className="admin-title">
          <h1>إدارة عجلة الحظ</h1>
          <p>الجوائز، نسب الظهور، نسب الفوز، ومعاينة مباشرة</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {prizes.length === 0 && (
            <button type="button" onClick={seedDefaults} disabled={saving} className="px-4 py-2 rounded-xl border border-primary/40 text-primary font-bold text-sm hover:bg-primary/10">
              <Sparkles size={18} /> جوائز افتراضية
            </button>
          )}
          <button type="button" onClick={openCreate} className="btn-primary">
            <Plus size={20} /> جائزة جديدة
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 mb-4 rounded-xl bg-primary/10 text-primary text-sm font-bold border border-primary/20">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Live preview */}
        <div className="admin-card p-6 xl:col-span-1 space-y-4 sticky top-28 h-fit">
          <div className="flex items-center gap-2 text-white font-black">
            <Eye size={18} className="text-primary" />
            معاينة مباشرة
          </div>
          <div className="flex justify-center py-4">
            <WheelPreview segments={previewSegments} size={240} />
          </div>
          <div className="text-xs text-muted space-y-1">
            <p>مجموع الظهور: <strong className="text-white">{displayTotal}</strong></p>
            <p>مجموع الفوز: <strong className="text-white">{winTotal}</strong></p>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {previewSegments.map((seg) => (
              <div key={seg._id} className="flex items-center gap-2 p-2 rounded-lg bg-dark/40">
                <div className="w-4 h-4 rounded shrink-0" style={{ background: seg.color }} />
                <span>{seg.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{seg.name}</p>
                  <p className="text-[10px] text-muted">
                    ظهور {seg.displayWeight}% · فوز {seg.winWeight}%
                    {seg.minPoints > 0 ? ` · من ${seg.minPoints} نقطة` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prize list */}
        <div className="xl:col-span-2 space-y-4">
          {prizes.length === 0 ? (
            <div className="admin-card p-10 text-center text-muted">
              لا توجد جوائز — أضف جوائز أو استخدم القالب الافتراضي
            </div>
          ) : (
            prizes.map((p) => (
              <div key={p._id} className="admin-card p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-3 h-14 rounded-full shrink-0" style={{ background: p.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl">{p.icon}</span>
                    <h3 className="font-black text-white">{p.name}</h3>
                    {!p.isActive && <span className="text-[10px] bg-muted/20 px-2 py-0.5 rounded text-muted">معطّلة</span>}
                  </div>
                  <p className="text-xs text-muted mt-1 line-clamp-2">{p.description || '—'}</p>
                  <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-bold">
                    <span className="bg-dark px-2 py-1 rounded text-amber-400">ظهور: {p.displayWeight}</span>
                    <span className="bg-dark px-2 py-1 rounded text-green-400">فوز: {p.winWeight}</span>
                    <span className="bg-dark px-2 py-1 rounded text-blue-400">حد: {p.minPoints} نقطة</span>
                    <span className="bg-dark px-2 py-1 rounded text-purple-400">{p.prizeType}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => toggleActive(p)} className="p-2 rounded-lg bg-dark/50 hover:bg-dark">
                    {p.isActive ? <ToggleRight className="text-success" size={28} /> : <ToggleLeft className="text-muted" size={28} />}
                  </button>
                  <button type="button" onClick={() => openEdit(p)} className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30">
                    <Edit size={18} />
                  </button>
                  <button type="button" onClick={() => handleDelete(p._id)} className="p-2 rounded-lg bg-danger/20 text-danger hover:bg-danger/30">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="admin-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-white">{modal === 'create' ? 'جائزة جديدة' : 'تعديل جائزة'}</h2>
              <button type="button" onClick={closeModal}><X className="text-muted" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 text-right">
                <span className="text-xs text-muted">الاسم</span>
                <input className="admin-input w-full mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label className="col-span-2 text-right">
                <span className="text-xs text-muted">الوصف</span>
                <textarea className="admin-input w-full mt-1" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              <label className="text-right">
                <span className="text-xs text-muted">الأيقونة</span>
                <input className="admin-input w-full mt-1" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
              </label>
              <label className="text-right">
                <span className="text-xs text-muted">اللون</span>
                <input type="color" className="admin-input w-full mt-1 h-10 p-1" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </label>
              <label className="col-span-2 text-right">
                <span className="text-xs text-muted">رابط الصورة (اختياري)</span>
                <input className="admin-input w-full mt-1" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
              </label>
              <label className="text-right">
                <span className="text-xs text-muted">نسبة الظهور</span>
                <input type="number" min={0} className="admin-input w-full mt-1" value={form.displayWeight} onChange={(e) => setForm({ ...form, displayWeight: Number(e.target.value) })} />
              </label>
              <label className="text-right">
                <span className="text-xs text-muted">نسبة الفوز</span>
                <input type="number" min={0} className="admin-input w-full mt-1" value={form.winWeight} onChange={(e) => setForm({ ...form, winWeight: Number(e.target.value) })} />
              </label>
              <label className="text-right">
                <span className="text-xs text-muted">حد أدنى للنقاط</span>
                <input type="number" min={0} className="admin-input w-full mt-1" value={form.minPoints} onChange={(e) => setForm({ ...form, minPoints: Number(e.target.value) })} />
              </label>
              <label className="text-right">
                <span className="text-xs text-muted">نوع الجائزة</span>
                <select className="admin-input w-full mt-1" value={form.prizeType} onChange={(e) => setForm({ ...form, prizeType: e.target.value })}>
                  <option value="none">لا جائزة (حظ أوفر)</option>
                  <option value="points">نقاط</option>
                  <option value="entries">فرص</option>
                  <option value="item">جائزة مادية</option>
                </select>
              </label>
              <label className="text-right">
                <span className="text-xs text-muted">قيمة الجائزة</span>
                <input type="number" min={0} className="admin-input w-full mt-1" value={form.prizeValue} onChange={(e) => setForm({ ...form, prizeValue: Number(e.target.value) })} />
              </label>
              <label className="text-right">
                <span className="text-xs text-muted">ترتيب</span>
                <input type="number" className="admin-input w-full mt-1" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </label>
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              حفظ
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const WheelManagement = () => (
  <SensitiveGate title="إدارة عجلة الحظ">
    <WheelManagementContent />
  </SensitiveGate>
);

export default WheelManagement;
