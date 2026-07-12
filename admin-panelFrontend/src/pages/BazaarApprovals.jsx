import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import {
  ShoppingBag, CheckCircle, XCircle, Loader2, Eye, Trash2, MapPin, Phone, Tag,
} from 'lucide-react';
import { formatListingPrice } from '../utils/currency';

const TYPE_LABELS = { sell: 'بيع', buy: 'شراء', exchange: 'بدل', custom: 'حسب الطلب' };
const CONDITION_LABELS = { new: 'جديد', used: 'مستعمل' };

export default function BazaarApprovals() {
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectNote, setRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/admin/bazaar', { params: { status: filter } });
      setListings(data.listings || []);
      setPendingCount(data.counts?.pending ?? 0);
    } catch {
      showToast('تعذّر التحميل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, [filter]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const { data } = await axios.get(`/admin/bazaar/${id}`);
      setSelected(data.listing);
      setRejectNote('');
    } catch {
      showToast('تعذّر فتح التفاصيل');
    } finally {
      setDetailLoading(false);
    }
  };

  const approve = async (id) => {
    setActionLoading(true);
    try {
      await axios.patch(`/admin/bazaar/${id}/approve`, {});
      showToast('تم قبول الإعلان');
      setSelected(null);
      fetchList();
    } catch (err) {
      showToast(err.response?.data?.message || 'فشل القبول');
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async (id) => {
    setActionLoading(true);
    try {
      await axios.patch(`/admin/bazaar/${id}/reject`, { note: rejectNote || 'مرفوض من الإدارة' });
      showToast('تم الرفض واسترداد النقاط');
      setSelected(null);
      fetchList();
    } catch (err) {
      showToast(err.response?.data?.message || 'فشل الرفض');
    } finally {
      setActionLoading(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('حذف الإعلان نهائياً؟')) return;
    try {
      await axios.delete(`/admin/bazaar/${id}`);
      showToast('تم الحذف');
      setSelected(null);
      fetchList();
    } catch (err) {
      showToast(err.response?.data?.message || 'تعذّر الحذف');
    }
  };

  const regionLabel = (l) =>
    [l.regionId?.name, l.subRegionId?.name].filter(Boolean).join('، ') || '—';

  return (
    <div className="admin-page-container space-y-6" dir="rtl">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="text-primary" /> موافقة إعلانات «اعرض غراضك»
          </h1>
          <p className="text-sm text-muted mt-1">إعلانات الزبائن — منفصلة عن عروض المتاجر</p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-amber-500/20 text-amber-400 px-4 py-2 rounded-xl text-sm font-black">
            {pendingCount} بانتظار الموافقة
          </span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'pending', label: 'بانتظار الموافقة' },
          { value: 'approved', label: 'مقبولة' },
          { value: 'rejected', label: 'مرفوضة' },
          { value: 'expired', label: 'منتهية' },
          { value: 'all', label: 'الكل' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              filter === tab.value ? 'bg-primary text-white' : 'bg-card text-muted border border-border-color'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!loading && listings.length === 0 ? (
        <div className="admin-card p-12 text-center text-muted font-bold">لا إعلانات في هذا القسم</div>
      ) : (
        <div className="grid gap-4">
          {listings.map((item) => (
            <div key={item._id} className="admin-card p-4 flex flex-wrap gap-4 items-center">
              <img
                src={item.images?.[item.mainImageIndex || 0] || item.images?.[0]}
                alt=""
                className="w-24 h-24 rounded-xl object-cover bg-dark shrink-0"
              />
              <div className="flex-1 min-w-[200px]">
                <h3 className="font-black text-white">{item.title}</h3>
                <p className="text-primary font-black text-sm mt-1">
                  {formatListingPrice(item)}
                </p>
                <p className="text-xs text-muted mt-1">
                  {item.seller?.name} — {regionLabel(item)}
                </p>
                <span className="inline-block mt-2 text-[10px] font-black px-2 py-0.5 rounded-full bg-dark text-muted">
                  {item.status}
                </span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => openDetail(item._id)} className="btn-secondary text-sm flex items-center gap-1">
                  <Eye size={16} /> تفاصيل
                </button>
                {item.status === 'pending' && (
                  <>
                    <button type="button" onClick={() => approve(item._id)} className="btn-primary text-sm flex items-center gap-1">
                      <CheckCircle size={16} /> قبول
                    </button>
                    <button
                      type="button"
                      onClick={() => { openDetail(item._id); setRejectNote(''); }}
                      className="text-sm px-4 py-2 rounded-xl bg-red-500/20 text-red-400 font-bold flex items-center gap-1"
                    >
                      <XCircle size={16} /> رفض
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(selected || detailLoading) && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => !detailLoading && setSelected(null)}>
          <div className="admin-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            {detailLoading || !selected ? null : (
              <>
                <h2 className="text-xl font-black text-white">{selected.title}</h2>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {(selected.images || []).map((img, i) => (
                    <img key={i} src={img} alt="" className="w-32 h-32 rounded-xl object-cover shrink-0" />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-dark p-3 rounded-xl"><span className="text-muted block text-xs">السعر</span>{formatListingPrice(selected)}</div>
                  <div className="bg-dark p-3 rounded-xl"><span className="text-muted block text-xs">الحالة</span>{CONDITION_LABELS[selected.condition]}</div>
                  <div className="bg-dark p-3 rounded-xl"><span className="text-muted block text-xs">النوع</span>{TYPE_LABELS[selected.transactionType]}</div>
                  <div className="bg-dark p-3 rounded-xl"><span className="text-muted block text-xs">التوصيل</span>{selected.freeDelivery ? 'مجاني' : 'لا'}</div>
                </div>

                <p className="text-muted text-sm flex items-center gap-1"><MapPin size={14} /> {regionLabel(selected)}</p>
                <p className="text-muted text-sm flex items-center gap-1"><Phone size={14} /> {selected.contactPhone}</p>
                <p className="text-muted text-sm">البائع: {selected.seller?.name} ({selected.seller?.email || selected.seller?.phone})</p>

                {selected.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selected.keywords.map((k) => (
                      <span key={k} className="text-xs bg-dark px-2 py-1 rounded-full text-muted flex items-center gap-1"><Tag size={10} />{k}</span>
                    ))}
                  </div>
                )}

                {selected.description && (
                  <p className="text-sm text-white/80 leading-relaxed">{selected.description}</p>
                )}

                {selected.status === 'pending' && (
                  <div className="space-y-2">
                    <input
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="سبب الرفض (اختياري)"
                      className="admin-input w-full"
                    />
                    <div className="flex gap-2 flex-wrap">
                      <button type="button" disabled={actionLoading} onClick={() => approve(selected._id)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                        <CheckCircle size={18} /> قبول
                      </button>
                      <button type="button" disabled={actionLoading} onClick={() => reject(selected._id)} className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 font-black flex items-center justify-center gap-2">
                        <XCircle size={18} /> رفض
                      </button>
                    </div>
                  </div>
                )}

                <button type="button" onClick={() => remove(selected._id)} className="text-red-400 text-sm font-bold flex items-center gap-1">
                  <Trash2 size={14} /> حذف نهائي
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
