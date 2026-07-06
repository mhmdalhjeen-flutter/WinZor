import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import {
  Trophy, Plus, Calendar, Users, MapPin, Coins,
  Star, Pencil, Trash2, X, Loader2, Link2, Gift, FileSpreadsheet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { queryKeys } from '../lib/queryClient';
import { unwrapList } from '../utils/unwrapList';
import LightLoadingHint from '../shared/LightLoadingHint';

const EMPTY_FORM = {
  title: '',
  description: '',
  image: '',
  prizeName: '',
  prizeImage: '',
  drawLink: '',
  minPoints: 0,
  pointsPerEntry: 100,
  requiredParticipants: 0,
  location: '',
  startDate: '',
  endDate: '',
  status: 'active',
  isFeatured: false,
};

// تحويل تاريخ ISO إلى صيغة input datetime-local
const toLocalInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const Competitions = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { data: competitions = [], isLoading, refetch } = useQuery({
    queryKey: queryKeys.adminCompetitions,
    queryFn: async () => {
      const { data } = await axios.get('/competitions/admin/all');
      return unwrapList(data, ['competitions']);
    },
    staleTime: 60 * 1000,
  });

  const refreshCompetitions = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminCompetitions });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (comp) => {
    setEditingId(comp._id);
    setForm({
      title: comp.title || '',
      description: comp.description || '',
      image: comp.image || '',
      prizeName: comp.prizeName || '',
      prizeImage: comp.prizeImage || '',
      drawLink: comp.drawLink || '',
      minPoints: comp.minPoints ?? 0,
      pointsPerEntry: comp.pointsPerEntry ?? 100,
      requiredParticipants: comp.requiredParticipants ?? 0,
      location: comp.location || '',
      startDate: toLocalInput(comp.startDate),
      endDate: toLocalInput(comp.endDate),
      status: comp.status || 'active',
      isFeatured: !!comp.isFeatured,
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
      const payload = {
        ...form,
        minPoints: Number(form.minPoints) || 0,
        pointsPerEntry: Number(form.pointsPerEntry) || 1,
        requiredParticipants: Number(form.requiredParticipants) || 0,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      if (editingId) {
        await axios.put(`/competitions/${editingId}`, payload);
      } else {
        await axios.post('/competitions', payload);
      }
      setShowModal(false);
      await refreshCompetitions();
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر حفظ المسابقة');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المسابقة؟')) return;
    try {
      await axios.delete(`/competitions/${id}`);
      await refreshCompetitions();
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر حذف المسابقة');
    }
  };

  const handleFeature = async (id) => {
    try {
      await axios.patch(`/competitions/${id}/feature`);
      await refreshCompetitions();
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر تعيين المسابقة الرئيسية');
    }
  };

  const statusLabel = (s) =>
    s === 'active' ? 'قيد التشغيل' : s === 'draft' ? 'مسودّة' : 'انتهت';

  const displayStatusLabel = (comp) =>
    statusLabel(comp.displayStatus || comp.status);

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div className="admin-title">
          <h1>إدارة المسابقات</h1>
          <p>أنشئ المسابقات القائمة على النقاط، وحدّد المسابقة الرئيسية المعروضة في الصفحة الرئيسية</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={20} /> مسابقة جديدة
        </button>
      </div>

      {isLoading && competitions.length === 0 && (
        <LightLoadingHint label="جاري تحميل المسابقات..." />
      )}

      {!isLoading && error && (
        <div className="admin-card text-danger font-bold text-center">{error}</div>
      )}

      {!isLoading && !error && competitions.length === 0 && (
        <div className="admin-card text-center text-muted py-12">
          لا توجد مسابقات بعد. أنشئ أول مسابقة.
        </div>
      )}

      {!isLoading && !error && competitions.length > 0 && (
        <>
          <div className="admin-card overflow-x-auto mb-8">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <FileSpreadsheet size={18} /> نظرة عامة على المسابقات
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-color text-muted">
                  <th className="text-right py-2 px-2">المسابقة</th>
                  <th className="text-right py-2 px-2">المشاركون</th>
                  <th className="text-right py-2 px-2">المشاركات</th>
                  <th className="text-right py-2 px-2">البداية</th>
                  <th className="text-right py-2 px-2">النهاية</th>
                  <th className="text-right py-2 px-2">الحالة</th>
                  <th className="text-right py-2 px-2">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {competitions.map((comp) => (
                  <tr key={comp._id} className="border-b border-border-color/50 hover:bg-dark/30">
                    <td className="py-2 px-2 font-bold">{comp.title}</td>
                    <td className="py-2 px-2">{comp.participantsCount ?? 0}</td>
                    <td className="py-2 px-2">{comp.totalParticipations ?? comp.totalEntries ?? 0}</td>
                    <td className="py-2 px-2">{comp.startDate ? new Date(comp.startDate).toLocaleDateString('ar') : '—'}</td>
                    <td className="py-2 px-2">{comp.endDate ? new Date(comp.endDate).toLocaleDateString('ar') : '—'}</td>
                    <td className="py-2 px-2">
                      <span className="badge">{displayStatusLabel(comp)}</span>
                    </td>
                    <td className="py-2 px-2">
                      <Link
                        to={`/competitions/${comp._id}/participants`}
                        className="text-secondary hover:underline font-bold text-xs"
                      >
                        المشاركون ←
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((comp) => (
            <div key={comp._id} className="admin-card group relative">
              {comp.isFeatured && (
                <span className="absolute top-4 left-4 badge badge-warning flex items-center gap-1">
                  <Star size={14} fill="currentColor" /> رئيسية
                </span>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-secondary/10 text-secondary rounded-2xl">
                  <Trophy size={24} />
                </div>
                <span className="badge">{displayStatusLabel(comp)}</span>
              </div>

              <h3 className="text-xl font-bold mb-1 line-clamp-1">{comp.title}</h3>
              <p className="text-muted text-sm mb-4 line-clamp-2 min-h-[40px]">
                {comp.description || 'بدون وصف'}
              </p>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted flex items-center gap-2"><Users size={16} /> المشاركون</span>
                  <span className="font-bold">{comp.participantsCount} / {comp.requiredParticipants || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted flex items-center gap-2"><Users size={16} /> إجمالي المشاركات</span>
                  <span className="font-bold">{comp.totalParticipations ?? comp.totalEntries ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted flex items-center gap-2"><Coins size={16} /> نقاط/مشاركة</span>
                  <span className="font-bold">{comp.pointsPerEntry}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted flex items-center gap-2"><Coins size={16} /> حد أدنى للنقاط</span>
                  <span className="font-bold">{comp.minPoints}</span>
                </div>
                {comp.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-2"><MapPin size={16} /> المكان</span>
                    <span className="font-bold line-clamp-1">{comp.location}</span>
                  </div>
                )}
                {comp.endDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-2"><Calendar size={16} /> الانتهاء</span>
                    <span className="font-bold">{new Date(comp.endDate).toLocaleDateString('ar')}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border-color flex flex-wrap gap-2">
                <Link
                  to={`/competitions/${comp._id}/participants`}
                  className="flex-1 py-2 bg-secondary/10 text-secondary hover:bg-secondary hover:text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1 min-w-[120px]"
                >
                  <Users size={16} /> المشاركون
                </Link>
                {!comp.isFeatured && (
                  <button
                    onClick={() => handleFeature(comp._id)}
                    title="تعيين كمسابقة رئيسية"
                    className="flex-1 py-2 bg-warning/10 text-warning hover:bg-warning hover:text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <Star size={16} /> رئيسية
                  </button>
                )}
                <button
                  onClick={() => openEdit(comp)}
                  className="flex-1 py-2 bg-dark hover:bg-border-color rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Pencil size={16} /> تعديل
                </button>
                <button
                  onClick={() => handleDelete(comp._id)}
                  className="py-2 px-3 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-xl text-sm font-bold transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border-color rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingId ? 'تعديل مسابقة' : 'مسابقة جديدة'}</h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">العنوان *</label>
                <input name="title" value={form.title} onChange={handleChange} required
                  className="admin-input w-full" placeholder="مثال: سحب على 1000 شيكل" />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">الوصف</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                  className="admin-input w-full" placeholder="وصف مختصر للمسابقة" />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">رابط صورة المسابقة</label>
                <input name="image" value={form.image} onChange={handleChange}
                  className="admin-input w-full" placeholder="https://..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-dark/40 rounded-2xl border border-border-color">
                <div className="md:col-span-2 flex items-center gap-2 text-sm font-bold text-warning">
                  <Gift size={16} /> الجائزة وربط السحب (يظهر بعد انتهاء المسابقة)
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">اسم الجائزة</label>
                  <input name="prizeName" value={form.prizeName} onChange={handleChange}
                    className="admin-input w-full" placeholder="مثال: iPhone 15" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">رابط صورة الجائزة</label>
                  <input name="prizeImage" value={form.prizeImage} onChange={handleChange}
                    className="admin-input w-full" placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold mb-1 flex items-center gap-1">
                    <Link2 size={14} /> رابط السحب / البث / النتيجة
                  </label>
                  <input name="drawLink" value={form.drawLink} onChange={handleChange}
                    className="admin-input w-full" placeholder="https://youtube.com/... أو رابط البث المباشر" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">الحد الأدنى للنقاط</label>
                  <input type="number" name="minPoints" value={form.minPoints} onChange={handleChange} min={0}
                    className="admin-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">نقاط لكل مشاركة *</label>
                  <input type="number" name="pointsPerEntry" value={form.pointsPerEntry} onChange={handleChange} min={1}
                    className="admin-input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">عدد المشاركين المطلوب</label>
                  <input type="number" name="requiredParticipants" value={form.requiredParticipants} onChange={handleChange} min={0}
                    className="admin-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">المكان</label>
                  <input name="location" value={form.location} onChange={handleChange}
                    className="admin-input w-full" placeholder="مثال: غزة" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">تاريخ البداية</label>
                  <input type="datetime-local" name="startDate" value={form.startDate} onChange={handleChange}
                    className="admin-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">تاريخ النهاية</label>
                  <input type="datetime-local" name="endDate" value={form.endDate} onChange={handleChange}
                    className="admin-input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-sm font-bold mb-1">الحالة</label>
                  <select name="status" value={form.status} onChange={handleChange} className="admin-input w-full">
                    <option value="active">نشطة</option>
                    <option value="draft">مسودّة</option>
                    <option value="ended">منتهية</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 mt-6 cursor-pointer">
                  <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} />
                  <span className="text-sm font-bold">مسابقة رئيسية (الصفحة الرئيسية)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="animate-spin" size={18} /> : (editingId ? 'حفظ التعديلات' : 'إنشاء المسابقة')}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-dark hover:bg-border-color rounded-xl font-bold transition-all">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Competitions;
