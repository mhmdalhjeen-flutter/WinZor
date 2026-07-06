import React, { useEffect, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import axios from '../api/axios';
import { Activity, Clock, User, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import AuditFiltersBar, { EMPTY_AUDIT_FILTERS } from '../components/audit/AuditFiltersBar';
import AuditDetailModal from '../components/audit/AuditDetailModal';
import { formatDateTime, formatRelativeTime, OPERATION_LABELS, SEVERITY_LABELS } from '../utils/auditFormat';
import { queryKeys } from '../lib/queryClient';
import LightLoadingHint from '../shared/LightLoadingHint';
import '../style/activity.css';

const ActivityPage = () => {
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState(EMPTY_AUDIT_FILTERS);
  const [applied, setApplied] = useState(EMPTY_AUDIT_FILTERS);
  const [filterOptions, setFilterOptions] = useState({});
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminActivity({ applied, page }),
    queryFn: async () => {
      const { data: res } = await axios.get('/admin/audit/activity', {
        params: { ...applied, page, limit: 30 },
      });
      return {
        items: res.items || [],
        pages: res.pages || 1,
        total: res.total || 0,
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const logs = data?.items ?? [];
  const pages = data?.pages ?? 1;
  const total = data?.total ?? 0;

  useEffect(() => {
    axios.get('/admin/audit/filters').then(({ data }) => setFilterOptions(data)).catch(() => {});
  }, []);

  const applyFilters = () => {
    setApplied(filters);
    setPage(1);
  };

  const resetFilters = () => {
    setApplied(EMPTY_AUDIT_FILTERS);
    setPage(1);
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const response = await axios.get('/admin/audit/export', {
        params: { ...applied, format, type: 'activity' },
        responseType: 'blob',
      });
      const ext = format === 'xlsx' ? 'xlsx' : format === 'csv' ? 'csv' : 'html';
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-log-${Date.now()}.${ext}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'فشل التصدير');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="admin-page-container" dir="rtl">
      <div className="admin-header">
        <div className="admin-title">
          <h1>سجل نشاط الأدمن</h1>
          <p>مراجعة كل عملية إدارية — من نفّذها، ماذا تغيّر، ومتى</p>
        </div>
        <div className="text-xs text-muted font-bold">
          {total.toLocaleString('ar')} سجل — للقراءة فقط
        </div>
      </div>

      <AuditFiltersBar
        filters={filters}
        onChange={setFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        filterOptions={filterOptions}
        onExport={handleExport}
        exporting={exporting}
      />

      <div className="admin-card">
        {isLoading && logs.length === 0 && (
          <LightLoadingHint label="جاري تحميل السجل..." />
        )}

        {!isLoading && logs.length === 0 ? (
          <p className="text-center text-muted py-12 font-bold">لا توجد سجلات مطابقة</p>
        ) : (
          <div className="activity-timeline">
            {logs.map((log) => (
              <div key={log._id} className="activity-log-item">
                <div className={`activity-icon icon-${log.severity || 'info'}`}>
                  <Activity size={20} />
                </div>
                <div className="activity-content flex-1">
                  <div className="activity-header">
                    <span className="activity-user flex items-center gap-1">
                      <User size={14} /> {log.adminName || log.user?.name || '—'}
                    </span>
                    <span className="activity-time flex items-center gap-1" title={formatDateTime(log.createdAt)}>
                      <Clock size={12} /> {formatRelativeTime(log.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <p className="activity-message">
                      <span className="text-white font-bold">{log.action}</span>
                      {log.entityName && <> — <span className="text-secondary">{log.entityName}</span></>}
                      {log.operationType && (
                        <span className="text-muted text-xs mr-2">({OPERATION_LABELS[log.operationType] || log.operationType})</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`severity-tag bg-${log.severity || 'info'}/10 text-${log.severity === 'info' ? 'secondary' : log.severity}`}>
                        {SEVERITY_LABELS[log.severity] || log.severity}
                      </span>
                      <button type="button" className="icon-action-btn" onClick={() => setSelected(log)} title="عرض التفاصيل">
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                  {(log.oldValues != null || log.newValues != null) && (
                    <p className="text-[11px] text-muted mt-1 truncate">
                      {log.oldValues != null && <>قديم: {JSON.stringify(log.oldValues)} </>}
                      {log.newValues != null && <>→ جديد: {JSON.stringify(log.newValues)}</>}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-border-color/30">
            <button type="button" disabled={page <= 1} className="icon-action-btn" onClick={() => setPage((p) => p - 1)}>
              <ChevronRight size={18} />
            </button>
            <span className="text-sm font-bold text-muted">صفحة {page} / {pages}</span>
            <button type="button" disabled={page >= pages} className="icon-action-btn" onClick={() => setPage((p) => p + 1)}>
              <ChevronLeft size={18} />
            </button>
          </div>
        )}
      </div>

      <AuditDetailModal log={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default ActivityPage;
