import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import {
  ArrowRight, Users, Download, Trash2, Loader2, RefreshCw, Trophy,
} from 'lucide-react';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('ar');
};

const statusLabel = (s) => {
  if (s === 'ended') return 'انتهت';
  if (s === 'draft') return 'مسودّة';
  return 'قيد التشغيل';
};

export default function CompetitionParticipants() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [totalParticipations, setTotalParticipations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`/competitions/admin/${id}/participants`);
      setCompetition(data.competition);
      setParticipants(data.participants || []);
      setTotalParticipations(data.totalParticipations || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر تحميل المشاركين');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`/competitions/admin/${id}/participants/export`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants-${competition?.title || id}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر تصدير الملف');
    } finally {
      setExporting(false);
    }
  };

  const handleClear = async () => {
    const msg = `هل أنت متأكد من تفريغ جميع المشاركين في مسابقة "${competition?.title}"؟\n\nسيتم حذف جميع المشاركات فقط — ولن تُحذف المسابقة أو إعداداتها.`;
    if (!window.confirm(msg)) return;
    setClearing(true);
    try {
      await axios.delete(`/competitions/admin/${id}/participants`);
      await load();
      alert('تم تفريغ المشاركين بنجاح');
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر تفريغ المشاركين');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div className="admin-title">
          <button
            type="button"
            onClick={() => navigate('/competitions')}
            className="text-muted hover:text-white flex items-center gap-1 text-sm mb-2"
          >
            <ArrowRight size={16} /> العودة للمسابقات
          </button>
          <h1 className="flex items-center gap-2">
            <Users size={28} className="text-secondary" />
            مشاركو المسابقة
          </h1>
          {competition && (
            <p className="text-muted">{competition.title}</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> تحديث
          </button>
          <button type="button" className="btn-primary" onClick={handleExport} disabled={exporting || !participants.length}>
            {exporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            تصدير إلى Excel
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={clearing || !participants.length}
            className="py-2 px-4 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {clearing ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
            تفريغ المشاركين
          </button>
        </div>
      </div>

      {!loading && error && (
        <div className="admin-card text-danger font-bold text-center">{error}</div>
      )}

      {!loading && !error && competition && (
        <>
          <div className="admin-card grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-muted text-sm">عدد المشاركين</p>
              <p className="text-2xl font-bold">{competition.participantsCount ?? 0}</p>
            </div>
            <div>
              <p className="text-muted text-sm">إجمالي المشاركات</p>
              <p className="text-2xl font-bold">{totalParticipations}</p>
            </div>
            <div>
              <p className="text-muted text-sm">الحالة</p>
              <p className="text-lg font-bold">{statusLabel(competition.displayStatus || competition.status)}</p>
            </div>
            <div>
              <p className="text-muted text-sm">تاريخ الانتهاء</p>
              <p className="text-sm font-bold">{formatDate(competition.endDate)}</p>
            </div>
          </div>

          {participants.length === 0 ? (
            <div className="admin-card text-center text-muted py-16">
              <Trophy size={40} className="mx-auto mb-3 opacity-40" />
              لا يوجد مشاركون بعد
            </div>
          ) : (
            <div className="admin-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-color text-muted">
                    <th className="text-right py-3 px-2">#</th>
                    <th className="text-right py-3 px-2">اسم المشارك</th>
                    <th className="text-right py-3 px-2">الهاتف / البريد</th>
                    <th className="text-right py-3 px-2">عدد المشاركات</th>
                    <th className="text-right py-3 px-2">أول مشاركة</th>
                    <th className="text-right py-3 px-2">آخر مشاركة</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p, i) => (
                    <tr key={p.userId || i} className="border-b border-border-color/50 hover:bg-dark/50">
                      <td className="py-3 px-2 text-muted">{i + 1}</td>
                      <td className="py-3 px-2 font-bold">{p.name}</td>
                      <td className="py-3 px-2" dir="ltr">{p.contact}</td>
                      <td className="py-3 px-2 font-bold text-secondary">{p.entriesCount}</td>
                      <td className="py-3 px-2">{formatDate(p.firstJoinedAt)}</td>
                      <td className="py-3 px-2">{formatDate(p.lastJoinedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
