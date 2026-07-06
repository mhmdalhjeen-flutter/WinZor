import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../api/axios';
import {
  Trophy, MessageCircle, Loader2, Phone, MapPin, X, Send, ChevronRight,
} from 'lucide-react';

const STATUS_OPTS = [
  { value: 'pending', label: 'بانتظار التسليم' },
  { value: 'delivered', label: 'تم التسليم' },
  { value: 'cancelled', label: 'ملغى' },
];

const WheelWinners = () => {
  const [wins, setWins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatUser, setChatUser] = useState(null);
  const [convId, setConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchWins = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/admin/wheel/wins');
      setWins(data.wins || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWins(); }, [fetchWins]);

  const updateStatus = async (id, deliveryStatus) => {
    try {
      await axios.patch(`/admin/wheel/wins/${id}`, { deliveryStatus });
      fetchWins();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل التحديث');
    }
  };

  const openChat = async (win) => {
    const user = win.user;
    if (!user?._id) return;
    setChatUser({ ...user, prizeName: win.prizeName, winId: win._id });
    setChatLoading(true);
    setMessages([]);
    try {
      const { data } = await axios.post('/chats', {
        recipientId: user._id,
        context: { type: 'wheel_win', winId: win._id, prizeName: win.prizeName },
      });
      const conv = data.conversation;
      setConvId(conv._id);
      const msgRes = await axios.get(`/chats/${conv._id}`);
      setMessages(msgRes.data.messages || []);
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر فتح المحادثة');
      setChatUser(null);
    } finally {
      setChatLoading(false);
    }
  };

  const closeChat = () => {
    setChatUser(null);
    setConvId(null);
    setMessages([]);
    setText('');
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !convId || sending) return;
    setSending(true);
    try {
      const { data } = await axios.post(`/chats/${convId}`, { text: text.trim() });
      setMessages((prev) => [...prev, data.message]);
      setText('');
    } catch (err) {
      alert(err.response?.data?.message || 'فشل الإرسال');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const adminId = JSON.parse(localStorage.getItem('adminUser') || '{}')?._id;

  return (
    <div className="admin-page-container" dir="rtl">
      <div className="admin-header">
        <div className="admin-title">
          <h1>فائزو العجلة</h1>
          <p>سجل الجوائز والتواصل مع الفائزين</p>
        </div>
      </div>

      {!loading && wins.length === 0 ? (
        <div className="admin-card p-10 text-center text-muted">لا توجد فوزات مسجّلة بعد</div>
      ) : (
        <div className="space-y-3">
          {wins.map((w) => (
            <div key={w._id} className="admin-card p-5 flex flex-col lg:flex-row gap-4 lg:items-center">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Trophy className="text-primary" size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-white">{w.prizeName}</h3>
                  <p className="text-sm text-muted">{w.userName || w.user?.name}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted">
                    {w.userPhone && (
                      <span className="flex items-center gap-1"><Phone size={12} /> {w.userPhone}</span>
                    )}
                    {(w.userAddress || w.user?.address) && (
                      <span className="flex items-center gap-1"><MapPin size={12} /> {w.userAddress || w.user?.address}</span>
                    )}
                    <span>{new Date(w.wonAt).toLocaleString('ar')}</span>
                  </div>
                  {w.adminNotes && <p className="text-xs text-amber-400 mt-1">ملاحظات: {w.adminNotes}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  className="admin-input text-sm py-2"
                  value={w.deliveryStatus}
                  onChange={(e) => updateStatus(w._id, e.target.value)}
                >
                  {STATUS_OPTS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => openChat(w)}
                  className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                >
                  <MessageCircle size={16} /> محادثة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {chatUser && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="admin-card w-full sm:max-w-md h-[85vh] sm:h-[600px] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border-color flex items-center gap-3">
              <button type="button" onClick={closeChat} className="text-muted"><ChevronRight size={22} /></button>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white truncate">{chatUser.name}</p>
                <p className="text-xs text-muted truncate">جائزة: {chatUser.prizeName}</p>
              </div>
              <button type="button" onClick={closeChat}><X className="text-muted" size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-dark/30">
              {chatLoading ? null : messages.length === 0 ? (
                <p className="text-center text-muted text-sm py-10">ابدأ المحادثة مع الفائز</p>
              ) : (
                messages.map((m) => {
                  const mine = String(m.sender?._id || m.sender) === String(adminId);
                  return (
                    <div key={m._id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${mine ? 'bg-primary text-white rounded-br-sm' : 'bg-card text-white rounded-bl-sm border border-border-color'}`}>
                        {m.text}
                        <p className="text-[9px] opacity-60 mt-1">{new Date(m.createdAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="p-3 border-t border-border-color flex gap-2">
              <input
                className="admin-input flex-1"
                placeholder="اكتب رسالة..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={chatLoading || !convId}
              />
              <button type="submit" disabled={sending || !text.trim()} className="btn-primary p-3">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WheelWinners;
