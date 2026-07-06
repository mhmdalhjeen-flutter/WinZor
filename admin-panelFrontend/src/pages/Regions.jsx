import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '../api/axios';
import {
  MapPin, Plus, Pencil, Trash2, X, Loader2,
  ChevronUp, ChevronDown, Layers, CornerDownLeft
} from 'lucide-react';
import '../style/admin-catalog.css';

const EMPTY = { name: '', parent: '', isActive: true };

const LEVEL_META = [
  { label: 'رئيسية', badge: 'badge-level-main', icon: MapPin, iconSize: 20 },
  { label: 'فرعية', badge: 'badge-level-sub', icon: Layers, iconSize: 17 },
  { label: 'تفصيلية', badge: 'badge-level-deep', icon: CornerDownLeft, iconSize: 15 },
  { label: 'فرع إضافي', badge: 'badge-level-extra', icon: CornerDownLeft, iconSize: 14 },
];

function countTree(nodes) {
  let total = 0;
  let active = 0;
  const byLevel = [0, 0, 0, 0];

  const walk = (list, depth) => {
    list.forEach((n) => {
      total += 1;
      if (n.isActive !== false) active += 1;
      const li = Math.min(depth, byLevel.length - 1);
      byLevel[li] += 1;
      if (n.children?.length) walk(n.children, depth + 1);
    });
  };
  walk(nodes, 0);
  return { total, active, byLevel, mainCount: byLevel[0], subCount: total - byLevel[0] };
}

function RegionNode({
  region,
  depth,
  index,
  siblings,
  parentName,
  onReorder,
  onCreate,
  onEdit,
  onDelete,
}) {
  const level = Math.min(depth, LEVEL_META.length - 1);
  const meta = LEVEL_META[level];
  const Icon = meta.icon;
  const children = region.children || [];

  return (
    <>
      <div className={`catalog-row region-row--level-${Math.min(depth, 3)}`}>
        <div className="catalog-row-main">
          <div className="catalog-row-icon">
            <Icon size={meta.iconSize} />
          </div>
          <div>
            <div className="catalog-row-title flex flex-wrap items-center gap-2">
              {region.name}
              <span className={`badge ${meta.badge}`}>{meta.label}</span>
              {!region.isActive && <span className="badge badge-danger">معطّل</span>}
            </div>
            <div className="catalog-row-meta">
              {depth === 0
                ? `${children.length} فرعية · ترتيب #${index + 1}`
                : `تحت: ${parentName}${children.length ? ` · ${children.length} فرع` : ''}`}
            </div>
          </div>
        </div>
        <div className="catalog-row-actions">
          <button type="button" onClick={() => onReorder(siblings, index, -1)} className="icon-action-btn" title="أعلى">
            <ChevronUp size={depth === 0 ? 16 : 14} />
          </button>
          <button type="button" onClick={() => onReorder(siblings, index, 1)} className="icon-action-btn" title="أسفل">
            <ChevronDown size={depth === 0 ? 16 : 14} />
          </button>
          <button type="button" onClick={() => onCreate(region._id)} className="icon-action-btn" title="إضافة فرع">
            <Plus size={depth === 0 ? 16 : 14} />
          </button>
          <button type="button" onClick={() => onEdit(region)} className="icon-action-btn" title="تعديل">
            <Pencil size={depth === 0 ? 16 : 14} />
          </button>
          <button type="button" onClick={() => onDelete(region._id)} className="icon-action-btn text-danger" title="حذف">
            <Trash2 size={depth === 0 ? 16 : 14} />
          </button>
        </div>
      </div>

      {children.map((child, ci) => (
        <RegionNode
          key={child._id}
          region={child}
          depth={depth + 1}
          index={ci}
          siblings={children}
          parentName={region.name}
          onReorder={onReorder}
          onCreate={onCreate}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

const Regions = () => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/regions?all=true&tree=true');
      setTree(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر تحميل المناطق');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  const stats = useMemo(() => countTree(tree), [tree]);

  const openCreate = (parentId = '') => {
    setEditingId(null);
    setForm({ ...EMPTY, parent: parentId });
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditingId(r._id);
    setForm({ name: r.name || '', parent: r.parent || '', isActive: r.isActive !== false });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, parent: form.parent || null, isActive: form.isActive };
      if (editingId) await axios.put(`/regions/${editingId}`, payload);
      else await axios.post('/regions', payload);
      setShowModal(false);
      await fetchTree();
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('حذف هذه المنطقة؟')) return;
    try {
      await axios.delete(`/regions/${id}`);
      await fetchTree();
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر الحذف');
    }
  };

  const reorder = async (siblings, index, dir) => {
    const swap = index + dir;
    if (swap < 0 || swap >= siblings.length) return;
    const orderedIds = siblings.map((s) => s._id);
    [orderedIds[index], orderedIds[swap]] = [orderedIds[swap], orderedIds[index]];
    try {
      await axios.patch('/regions/reorder', { orderedIds });
      await fetchTree();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل الترتيب');
    }
  };

  const modalTitle = editingId
    ? 'تعديل المنطقة'
    : form.parent
      ? 'منطقة فرعية جديدة'
      : 'منطقة رئيسية جديدة';

  return (
    <div className="admin-page-container" dir="rtl">
      <div className="admin-header flex-col gap-4 sm:flex-row">
        <div className="admin-title">
          <h1>إدارة المناطق</h1>
          <p>نظّم المناطق الرئيسية والفرعية — ترتيب العرض يظهر للزبائن في التطبيق</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => openCreate('')}>
          <Plus size={20} /> منطقة رئيسية
        </button>
      </div>

      <div className="catalog-help">
        <strong>كيف تعمل؟</strong> أضف <strong>منطقة رئيسية</strong>، ثم من زر <strong>+</strong> أضف
        <strong> فرعية</strong> تحتها، ويمكن إضافة <strong>مستوى تفصيلي</strong> أيضاً.
        <div className="region-legend">
          <span className="region-legend-item">
            <span className="region-legend-dot" style={{ background: '#6366f1' }} /> رئيسية — بنفسجي
          </span>
          <span className="region-legend-item">
            <span className="region-legend-dot" style={{ background: '#22c55e' }} /> فرعية — أخضر
          </span>
          <span className="region-legend-item">
            <span className="region-legend-dot" style={{ background: '#f59e0b' }} /> تفصيلية — برتقالي
          </span>
          <span className="region-legend-item">
            <span className="region-legend-dot" style={{ background: '#f43f5e' }} /> فرع إضافي — وردي
          </span>
        </div>
      </div>

      {!loading && !error && (
        <div className="catalog-stats">
          <div className="catalog-stat" style={{ '--accent': '#6366f1' }}>
            <div className="catalog-stat-value">{stats.mainCount}</div>
            <div className="catalog-stat-label">رئيسية</div>
          </div>
          <div className="catalog-stat" style={{ '--accent': '#22c55e' }}>
            <div className="catalog-stat-value">{stats.byLevel[1] || 0}</div>
            <div className="catalog-stat-label">فرعية</div>
          </div>
          <div className="catalog-stat" style={{ '--accent': '#f59e0b' }}>
            <div className="catalog-stat-value">{(stats.byLevel[2] || 0) + (stats.byLevel[3] || 0)}</div>
            <div className="catalog-stat-label">تفصيلية وأعمق</div>
          </div>
          <div className="catalog-stat" style={{ '--accent': '#4ade80' }}>
            <div className="catalog-stat-value">{stats.active}</div>
            <div className="catalog-stat-label">مُفعّلة</div>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="admin-card text-center text-danger">{error}</div>
      )}

      {!loading && !error && tree.length === 0 && (
        <div className="admin-card catalog-empty">
          <div className="catalog-empty-icon">🗺️</div>
          <p className="font-bold text-main mb-2">لا توجد مناطق بعد</p>
          <p className="text-sm">ابدأ بإضافة منطقة رئيسية ثم أضف المناطق الفرعية</p>
          <button type="button" className="btn-primary mx-auto mt-4" onClick={() => openCreate('')}>
            <Plus size={18} /> إضافة أول منطقة
          </button>
        </div>
      )}

      {!loading && !error && tree.length > 0 && (
        <div className="admin-card catalog-list p-0">
          {tree.map((main, mi) => (
            <RegionNode
              key={main._id}
              region={main}
              depth={0}
              index={mi}
              siblings={tree}
              parentName=""
              onReorder={reorder}
              onCreate={openCreate}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <div className="catalog-modal-overlay">
          <div className="catalog-modal">
            <div className="catalog-modal-header">
              <div>
                <h2>{modalTitle}</h2>
                <p>{form.parent ? 'تُضاف ضمن المنطقة المحددة' : 'منطقة مستوى أعلى في القائمة'}</p>
              </div>
              <button type="button" className="icon-action-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="catalog-form-group">
                <label className="catalog-form-label">اسم المنطقة *</label>
                <input
                  className="admin-input w-full"
                  placeholder="مثال: غزة — الرمال"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              {!editingId && !form.parent && (
                <div className="catalog-form-group">
                  <label className="catalog-form-label">أو أضفها كفرعية تحت</label>
                  <select
                    className="admin-input w-full"
                    value={form.parent}
                    onChange={(e) => setForm({ ...form, parent: e.target.value })}
                  >
                    <option value="">— منطقة رئيسية —</option>
                    {tree.map((r) => (
                      <option key={r._id} value={r._id}>فرعية تحت: {r.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <label className="catalog-form-check">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <span>مُفعّلة — تظهر للزبائن</span>
              </label>
              <div className="catalog-modal-actions">
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="animate-spin" size={18} /> : 'حفظ'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
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

export default Regions;