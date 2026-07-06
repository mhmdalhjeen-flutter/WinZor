import React from 'react';
import { Search, Download, FileSpreadsheet, FileText } from 'lucide-react';

const EMPTY = {
  search: '',
  from: '',
  to: '',
  operationType: '',
  entityType: '',
  adminId: '',
  severity: '',
};

export default function AuditFiltersBar({
  filters,
  onChange,
  onApply,
  onReset,
  filterOptions = {},
  showExport = true,
  onExport,
  exporting = false,
}) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="admin-card space-y-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="space-y-1">
          <span className="text-[11px] font-bold text-muted">بحث</span>
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="admin-input w-full pr-9"
              placeholder="عملية، أدمن، IP..."
              value={filters.search || ''}
              onChange={(e) => set('search', e.target.value)}
            />
          </div>
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-bold text-muted">من تاريخ</span>
          <input type="date" className="admin-input w-full" value={filters.from || ''} onChange={(e) => set('from', e.target.value)} />
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-bold text-muted">إلى تاريخ</span>
          <input type="date" className="admin-input w-full" value={filters.to || ''} onChange={(e) => set('to', e.target.value)} />
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-bold text-muted">نوع العملية</span>
          <select className="admin-input w-full" value={filters.operationType || ''} onChange={(e) => set('operationType', e.target.value)}>
            <option value="">الكل</option>
            {(filterOptions.operationTypes || []).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-bold text-muted">نوع الكيان</span>
          <select className="admin-input w-full" value={filters.entityType || ''} onChange={(e) => set('entityType', e.target.value)}>
            <option value="">الكل</option>
            {(filterOptions.entityTypes || []).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-bold text-muted">الأدمن</span>
          <select className="admin-input w-full" value={filters.adminId || ''} onChange={(e) => set('adminId', e.target.value)}>
            <option value="">الكل</option>
            {(filterOptions.admins || []).map((a) => (
              <option key={a._id} value={a._id}>{a.name || a.email}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-bold text-muted">الخطورة</span>
          <select className="admin-input w-full" value={filters.severity || ''} onChange={(e) => set('severity', e.target.value)}>
            <option value="">الكل</option>
            <option value="info">عادي</option>
            <option value="warning">تحذير</option>
            <option value="danger">خطر</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={onApply}>تطبيق الفلتر</button>
        <button type="button" className="admin-input px-4 py-2 font-bold" onClick={() => { onChange(EMPTY); onReset?.(); }}>إعادة ضبط</button>
        {showExport && (
          <>
            <button type="button" disabled={exporting} className="admin-input px-4 py-2 font-bold flex items-center gap-2" onClick={() => onExport('xlsx')}>
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button type="button" disabled={exporting} className="admin-input px-4 py-2 font-bold flex items-center gap-2" onClick={() => onExport('pdf')}>
              <FileText size={16} /> PDF
            </button>
            <button type="button" disabled={exporting} className="admin-input px-4 py-2 font-bold flex items-center gap-2" onClick={() => onExport('csv')}>
              <Download size={16} /> CSV
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export { EMPTY as EMPTY_AUDIT_FILTERS };
