import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import LightLoadingHint from '../shared/LightLoadingHint';

const STATUS_OPTIONS = [
  { value: '', label: 'كل الحالات' },
  { value: 'pending', label: 'بانتظار التأكيد' },
  { value: 'store_accepted', label: 'تم قبول المتجر' },
  { value: 'preparing', label: 'قيد التحضير' },
  { value: 'delivered_to_driver', label: 'تم التسليم للسائق' },
  { value: 'delivered_to_customer', label: 'تم التسليم للزبون' },
  { value: 'rejected', label: 'مرفوض' },
  { value: 'cancelled', label: 'ملغى' },
];

function exportCsv(orders) {
  const headers = ['orderNumber', 'store', 'customer', 'total', 'status', 'createdAt'];
  const rows = orders.map(o => [
    o.orderNumber || o._id,
    o.store?.name || '',
    o.customer?.name || '',
    o.total,
    o.status,
    o.createdAt,
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OrderHistory() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [storeId, setStoreId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detail, setDetail] = useState(null);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (search.trim()) p.set('q', search.trim());
    if (status) p.set('status', status);
    if (storeId.trim()) p.set('storeId', storeId.trim());
    if (customerId.trim()) p.set('customerId', customerId.trim());
    if (dateFrom) p.set('from', dateFrom);
    if (dateTo) p.set('to', dateTo);
    p.set('limit', '500');
    return p.toString();
  }, [search, status, storeId, customerId, dateFrom, dateTo]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['adminOrderHistory', params],
    queryFn: async () => {
      const res = await axios.get(`/orders/admin/history?${params}`);
      return res.data;
    },
    staleTime: 30 * 1000,
  });

  const orders = data?.orders || [];

  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleString('ar-EG') : '—';

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>سجل الطلبات</h1>
        <button type="button" onClick={() => exportCsv(orders)} style={{ padding: '10px 16px', borderRadius: 10, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700 }}>
          تصدير CSV
        </button>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 20 }}>
        <input placeholder="بحث عام..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid #e5e7eb' }} />
        <input placeholder="معرّف المتجر" value={storeId} onChange={(e) => setStoreId(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid #e5e7eb' }} />
        <input placeholder="معرّف الزبون" value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid #e5e7eb' }} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
          {STATUS_OPTIONS.map(o => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: 10, borderRadius: 10 }} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: 10, borderRadius: 10 }} />
        <button type="button" onClick={() => refetch()} style={{ padding: 10, borderRadius: 10, background: '#111827', color: '#fff', border: 'none' }}>بحث</button>
      </div>

      {isLoading && <LightLoadingHint label="جاري تحميل الطلبات..." />}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل السجل</p>}

      <div style={{ display: 'grid', gap: 12 }}>
        {orders.map(order => (
          <div key={order._id} style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 900 }}>{order.store?.name || 'متجر'} — {order.customer?.name || 'زبون'}</div>
                <div style={{ color: '#6b7280', fontSize: 13 }}>{order.orderNumber || order._id.slice(-8)} · {formatDate(order.createdAt)}</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 900, color: '#6366f1' }}>{order.total} ₪</div>
                <div style={{ fontSize: 12 }}>{order.status}</div>
              </div>
            </div>
            <button type="button" onClick={() => setDetail(order)} style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb' }}>
              التفاصيل
            </button>
          </div>
        ))}
      </div>

      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setDetail(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 560, width: '92%', maxHeight: '85vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>تفاصيل الطلب</h2>
            <p><strong>المتجر:</strong> {detail.store?.name}</p>
            <p><strong>الزبون:</strong> {detail.customer?.name} ({detail.customer?.phone})</p>
            <p><strong>رقم الطلب:</strong> {detail.orderNumber || detail._id}</p>
            <p><strong>الحالة:</strong> {detail.status}</p>
            <p><strong>الإجمالي:</strong> {detail.total} ₪</p>
            <ul>
              {(detail.items || []).map((i, idx) => <li key={idx}>{i.name} ×{i.quantity}</li>)}
            </ul>
            {detail.customerNotes && <p><strong>ملاحظات الزبون:</strong> {detail.customerNotes}</p>}
            {detail.storeNotes && <p><strong>ملاحظات المتجر:</strong> {detail.storeNotes}</p>}
            <button type="button" onClick={() => setDetail(null)}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
