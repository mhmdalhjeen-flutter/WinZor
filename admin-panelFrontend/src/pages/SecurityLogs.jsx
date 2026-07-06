import React, { useCallback, useEffect, useState } from 'react';
import axios from '../api/axios';
import {
  ShieldAlert, ShieldCheck, Lock, Eye, AlertTriangle, Terminal,
  LogIn, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import AuditFiltersBar, { EMPTY_AUDIT_FILTERS } from '../components/audit/AuditFiltersBar';
import AuditDetailModal from '../components/audit/AuditDetailModal';
import { formatDateTime, formatRelativeTime, SEVERITY_LABELS } from '../utils/auditFormat';

const TABS = [
  { id: 'security', label: 'التنبيهات الأمنية', icon: ShieldAlert },
  { id: 'login', label: 'سجل الدخول', icon: LogIn },
];

const SecurityLogs = () => {
  const [tab, setTab] = useState('security');
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState(EMPTY_AUDIT_FILTERS);
  const [applied, setApplied] = useState(EMPTY_AUDIT_FILTERS);
  const [filterOptions, setFilterOptions] = useState({});
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axios.get('/admin/audit/filters').then(({ data }) => setFilterOptions(data)).catch(() => {});
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = tab === 'login' ? '/admin/audit/login' : '/admin/audit/security';
      const { data } = await axios.get(endpoint, {
        params: { ...applied, page, limit: 30 },
      });
      setLogs(data.items || []);
      setPages(data.pages || 1);
      if (data.stats) setStats(data.stats);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [applied, page, tab]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

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
      const type = tab === 'login' ? 'login' : 'security';
      const response = await axios.get('/admin/audit/export', {
        params: { ...applied, format, type },
        responseType: 'blob',
      });
      const ext = format === 'xlsx' ? 'xlsx' : format === 'csv' ? 'csv' : 'html';
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-log-${Date.now()}.${ext}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'فشل التصدير');
    } finally {
      setExporting(false);
    }
  };

  const severityIcon = (severity, success) => {
    if (success === false || severity === 'danger') return <Lock size={16} />;
    if (severity === 'warning') return <AlertTriangle size={16} />;
    return <ShieldCheck size={16} />;
  };

  return (
    <div className="admin-page-container" dir="rtl">
      <div className="admin-header">
        <div className="admin-title">
          <h1>مركز الأمان والمراقبة</h1>
          <p>من دخل؟ متى؟ ماذا حدث؟ — سجل تدقيق غير قابل للتلاعب</p>
        </div>
        <div className="flex gap-3">
          <div className="admin-card py-2 px-4 bg-success/5 border-success/20 flex items-center gap-2">
            <ShieldCheck size={18} className="text-success" />
            <span className="text-xs font-bold text-success">نظام التدقيق: نشط</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="admin-card text-center">
          <p className="text-muted text-xs mb-1">محاولات فاشلة (24س)</p>
          <h2 className="text-2xl font-bold text-danger">{stats?.failedLogins24h ?? '—'}</h2>
        </div>
        <div className="admin-card text-center">
          <p className="text-muted text-xs mb-1">IPs مشبوهة</p>
          <h2 className="text-2xl font-bold text-warning">{stats?.suspiciousIpCount ?? '—'}</h2>
        </div>
        <div className="admin-card text-center">
          <p className="text-muted text-xs mb-1">دخول ناجح (24س)</p>
          <h2 className="text-2xl font-bold text-secondary">{stats?.successfulLogins24h ?? '—'}</h2>
        </div>
        <div className="admin-card text-center">
          <p className="text-muted text-xs mb-1">تنبيهات أمنية (24س)</p>
          <h2 className="text-2xl font-bold text-primary">{stats?.securityAlerts24h ?? '—'}</h2>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${
              tab === id ? 'bg-primary text-white' : 'admin-input'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
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

      <div className="admin-table-wrapper">
        <div className="p-4 border-b border-border-color/50 bg-dark/20 flex items-center gap-2">
          <Terminal size={18} className="text-muted" />
          <span className="text-sm font-mono text-muted">
            {tab === 'login' ? 'admin_login_audit.log' : 'security_monitor.log'} — read-only
          </span>
        </div>

        {loading ? null : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>الحدث</th>
                <th>المسؤول</th>
                <th>IP / الجهاز</th>
                <th>الوقت</th>
                <th>الحالة</th>
                <th className="text-left">تفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-10 font-bold">لا توجد سجلات</td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        log.severity === 'danger' || log.success === false ? 'bg-danger/10 text-danger'
                          : log.severity === 'warning' ? 'bg-warning/10 text-warning'
                            : 'bg-secondary/10 text-secondary'
                      }`}>
                        {severityIcon(log.severity, log.success)}
                      </div>
                      <div>
                        <span className="font-bold block">{log.action}</span>
                        <span className="text-[11px] text-muted">{log.details}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-white font-bold block">{log.adminName || log.user?.name || '—'}</span>
                    <span className="text-xs text-muted">{log.adminEmail || log.user?.email || ''}</span>
                  </td>
                  <td>
                    <code className="text-xs bg-dark px-2 py-1 rounded border border-border-color block mb-1">{log.ipAddress || '—'}</code>
                    <span className="text-[10px] text-muted">{log.device} · {log.browser} · {log.os}</span>
                  </td>
                  <td>
                    <span className="text-xs text-muted block" title={formatDateTime(log.createdAt)}>
                      {formatRelativeTime(log.createdAt)}
                    </span>
                    <span className="text-[10px] text-muted">{log.location || ''}</span>
                  </td>
                  <td>
                    <span className={`text-xs font-bold ${log.success === false ? 'text-danger' : 'text-success'}`}>
                      {log.success === false ? 'فاشل' : 'ناجح'}
                    </span>
                    {log.failureReason && (
                      <span className="text-[10px] text-danger block">{log.failureReason}</span>
                    )}
                  </td>
                  <td className="text-left">
                    <button type="button" className="icon-action-btn" onClick={() => setSelected(log)}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 p-4 border-t border-border-color/30">
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

export default SecurityLogs;
