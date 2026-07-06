import React, { useCallback, useEffect, useState } from "react";
import axios from "../api/axios";
import {
  Copy,
  Trash2,
  Search,
  KeyRound,
  Store,
  Truck,
  Loader2,
  Download,
  Shield,
  Coins,
} from "lucide-react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import "../style/code-generator.css";

const CODE_TYPES = [
  { value: "merchant", label: "Merchant — تفعيل متاجر", icon: Store },
  { value: "admin", label: "Admin — نقاط للزبائن", icon: Shield },
];

const ROLE_OPTIONS = [
  { value: "store", label: "صاحب محل", icon: Store },
  { value: "supplier", label: "تاجر", icon: Truck },
];

const ROLE_LABELS = { store: "صاحب محل", supplier: "تاجر" };

const CodeGeneratorPage = () => {
  const [codeType, setCodeType] = useState("merchant");

  // ── Merchant (activation keys) ──
  const [role, setRole] = useState("store");
  const [keys, setKeys] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  // ── Admin codes ──
  const [adminCodes, setAdminCodes] = useState([]);
  const [adminSearch, setAdminSearch] = useState("");
  const debouncedAdminSearch = useDebouncedValue(adminSearch.trim(), 300);
  const [rewardPoints, setRewardPoints] = useState(10);
  const [bulkCount, setBulkCount] = useState(10);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/admin/activation-keys");
      setKeys(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.response?.data?.message || "تعذّر تحميل المفاتيح");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdminCodes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/admin/admin-codes");
      setAdminCodes(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.response?.data?.message || "تعذّر تحميل أكواد الأدمن");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (codeType === "merchant") fetchKeys();
    else fetchAdminCodes();
  }, [codeType, fetchKeys, fetchAdminCodes]);

  const createMerchantKey = async () => {
    setCreating(true);
    try {
      const { data } = await axios.post("/admin/create-code-business", { role });
      showToast(data.message || "تم إنشاء مفتاح التفعيل");
      await fetchKeys();
    } catch (err) {
      showToast(err.response?.data?.message || "فشل إنشاء المفتاح");
    } finally {
      setCreating(false);
    }
  };

  const createAdminCodes = async () => {
    setCreating(true);
    try {
      const { data } = await axios.post("/admin/admin-codes/generate", {
        count: bulkCount,
        rewardPoints,
      });
      showToast(data.message || "تم إنشاء أكواد الأدمن");
      await fetchAdminCodes();
    } catch (err) {
      showToast(err.response?.data?.message || "فشل إنشاء الأكواد");
    } finally {
      setCreating(false);
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    showToast("تم النسخ");
  };

  const deleteMerchantKey = async (id) => {
    if (!window.confirm("حذف هذا المفتاح؟")) return;
    try {
      await axios.delete(`/admin/activation-keys/${id}`);
      setKeys((prev) => prev.filter((k) => k._id !== id));
      showToast("تم الحذف");
    } catch (err) {
      showToast(err.response?.data?.message || "تعذّر الحذف");
    }
  };

  const deleteAdminCode = async (id) => {
    if (!window.confirm("حذف هذا الكود؟")) return;
    try {
      await axios.delete(`/admin/admin-codes/${id}`);
      setAdminCodes((prev) => prev.filter((c) => c._id !== id));
      showToast("تم الحذف");
    } catch (err) {
      showToast(err.response?.data?.message || "تعذّر الحذف");
    }
  };

  const exportAdminExcel = async () => {
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const rows = adminCodes.map((c) => ({
        code: c.code,
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "AdminCodes");
      XLSX.writeFile(wb, `admin-codes-${Date.now()}.xlsx`);
      showToast("تم تصدير Excel");
    } catch {
      showToast("تعذّر التصدير");
    } finally {
      setExporting(false);
    }
  };

  const filteredKeys = keys.filter((k) => {
    if (!debouncedSearch) return true;
    return (
      k.code?.toLowerCase().includes(debouncedSearch) ||
      k.prefix?.toLowerCase().includes(debouncedSearch) ||
      ROLE_LABELS[k.role]?.includes(debouncedSearch)
    );
  });

  const filteredAdmin = adminCodes.filter((c) => {
    if (!debouncedAdminSearch) return true;
    return c.code?.toLowerCase().includes(debouncedAdminSearch);
  });

  return (
    <div className="code-page admin-page-container">
      <div className="code-header">
        <h1>
          <KeyRound size={28} className="inline-block ml-2 align-middle text-primary" />
          توليد الأكواد
        </h1>
        <p>نوعان مستقلان: أكواد المتاجر (Merchant) وأكواد الأدمن (Admin)</p>
      </div>

      {/* نوع الكود */}
      <div className="card">
        <p className="text-sm text-muted mb-3">اختر نوع الكود</p>
        <div className="role-picker">
          {CODE_TYPES.map((opt) => {
            const Icon = opt.icon;
            const active = codeType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`role-option ${active ? "active" : ""}`}
                onClick={() => setCodeType(opt.value)}
              >
                <Icon size={20} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {codeType === "merchant" ? (
        <>
          <div className="card">
            <p className="text-sm text-muted mb-4">
              أكواد <strong className="text-white">Merchant</strong> — مفاتيح تفعيل حسابات أصحاب المحلات والتجار (بدون تغيير).
            </p>
            <div className="role-picker">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = role === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`role-option ${active ? "active" : ""}`}
                    onClick={() => setRole(opt.value)}
                  >
                    <Icon size={20} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="btn-primary mt-4 w-full sm:w-auto"
              onClick={createMerchantKey}
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 size={18} className="inline animate-spin ml-2" />
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء مفتاح Merchant"
              )}
            </button>
          </div>

          <div className="card actions-bar">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="w-full pr-10"
                placeholder="بحث بالمفتاح أو البصمة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="card table-card">
            {loading && filteredKeys.length === 0 ? (
              <p className="text-center py-10 text-muted">جاري التحميل...</p>
            ) : filteredKeys.length === 0 ? (
              <p className="text-center py-10 text-muted">لا توجد مفاتيح — أنشئ مفتاحاً جديداً</p>
            ) : (
              <table className="codes-table">
                <thead>
                  <tr>
                    <th>المفتاح</th>
                    <th>البصمة</th>
                    <th>النوع</th>
                    <th>الحالة</th>
                    <th>تاريخ الإنشاء</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeys.map((k) => (
                    <tr key={k._id}>
                      <td className="code-text font-mono">{k.code}</td>
                      <td><span className="prefix-badge">{k.prefix || "—"}</span></td>
                      <td>{ROLE_LABELS[k.role] || k.role}</td>
                      <td>{k.isUsed ? <span className="used">مستخدم</span> : <span className="free">متاح</span>}</td>
                      <td className="text-xs text-muted">
                        {k.createdAt ? new Date(k.createdAt).toLocaleDateString("ar") : "—"}
                      </td>
                      <td className="flex gap-2">
                        <button type="button" className="icon-btn" onClick={() => copyText(k.code)} title="نسخ">
                          <Copy size={16} />
                        </button>
                        {!k.isUsed && (
                          <button type="button" className="icon-btn text-red-400" onClick={() => deleteMerchantKey(k._id)} title="حذف">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="card">
            <p className="text-sm text-muted mb-4">
              أكواد <strong className="text-white">Admin</strong> — نقاط للزبائن، غير مرتبطة بأي متجر. الصيغة:{" "}
              <code className="text-emerald-400">ADM-XXXXXXXX</code>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <label className="block">
                <span className="text-sm font-bold text-muted flex items-center gap-1 mb-1">
                  <Coins size={14} /> عدد النقاط لكل كود
                </span>
                <input
                  type="number"
                  min={1}
                  className="admin-input w-full"
                  value={rewardPoints}
                  onChange={(e) => setRewardPoints(Number(e.target.value))}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-muted mb-1 block">عدد الأكواد (Bulk)</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  className="admin-input w-full"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(Number(e.target.value))}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="btn-primary"
                onClick={createAdminCodes}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 size={18} className="inline animate-spin ml-2" />
                    جاري التوليد...
                  </>
                ) : (
                  `توليد ${bulkCount} كود Admin`
                )}
              </button>
              <button
                type="button"
                className="admin-card px-4 py-2 flex items-center gap-2 font-bold"
                onClick={exportAdminExcel}
                disabled={exporting || adminCodes.length === 0}
              >
                <Download size={16} />
                {exporting ? "جاري التصدير..." : "تصدير Excel (Admin فقط)"}
              </button>
            </div>
          </div>

          <div className="card actions-bar">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="w-full pr-10"
                placeholder="بحث بكود Admin..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="card table-card">
            {loading && filteredAdmin.length === 0 ? (
              <p className="text-center py-10 text-muted">جاري التحميل...</p>
            ) : filteredAdmin.length === 0 ? (
              <p className="text-center py-10 text-muted">لا توجد أكواد Admin — ولّد دفعة جديدة</p>
            ) : (
              <table className="codes-table">
                <thead>
                  <tr>
                    <th>الكود</th>
                    <th>النقاط</th>
                    <th>الحالة</th>
                    <th>تاريخ الإنشاء</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmin.map((c) => (
                    <tr key={c._id}>
                      <td className="code-text font-mono">{c.code}</td>
                      <td>{c.rewardPoints}</td>
                      <td>
                        {c.currentUses > 0 ? (
                          <span className="used">مستخدم</span>
                        ) : (
                          <span className="free">متاح</span>
                        )}
                      </td>
                      <td className="text-xs text-muted">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString("ar") : "—"}
                      </td>
                      <td className="flex gap-2">
                        <button type="button" className="icon-btn" onClick={() => copyText(c.code)} title="نسخ">
                          <Copy size={16} />
                        </button>
                        {c.currentUses === 0 && (
                          <button type="button" className="icon-btn text-red-400" onClick={() => deleteAdminCode(c._id)} title="حذف">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default CodeGeneratorPage;
