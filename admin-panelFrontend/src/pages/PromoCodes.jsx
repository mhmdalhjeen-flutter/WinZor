import React, { useState, useEffect, useCallback } from 'react';
import { Ticket, Plus, Download, CheckCircle, Trash2 } from 'lucide-react';
import { API_URL } from '../lib/apiUrl';
import '../style/promo-codes.css';

const API = API_URL;

const PromoCodes = () => {
  const token = localStorage.getItem("adminToken");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const [cardTypes, setCardTypes]   = useState([]);
  const [newCard, setNewCard]       = useState({ name: "", price: "", points: "", color: "#2c3e50" });
  const [cardMsg, setCardMsg]       = useState({ text: "", ok: true });
  const [cardLoading, setCardLoading] = useState(false);

  const [orders, setOrders]           = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [configuringId, setConfiguringId] = useState(null);

  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [exportingId, setExportingId]       = useState(null);

  const [stores, setStores]                   = useState([]);
  const [storesLoading, setStoresLoading]     = useState(false);
  const [storeRows, setStoreRows]             = useState({});
  const [generatingStoreId, setGeneratingStoreId] = useState(null);
  const [togglingSubId, setTogglingSubId]     = useState(null);

  const [tab, setTab] = useState("orders");

  const fetchCardTypes = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/card-types`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCardTypes(data.cards || []);
    } catch { }
  }, []);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res  = await fetch(`${API}/code-orders/admin/all`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrders(data.orders || []);
    } catch { }
    finally { setOrdersLoading(false); }
  }, []);

  const fetchStores = useCallback(async () => {
    setStoresLoading(true);
    try {
      const res  = await fetch(`${API}/admin/stores?type=store`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const list = Array.isArray(data) ? data : [];
      setStores(list);
      const init = {};
      list.forEach(s => {
        init[s._id] = {
          digital: 0,
          physical: 0,
          points: 20,
        };
      });
      setStoreRows(prev => ({ ...init, ...prev }));
    } catch { }
    finally { setStoresLoading(false); }
  }, []);

  useEffect(() => { fetchCardTypes(); fetchOrders(); }, []);
  useEffect(() => { if (tab === "direct") fetchStores(); }, [tab, fetchStores]);

  // إضافة كرت
  const handleAddCard = async () => {
    if (!newCard.name || !newCard.price || !newCard.points)
      return setCardMsg({ text: "كل الحقول مطلوبة", ok: false });
    setCardLoading(true);
    try {
      const res  = await fetch(`${API}/card-types`, {
        method: "POST", headers, body: JSON.stringify(newCard),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCardMsg({ text: `✅ تمت إضافة "${data.card.name}"`, ok: true });
      setNewCard({ name: "", price: "", points: "", color: "#2c3e50" });
      fetchCardTypes();
      setTimeout(() => setCardMsg({ text: "", ok: true }), 4000);
    } catch (err) {
      setCardMsg({ text: "❌ " + err.message, ok: false });
    } finally { setCardLoading(false); }
  };

  // حذف كرت
  const handleDeleteCard = async (id, name) => {
    if (!window.confirm(`حذف "${name}"؟`)) return;
    try {
      const res  = await fetch(`${API}/card-types/${id}`, { method: "DELETE", headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchCardTypes();
    } catch (err) { alert("خطأ: " + err.message); }
  };

  // تكوين أكواد
  const handleConfigure = async (orderId) => {
    if (!window.confirm("تكوين الأكواد لهذا الطلب؟")) return;
    setConfiguringId(orderId);
    try {
      const res  = await fetch(`${API}/code-orders/admin/configure/${orderId}`, {
        method: "POST", headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setGeneratedCodes(data.codes);
      fetchOrders();
      setTab("codes");
    } catch (err) { alert("خطأ: " + err.message); }
    finally { setConfiguringId(null); }
  };

  // تم الاستلام
  const handleReceive = async (orderId) => {
    if (!window.confirm("تأكيد استلام الأكواد من صاحب المتجر؟")) return;
    try {
      const res  = await fetch(`${API}/code-orders/admin/receive/${orderId}`, {
        method: "POST", headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // إخفاء الطلب فوراً من القائمة
      setOrders(prev => prev.filter(o => o._id !== orderId));
      // مسح الأكواد الناتجة إن كانت لنفس الطلب
      setGeneratedCodes([]);
    } catch (err) { alert("خطأ: " + err.message); }
  };

  // تصدير بطاقات هدايا PDF (ورقي فقط)
  const handleExportOrder = async (orderId) => {
    setExportingId(orderId);
    try {
      const res = await fetch(`${API}/code-orders/admin/export/${orderId}`, { headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `gift-cards-${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert("خطأ في التصدير: " + err.message); }
    finally { setExportingId(null); }
  };

  const updateStoreRow = (storeId, field, value) => {
    setStoreRows(prev => ({
      ...prev,
      [storeId]: { ...prev[storeId], [field]: value },
    }));
  };

  const handleToggleSubscription = async (storeId, currentActive) => {
    setTogglingSubId(storeId);
    try {
      const res = await fetch(`${API}/admin/stores/${storeId}/subscription`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ subscriptionActive: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStores(prev => prev.map(s =>
        s._id === storeId ? { ...s, subscriptionActive: data.subscriptionActive } : s
      ));
    } catch (err) { alert("خطأ: " + err.message); }
    finally { setTogglingSubId(null); }
  };

  const downloadPhysicalPdf = async (storeId, physicalCodes) => {
    const res = await fetch(`${API}/code-orders/admin/direct-export-pdf`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        storeId,
        codes: physicalCodes.map(c => c.code),
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `gift-cards-${storeId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDirectGenerate = async (storeId) => {
    const row = storeRows[storeId] || {};
    const digital = parseInt(row.digital, 10) || 0;
    const physical = parseInt(row.physical, 10) || 0;
    const points = parseInt(row.points, 10) || 0;

    if (digital <= 0 && physical <= 0)
      return alert("أدخل كمية رقمية أو ورقية أكبر من صفر");
    if (points <= 0)
      return alert("أدخل نقاط لكل كرت");

    setGeneratingStoreId(storeId);
    try {
      const res = await fetch(`${API}/code-orders/admin/direct-generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          storeId,
          digitalQuantity: digital,
          physicalQuantity: physical,
          pointsPerCard: points,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (data.digitalCodes?.length) {
        setGeneratedCodes(data.digitalCodes);
        setTab("codes");
      }

      if (data.physicalCodes?.length) {
        await downloadPhysicalPdf(storeId, data.physicalCodes);
      }

      alert(data.message);
      setStoreRows(prev => ({
        ...prev,
        [storeId]: { digital: 0, physical: 0, points: row.points || 20 },
      }));
    } catch (err) { alert("خطأ: " + err.message); }
    finally { setGeneratingStoreId(null); }
  };

  const pendingCount = orders.filter(o => o.status === "pending").length;

  const statusMap = {
    pending:    { label: "قيد المراجعة", cls: "pending"  },
    configured: { label: "تم التكوين",   cls: "done"     },
    received:   { label: "تم الاستلام",  cls: "received" },
    rejected:   { label: "مرفوض",        cls: "rejected" },
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div className="admin-title">
          <h1>إدارة وتوليد الأكواد</h1>
          <p>إضافة أنواع الكروت، مراجعة طلبات المتاجر، وتكوين الأكواد</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem", borderBottom:"1px solid var(--border)" }}>
        {[
          { key: "orders",    label: `📋 طلبات المتاجر${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
          { key: "direct",    label: "🏪 توليد مباشر للمتاجر" },
          { key: "cardtypes", label: "🃏 أنواع الكروت" },
          { key: "codes",     label: `🎟️ الأكواد الناتجة${generatedCodes.length > 0 ? ` (${generatedCodes.length})` : ""}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "0.6rem 1.2rem", border: "none", background: "transparent",
            borderBottom: tab === t.key ? "2px solid #2563eb" : "2px solid transparent",
            cursor: "pointer", fontWeight: tab === t.key ? "600" : "400",
            color: tab === t.key ? "#2563eb" : "var(--text-secondary)",
            fontSize: "0.9rem", transition: "all 0.2s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== TAB: طلبات المتاجر ===== */}
      {tab === "orders" && (
        <div className="generator-form-card">
          <h2 style={{ marginBottom: "1rem" }}>📋 طلبات شراء الأكواد الواردة</h2>
          {ordersLoading ? <p>⏳ جاري التحميل...</p>
          : orders.length === 0 ? (
            <div style={{ textAlign:"center", padding:"3rem", color:"var(--text-secondary)" }}>
              <Ticket size={48} style={{ marginBottom:"0.75rem", opacity:0.4 }} />
              <p>لا توجد طلبات واردة</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="codes-table" style={{ width:"100%" }}>
                <thead>
                  <tr>
                    <th>المتجر</th>
                    <th>رقم التواصل</th>
                    <th>العنوان</th>
                    <th>نوع الكرت</th>
                    <th>النقاط</th>
                    <th>الكمية</th>
                    <th>النوع</th>
                    <th>التاريخ</th>
                    <th>الحالة</th>
                    <th>إجراء</th>
                    
                  </tr>
                </thead>
                <tbody>
                  {orders.filter(o => o.status !== "received").map(order => (
                    <tr key={order._id} style={{
                      background: order.status === "pending" ? "rgba(37,99,235,0.04)" : "transparent"
                    }}>
                      <td style={{ fontWeight:"600" }}>{order.store?.name || "—"}</td>
                      <td>{order.store?.phone || order.store?.whatsapp || "—"}</td>
                      <td>{order.store?.address || "—"}</td>
                      <td>{order.cardType?.name || "—"}</td>
                      <td>⭐ {order.cardType?.points}</td>
                      <td style={{ fontWeight:"bold", color:"#2563eb" }}>{order.quantity}</td>
                      <td>
                          {order.deliveryType === 'digital' ? (
                              <span style={{
                                  background: '#eff6ff', color: '#2563eb',
                                  padding: '3px 10px', borderRadius: '12px',
                                  fontSize: '12px', fontWeight: '600',
                              }}>
                                  📱 رقمي
                              </span>
                          ) : (
                              <span style={{
                                  background: '#fffbeb', color: '#d97706',
                                  padding: '3px 10px', borderRadius: '12px',
                                  fontSize: '12px', fontWeight: '600',
                              }}>
                                  🖨️ ورقي
                              </span>
                          )}
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString("ar-EG")}</td>
                      <td>
                        <span className={`status-tag ${statusMap[order.status]?.cls}`}>
                          {statusMap[order.status]?.label}
                        </span>
                      </td>
                      <td>
                        {order.status === "pending" && (
                          <button onClick={() => handleConfigure(order._id)}
                            disabled={configuringId === order._id}
                            style={{
                              padding:"0.35rem 0.8rem", background:"#2563eb",
                              color:"#fff", border:"none", borderRadius:"6px",
                              cursor:"pointer", fontSize:"0.82rem",
                              opacity: configuringId === order._id ? 0.6 : 1,
                            }}>
                            {configuringId === order._id ? "⏳..." : "⚙️ تكوين"}
                          </button>
                        )}

                        {order.status === "configured" && (
                          <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                            {order.deliveryType !== "digital" && (
                              <button onClick={() => handleExportOrder(order._id)}
                                disabled={exportingId === order._id}
                                style={{
                                  padding:"0.3rem 0.7rem", background:"#16a34a",
                                  color:"#fff", border:"none", borderRadius:"6px",
                                  cursor:"pointer", fontSize:"0.78rem",
                                  display:"flex", alignItems:"center", gap:"0.3rem",
                                  opacity: exportingId === order._id ? 0.6 : 1,
                                }}>
                                <Download size={13} />
                                {exportingId === order._id ? "جاري التصدير..." : "PDF بطاقات"}
                              </button>
                            )}
                            {order.deliveryType === "digital" ? (
                              <span style={{ color: "green", fontSize: "0.85rem" }}>✅ مُضاف للمتجر</span>
                            ) : (
                              <button onClick={() => handleReceive(order._id)}
                                style={{
                                  padding:"0.3rem 0.7rem", background:"#0891b2",
                                  color:"#fff", border:"none", borderRadius:"6px",
                                  cursor:"pointer", fontSize:"0.78rem",
                                }}>
                                ✅ تم الاستلام
                              </button>
                            )}
                          </div>
                        )}

                        {order.status === "received" && (
                          <span style={{ color:"green", fontSize:"0.82rem" }}>✅ مكتمل</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: توليد مباشر للمتاجر ===== */}
      {tab === "direct" && (
        <div className="generator-form-card">
          <h2 style={{ marginBottom: "0.5rem" }}>🏪 توليد أكواد مباشرة لكل متجر</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            الرقمي: يُضاف لرصيد المتجر بدون PDF — الورقي: بطاقات PDF جاهزة للطباعة
          </p>

          {storesLoading ? <p>⏳ جاري تحميل المتاجر...</p>
          : stores.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>لا توجد متاجر</p>
          ) : (
            <div className="table-responsive">
              <table className="codes-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>المتجر</th>
                    <th>أكواد رقمية</th>
                    <th>بطاقات ورقية</th>
                    <th>نقاط/كرت</th>
                    <th>الاشتراك</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map(store => {
                    const row = storeRows[store._id] || { digital: 0, physical: 0, points: 20 };
                    const subActive = store.subscriptionActive !== false;
                    return (
                      <tr key={store._id}>
                        <td style={{ fontWeight: 600 }}>{store.name}</td>
                        <td>
                          <input
                            className="admin-input"
                            type="number"
                            min="0"
                            style={{ width: 80 }}
                            value={row.digital}
                            onChange={e => updateStoreRow(store._id, "digital", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="admin-input"
                            type="number"
                            min="0"
                            style={{ width: 80 }}
                            value={row.physical}
                            onChange={e => updateStoreRow(store._id, "physical", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="admin-input"
                            type="number"
                            min="1"
                            style={{ width: 80 }}
                            value={row.points}
                            onChange={e => updateStoreRow(store._id, "points", e.target.value)}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleSubscription(store._id, subActive)}
                            disabled={togglingSubId === store._id}
                            style={{
                              padding: "0.35rem 0.75rem",
                              border: "none",
                              borderRadius: 20,
                              cursor: "pointer",
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              background: subActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                              color: subActive ? "#16a34a" : "#dc2626",
                              opacity: togglingSubId === store._id ? 0.6 : 1,
                            }}
                          >
                            {subActive ? "✅ ON" : "❌ OFF"}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleDirectGenerate(store._id)}
                            disabled={generatingStoreId === store._id}
                            style={{
                              padding: "0.35rem 0.9rem",
                              background: "#2563eb",
                              color: "#fff",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: "0.82rem",
                              opacity: generatingStoreId === store._id ? 0.6 : 1,
                            }}
                          >
                            {generatingStoreId === store._id ? "⏳..." : "⚡ توليد"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: أنواع الكروت ===== */}
      {tab === "cardtypes" && (
        <div className="generator-form-card">
          <h2 style={{ marginBottom:"1.5rem" }}>🃏 إضافة نوع كرت جديد</h2>

          {cardMsg.text && (
            <p style={{
              padding:"0.6rem 1rem", borderRadius:"8px", marginBottom:"1rem",
              background: cardMsg.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              color: cardMsg.ok ? "green" : "red", fontSize:"0.9rem",
            }}>{cardMsg.text}</p>
          )}

          <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", marginBottom:"1.5rem", alignItems:"flex-end" }}>
            <div>
              <label style={{ fontSize:"0.8rem", display:"block", marginBottom:"0.3rem" }}>اسم الكرت</label>
              <input className="admin-input" placeholder="مثال: كارت ذهبي"
                value={newCard.name} onChange={e => setNewCard({ ...newCard, name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize:"0.8rem", display:"block", marginBottom:"0.3rem" }}>السعر ₪</label>
              <input className="admin-input" type="number" placeholder="50"
                value={newCard.price} onChange={e => setNewCard({ ...newCard, price: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize:"0.8rem", display:"block", marginBottom:"0.3rem" }}>النقاط</label>
              <input className="admin-input" type="number" placeholder="100"
                value={newCard.points} onChange={e => setNewCard({ ...newCard, points: e.target.value })} />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.3rem" }}>
              <label style={{ fontSize:"0.8rem" }}>اللون</label>
              <input type="color" value={newCard.color}
                onChange={e => setNewCard({ ...newCard, color: e.target.value })}
                style={{ width:"48px", height:"38px", border:"1px solid var(--border)", borderRadius:"6px", cursor:"pointer", padding:"2px" }} />
            </div>
            <button onClick={handleAddCard} disabled={cardLoading} style={{
              padding:"0.5rem 1.5rem", background:"#2563eb", color:"#fff",
              border:"none", borderRadius:"8px", cursor: cardLoading ? "not-allowed" : "pointer",
              opacity: cardLoading ? 0.7 : 1, fontWeight:"600", height:"38px",
            }}>
              {cardLoading ? "⏳" : <><Plus size={14} style={{ verticalAlign:"middle" }} /> إضافة</>}
            </button>
          </div>

          {/* معاينة */}
          {newCard.name && (
            <div style={{ marginBottom:"1.5rem" }}>
              <p style={{ fontSize:"0.8rem", color:"var(--text-secondary)", marginBottom:"0.5rem" }}>معاينة:</p>
              <div style={{
                background: newCard.color, color:"#fff",
                padding:"1rem 1.5rem", borderRadius:"12px", width:"200px",
                boxShadow:"0 4px 12px rgba(0,0,0,0.2)",
              }}>
                <div style={{ fontSize:"0.75rem", opacity:0.8, marginBottom:"0.5rem" }}>OFFERS TECH</div>
                <div style={{ fontWeight:"bold", fontSize:"1.1rem" }}>{newCard.name}</div>
                <div style={{ fontSize:"0.85rem", marginTop:"0.3rem" }}>⭐ {newCard.points || 0} نقطة</div>
                <div style={{ fontSize:"0.9rem", marginTop:"0.3rem" }}>{newCard.price || 0} ₪</div>
              </div>
            </div>
          )}

          <h3 style={{ marginBottom:"1rem", fontSize:"1rem" }}>الكروت المتاحة حالياً</h3>
          {cardTypes.length === 0 ? (
            <p style={{ color:"var(--text-secondary)" }}>لا توجد أنواع كروت بعد</p>
          ) : (
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.75rem" }}>
              {cardTypes.map(c => (
                <div key={c._id} style={{
                  background: c.color, color:"#fff",
                  padding:"0.75rem 1rem", borderRadius:"10px",
                  minWidth:"160px", position:"relative",
                  boxShadow:"0 2px 8px rgba(0,0,0,0.15)",
                }}>
                  <div style={{ fontSize:"0.7rem", opacity:0.8 }}>OFFERS TECH</div>
                  <div style={{ fontWeight:"bold", fontSize:"1rem" }}>{c.name}</div>
                  <div style={{ fontSize:"0.8rem" }}>⭐ {c.points} نقطة</div>
                  <div style={{ fontSize:"0.85rem" }}>{c.price} ₪</div>
                  <button onClick={() => handleDeleteCard(c._id, c.name)} style={{
                    position:"absolute", top:"6px", left:"6px",
                    background:"rgba(255,255,255,0.2)", border:"none",
                    borderRadius:"4px", cursor:"pointer", padding:"2px 5px", color:"#fff",
                  }} title="حذف">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: الأكواد الناتجة ===== */}
      {tab === "codes" && (
        <div className="codes-display-area">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <h2>🎟️ الأكواد الناتجة
              {generatedCodes.length > 0 && (
                <span style={{ fontSize:"0.85rem", fontWeight:"400", marginRight:"0.5rem", color:"var(--text-secondary)" }}>
                  ({generatedCodes.length} كود)
                </span>
              )}
            </h2>
          </div>

          {generatedCodes.length === 0 ? (
            <div style={{ textAlign:"center", padding:"4rem", color:"var(--text-secondary)" }}>
              <Ticket size={64} style={{ opacity:0.3, marginBottom:"1rem" }} />
              <p>لم يتم تكوين أي أكواد بعد</p>
              <p style={{ fontSize:"0.85rem", marginTop:"0.5rem" }}>
                اذهب لتبويب "طلبات المتاجر" واضغط "تكوين"
              </p>
            </div>
          ) : (
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))",
              gap:"0.5rem", maxHeight:"500px", overflowY:"auto", padding:"0.5rem",
            }}>
              {generatedCodes.map((c, i) => (
                <div key={i} style={{
                  background:"var(--surface-1, #f8f9fa)",
                  border:"1px solid var(--border)", borderRadius:"8px",
                  padding:"0.5rem 0.75rem", fontFamily:"monospace",
                  fontSize:"0.85rem", fontWeight:"600",
                  textAlign:"center", letterSpacing:"0.5px",
                }}>
                  {c.code}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromoCodes;