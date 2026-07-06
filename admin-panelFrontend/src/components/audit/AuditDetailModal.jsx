import React from 'react';
import { X } from 'lucide-react';
import { formatDateTime, OPERATION_LABELS, SEVERITY_LABELS, CATEGORY_LABELS } from '../../utils/auditFormat';

function ValueBlock({ label, value }) {
  if (value == null || value === '') return null;
  const text = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-bold text-muted uppercase">{label}</p>
      <pre className="text-xs bg-dark/40 border border-border-color/40 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap font-mono text-white/90">
        {text}
      </pre>
    </div>
  );
}

export default function AuditDetailModal({ log, onClose }) {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70" dir="rtl">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto admin-card shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white">تفاصيل السجل</h2>
          <button type="button" onClick={onClose} className="icon-action-btn" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div><span className="text-muted">العملية:</span> <strong>{log.action}</strong></div>
          <div><span className="text-muted">التاريخ:</span> {formatDateTime(log.createdAt)}</div>
          <div><span className="text-muted">الأدمن:</span> {log.adminName || log.user?.name || '—'}</div>
          <div><span className="text-muted">البريد:</span> {log.adminEmail || log.user?.email || '—'}</div>
          <div><span className="text-muted">الفئة:</span> {CATEGORY_LABELS[log.category] || log.category || '—'}</div>
          <div><span className="text-muted">النوع:</span> {OPERATION_LABELS[log.operationType] || log.operationType || '—'}</div>
          <div><span className="text-muted">الكيان:</span> {log.entityType || '—'}</div>
          <div><span className="text-muted">العنصر:</span> {log.entityName || '—'}</div>
          <div><span className="text-muted">المعرف:</span> <code className="text-xs">{log.entityId || '—'}</code></div>
          <div><span className="text-muted">الصفحة:</span> {log.page || '—'}</div>
          <div><span className="text-muted">IP:</span> <code className="text-xs">{log.ipAddress || '—'}</code></div>
          <div><span className="text-muted">الخطورة:</span> {SEVERITY_LABELS[log.severity] || log.severity}</div>
          <div><span className="text-muted">الجهاز:</span> {log.device || '—'}</div>
          <div><span className="text-muted">المتصفح:</span> {log.browser || '—'}</div>
          <div><span className="text-muted">النظام:</span> {log.os || '—'}</div>
          <div><span className="text-muted">الموقع:</span> {log.location || '—'}</div>
          <div><span className="text-muted">الحالة:</span> {log.success === false ? 'فاشل' : 'ناجح'}</div>
        </div>

        <p className="text-sm text-white/80 mb-4">{log.details}</p>
        {log.failureReason && (
          <p className="text-sm text-danger mb-4">سبب الفشل: {log.failureReason}</p>
        )}

        <div className="space-y-4">
          <ValueBlock label="القيم القديمة" value={log.oldValues} />
          <ValueBlock label="القيم الجديدة" value={log.newValues} />
        </div>

        <p className="text-[10px] text-muted mt-6 border-t border-border-color/30 pt-3">
          هذا السجل مرجع أمني — غير قابل للتعديل أو الحذف
        </p>
      </div>
    </div>
  );
}
