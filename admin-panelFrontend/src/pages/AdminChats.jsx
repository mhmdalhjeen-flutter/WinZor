import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import {
  MessageCircle, Send, Loader2, Search, ChevronRight, User,
} from 'lucide-react';
import useAdminChatUnread from '../hooks/useAdminChatUnread';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import '../style/admin-chats.css';

const POLL_MS = 3000;

const ROLE_LABELS = {
  customer: 'زبون',
  store: 'صاحب محل',
  supplier: 'تاجر / مستودع',
  admin: 'أدمن',
};

const getAdminId = () => {
  try {
    const u = JSON.parse(localStorage.getItem('adminUser') || '{}');
    return String(u._id || u.id || '');
  } catch {
    return '';
  }
};

const normalizeId = (v) => {
  if (!v) return '';
  if (typeof v === 'object') return String(v._id || v.id || '');
  return String(v);
};

const getOtherParticipant = (conv, myId) =>
  conv.participants?.find((p) => normalizeId(p) !== myId) || conv.participants?.[0];

export default function AdminChats() {
  const { userId: routeUserId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const adminId = getAdminId();
  const { refresh: refreshUnreadBadge } = useAdminChatUnread();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [error, setError] = useState('');

  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const activeConvRef = useRef(null);
  const userHandledRef = useRef(null);

  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  const scrollBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  };

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await axios.get('/chats');
      setConversations(data.conversations || []);
      return data.conversations || [];
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر تحميل المحادثات');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (convId, silent = false) => {
    try {
      const { data } = await axios.get(`/chats/${convId}`);
      setMessages(data.messages || []);
      if (!silent)       scrollBottom();
      refreshUnreadBadge();
    } catch (err) {
      if (!silent) setError(err.response?.data?.message || 'تعذّر تحميل الرسائل');
    }
  }, [refreshUnreadBadge]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback((convId) => {
    stopPolling();
    pollRef.current = setInterval(() => {
      if (activeConvRef.current?._id === convId) {
        fetchMessages(convId, true);
        fetchConversations();
      }
    }, POLL_MS);
  }, [fetchMessages, fetchConversations, stopPolling]);

  const openConversation = useCallback((conv, { pushRoute = true } = {}) => {
    if (!conv?._id) return;
    setActiveConv(conv);
    setError('');
    setMessages([]);
    setThreadLoading(true);
    fetchMessages(conv._id).finally(() => setThreadLoading(false));
    startPolling(conv._id);

    const other = getOtherParticipant(conv, adminId);
    const otherId = normalizeId(other);
    if (pushRoute && otherId && routeUserId !== otherId) {
      navigate(`/chats/user/${otherId}`, { replace: true, state: location.state });
    }
  }, [adminId, fetchMessages, startPolling, navigate, routeUserId, location.state]);

  const openChatWithUser = useCallback(async (targetUserId, context) => {
    if (!targetUserId) return;
    setThreadLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/chats', {
        recipientId: targetUserId,
        context: context || { itemType: 'Support', itemName: 'دعم إدارة المنصة' },
      });
      const conv = data.conversation;
      setActiveConv(conv);
      await fetchMessages(conv._id);
      startPolling(conv._id);
      await fetchConversations();
      navigate(`/chats/user/${targetUserId}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر فتح المحادثة');
    } finally {
      setThreadLoading(false);
    }
  }, [fetchMessages, startPolling, fetchConversations, navigate]);

  useEffect(() => {
    fetchConversations();
    return () => stopPolling();
  }, [fetchConversations, stopPolling]);

  // فتح محادثة من رابط /chats/user/:userId
  useEffect(() => {
    userHandledRef.current = null;
  }, [routeUserId]);

  useEffect(() => {
    if (!routeUserId || loading) return;

    const existing = conversations.find((c) => {
      const other = getOtherParticipant(c, adminId);
      return normalizeId(other) === routeUserId;
    });

    if (existing) {
      if (activeConvRef.current?._id !== existing._id) {
        openConversation(existing, { pushRoute: false });
      }
      userHandledRef.current = routeUserId;
      return;
    }

    if (userHandledRef.current === routeUserId) return;
    userHandledRef.current = routeUserId;

    const ctx = location.state?.context;
    openChatWithUser(routeUserId, ctx);
  }, [routeUserId, loading, conversations, adminId, openConversation, openChatWithUser, location.state?.context]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConv?._id || sending) return;
    setSending(true);
    try {
      const { data } = await axios.post(`/chats/${activeConv._id}`, { text: text.trim() });
      setMessages((prev) => [...prev, data.message]);
      setText('');
      scrollBottom();
      fetchConversations();
      refreshUnreadBadge();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل الإرسال');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!debouncedSearch) return true;
    const other = getOtherParticipant(c, adminId);
    const name = other?.name || '';
    const phone = other?.phone || '';
    const q = debouncedSearch.toLowerCase();
    return name.toLowerCase().includes(q) || phone.includes(q);
  });

  const otherUser = activeConv ? getOtherParticipant(activeConv, adminId) : null;
  const unreadFor = (conv) => {
    const uc = conv.unreadCount;
    if (!uc) return 0;
    if (typeof uc.get === 'function') return uc.get(adminId) || 0;
    return uc[adminId] || 0;
  };

  return (
    <div className="admin-page-container admin-chats-page" dir="rtl">
      <div className="admin-header">
        <div className="admin-title">
          <h1>مركز التواصل</h1>
          <p>محادثات الأدمن مع المستخدمين — محفوظة في قاعدة البيانات</p>
        </div>
      </div>

      <div className="admin-chats-layout">
        {/* قائمة المحادثات */}
        <aside className="admin-chats-sidebar admin-card">
          <div className="admin-chats-sidebar-head">
            <MessageCircle size={18} className="text-primary" />
            <span>المحادثات ({conversations.length})</span>
          </div>
          <div className="admin-chats-search">
            <Search size={16} />
            <input
              type="text"
              className="admin-input"
              placeholder="بحث بالاسم أو الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="admin-chats-list custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="admin-chats-empty">
                <p>لا توجد محادثات بعد</p>
                <span className="text-muted text-xs">افتح محادثة من صفحة المستخدمين أو المتاجر</span>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv, adminId);
                const oid = normalizeId(other);
                const isActive = normalizeId(otherUser) === oid;
                const unread = unreadFor(conv);
                const preview = conv.lastMessage?.text || (conv.lastMessage?.image ? '📷 صورة' : '—');

                return (
                  <button
                    key={conv._id}
                    type="button"
                    className={`admin-chats-item ${isActive ? 'is-active' : ''}`}
                    onClick={() => navigate(`/chats/user/${oid}`, { state: location.state })}
                  >
                    <div className="admin-chats-avatar">{other?.name?.[0] || '?'}</div>
                    <div className="admin-chats-item-body">
                      <div className="admin-chats-item-top">
                        <span className="admin-chats-item-name">{other?.name || 'مستخدم'}</span>
                        {unread > 0 && <span className="admin-chats-unread">{unread}</span>}
                      </div>
                      <span className="admin-chats-item-role">
                        {ROLE_LABELS[other?.role] || other?.role || '—'}
                      </span>
                      <p className="admin-chats-item-preview">{preview}</p>
                    </div>
                    <ChevronRight size={16} className="text-muted shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* نافذة المحادثة */}
        <section className="admin-chats-thread admin-card">
          {!routeUserId && !activeConv ? (
            <div className="admin-chats-placeholder">
              <MessageCircle size={48} className="text-muted mb-4" />
              <h3>اختر محادثة</h3>
              <p className="text-muted text-sm">أو افتح تواصل مع مستخدم من صفحة المستخدمين / المتاجر</p>
            </div>
          ) : (
            <>
              <div className="admin-chats-thread-head">
                <div className="admin-chats-avatar lg">{otherUser?.name?.[0] || '?'}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-white truncate">
                    {location.state?.userName || otherUser?.name || 'مستخدم'}
                  </h3>
                  <p className="text-xs text-muted">
                    {ROLE_LABELS[otherUser?.role] || otherUser?.role || '—'}
                    {otherUser?.phone ? ` · ${otherUser.phone}` : ''}
                  </p>
                  {activeConv?.context?.itemName && (
                    <p className="text-xs text-primary mt-1 truncate">{activeConv.context.itemName}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-secondary text-xs py-2 px-3"
                  onClick={() => navigate('/users')}
                  title="العودة لقائمة المستخدمين"
                >
                  <User size={14} /> المستخدمون
                </button>
              </div>

              {error && (
                <div className="admin-chats-error">{error}</div>
              )}

              <div className="admin-chats-messages custom-scrollbar">
                {threadLoading ? null : messages.length === 0 ? (
                  <p className="text-center text-muted text-sm py-16">ابدأ المحادثة — الرسائل محفوظة في النظام</p>
                ) : (
                  messages.map((m) => {
                    const mine = normalizeId(m.sender) === adminId;
                    return (
                      <div key={m._id} className={`admin-chats-bubble-row ${mine ? 'mine' : 'theirs'}`}>
                        <div className={`admin-chats-bubble ${mine ? 'mine' : 'theirs'}`}>
                          {m.image && (
                            <img src={m.image} alt="" className="admin-chats-msg-img" />
                          )}
                          {m.text && <p>{m.text}</p>}
                          <span className="admin-chats-time">
                            {new Date(m.createdAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={sendMessage} className="admin-chats-compose">
                <input
                  className="admin-input flex-1"
                  placeholder="اكتب رسالتك للمستخدم..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={threadLoading || !activeConv?._id}
                />
                <button
                  type="submit"
                  className="btn-primary p-3"
                  disabled={sending || !text.trim() || !activeConv?._id}
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
