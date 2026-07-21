import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Send, Camera, ChevronRight, Check, CheckCheck,
  MessageCircle, X, Paperclip,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { mergeChatMessages, messagesShallowEqual } from '../utils/chatMessages';
import ReferencedItemsBar from '../components/ReferencedItemsBar';
import { getChatItemPath, getReferencedItems } from '../utils/chatItemRoutes';
import { getStoredUser } from '../utils/safeStorage';
import { getUnreadCountForUser } from '../utils/unreadCount';
import { queryKeys } from '../lib/queryClient';
import { uploadImage } from '../utils/imageUpload';
import { resolveImageUrl } from '../utils/mediaUrl';
import '../styles/Chats.css';

const POLL_MS = 3000;
const WARN_KEY = 'chatExpiryWarned';

const getMyId = (authUser) => {
  if (authUser?._id) return String(authUser._id);
  if (authUser?.id) return String(authUser.id);
  const saved = getStoredUser({});
  return String(saved._id || saved.id || '');
};

const normalizeId = (id) => {
  if (!id) return '';
  if (typeof id === 'object') return String(id._id || id.id || '');
  return String(id);
};

/** فتح العنصر المرجعي داخل موقع الزبون */
const useContextNavigator = () => {
  const navigate = useNavigate();
  return (item) => {
    const path = getChatItemPath(item, { role: 'customer' });
    if (path) navigate(path);
    else if (item?.itemUrl?.startsWith('/')) navigate(item.itemUrl);
    else if (item?.itemUrl?.startsWith('http')) window.open(item.itemUrl, '_blank');
  };
};

export default function Chats() {
  const { convId: routeConvId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const goContext = useContextNavigator();
  const { user: authUser } = useAuth();
  const myId = getMyId(authUser);

  const {
    data: conversations = [],
    isLoading: loading,
    refetch: refetchConversations,
    isError: conversationsError,
    error: conversationsQueryError,
  } = useQuery({
    queryKey: queryKeys.chats,
    queryFn: async () => {
      const { data } = await api.get('/chats');
      return data.conversations || [];
    },
  });

  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [bootError, setBootError] = useState('');

  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);
  const activeConvRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const chatContextHandledRef = useRef(null);

  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  useEffect(() => {
    if (!localStorage.getItem(WARN_KEY)) setShowWarning(true);
  }, []);

  const dismissWarning = () => {
    localStorage.setItem(WARN_KEY, '1');
    setShowWarning(false);
  };

  const scrollToBottom = () =>
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);

  useEffect(() => {
    if (conversationsError) {
      setBootError(conversationsQueryError?.response?.data?.message || 'تعذّر تحميل المحادثات');
    }
  }, [conversationsError, conversationsQueryError]);

  const fetchMessages = useCallback(async (id, silent = false) => {
    try {
      const { data } = await api.get(`/chats/${id}`);
      const server = data.messages || [];
      setMessages((prev) => {
        const merged = mergeChatMessages(server, prev);
        if (messagesShallowEqual(prev, merged)) return prev;
        if (!silent) scrollToBottom();
        return merged;
      });
    } catch (err) {
      if (!silent) {
        setBootError(err.response?.data?.message || 'تعذّر تحميل الرسائل');
      }
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (id) => {
      stopPolling();
      pollingRef.current = setInterval(() => {
        if (activeConvRef.current?._id === id) {
          fetchMessages(id, true);
          refetchConversations();
        }
      }, POLL_MS);
    },
    [fetchMessages, refetchConversations, stopPolling]
  );

  const openConversation = useCallback(
    (conv, { pushRoute = true, resetMessages = true } = {}) => {
      if (!conv?._id) return;

      setActiveConv(conv);
      setBootError('');

      if (resetMessages) {
        setMessages([]);
        setReplyTo(null);
        setImagePreview(null);
        setImageFile(null);
      }

      fetchMessages(conv._id);
      startPolling(conv._id);

      if (pushRoute && routeConvId !== conv._id) {
        navigate(`/chat/${conv._id}`, { replace: true });
      }
    },
    [fetchMessages, startPolling, navigate, routeConvId]
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  // فتح محادثة من منتج/عرض
  useEffect(() => {
    const raw = localStorage.getItem('chatContext');
    if (!raw) return;
    if (chatContextHandledRef.current === raw) return;

    chatContextHandledRef.current = raw;
    let cancelled = false;

    (async () => {
      try {
        const parsed = JSON.parse(raw);
        const { data } = await api.post('/chats', {
          recipientId: parsed.recipientId || parsed.storeOwnerId,
          context: parsed.context || {
            itemId: parsed.productId || parsed.offerId,
            itemType: parsed.itemType || 'Offer',
            itemName: parsed.productName || parsed.offerTitle,
            itemImage: parsed.productImg || parsed.offerImage,
          },
        });
        if (cancelled) return;
        localStorage.removeItem('chatContext');
        openConversation(data.conversation, { pushRoute: true });
        refetchConversations();
        if (parsed.prefillText) setTimeout(() => setText(parsed.prefillText), 400);
      } catch (err) {
        localStorage.removeItem('chatContext');
        chatContextHandledRef.current = null;
        if (!cancelled) {
          setBootError(err.response?.data?.message || 'تعذّر فتح المحادثة');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [openConversation, refetchConversations, location.pathname]);

  // فتح محادثة من الرابط /chat/:convId
  useEffect(() => {
    if (loading || !routeConvId) return;
    if (activeConvRef.current?._id === routeConvId) return;

    const found = conversations.find((c) => c._id === routeConvId);
    if (found) {
      openConversation(found, { pushRoute: false });
      return;
    }

    setActiveConv({ _id: routeConvId, participants: [] });
    fetchMessages(routeConvId);
    startPolling(routeConvId);
  }, [routeConvId, loading, conversations, openConversation, fetchMessages, startPolling]);

  // مزامنة بيانات المحادثة النشطة (عناصر مرتبطة، اسم الطرف...)
  useEffect(() => {
    if (!activeConv?._id) return;
    const fresh = conversations.find((c) => c._id === activeConv._id);
    if (!fresh) return;
    const prevItems = JSON.stringify(getReferencedItems(activeConv));
    const nextItems = JSON.stringify(getReferencedItems(fresh));
    if (prevItems !== nextItems || fresh.updatedAt !== activeConv.updatedAt) {
      setActiveConv((prev) => ({ ...prev, ...fresh }));
    }
  }, [conversations, activeConv?._id, activeConv?.updatedAt]);

  const handleImageSelect = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert('الصورة أكبر من 5MB');
    try {
      const url = await uploadImage(file);
      setImageFile(url);
      setImagePreview(url);
    } catch (err) {
      alert(err.message || 'فشل رفع الصورة');
    }
  };

  const sendMessage = async () => {
    if ((!text.trim() && !imageFile) || !activeConv || sending) return;
    setSending(true);
    const optimistic = {
      _id: `tmp-${Date.now()}`,
      clientKey: `c-${Date.now()}`,
      sender: { _id: myId },
      text: text.trim(),
      image: imageFile || null,
      replyTo: replyTo || null,
      createdAt: new Date(),
      read: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    const sentText = text.trim();
    const sentImage = imageFile;
    const sentReply = replyTo;
    setText('');
    setImagePreview(null);
    setImageFile(null);
    setReplyTo(null);
    scrollToBottom();

    try {
      const { data } = await api.post(`/chats/${activeConv._id}`, {
        text: sentText,
        image: sentImage,
        replyTo: sentReply
          ? { messageId: sentReply._id, text: sentReply.text, senderName: sentReply.sender?.name || 'مستخدم' }
          : null,
      });
      setMessages((prev) =>
        prev.map((m) =>
          m._id === optimistic._id ? { ...data.message, clientKey: optimistic.clientKey } : m
        )
      );
      refetchConversations();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setText(sentText);
      setImageFile(sentImage);
      setReplyTo(sentReply);
      alert(err.response?.data?.message || 'تعذّر الإرسال');
    } finally {
      setSending(false);
    }
  };

  const getOther = (conv) =>
    conv.participants?.find((p) => {
      const pid = p._id?.toString() || p?.toString();
      return pid !== myId?.toString();
    }) || conv.participants?.[0];

  const getInitial = (name) => name?.charAt(0) || '؟';

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const diff = Date.now() - d;
    if (diff < 86400000) return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'أمس';
    if (diff < 604800000) {
      return d.toLocaleDateString('ar-EG', { weekday: 'short' });
    }
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
  };

  const formatListTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const diff = Date.now() - d;
    if (diff < 60000) return 'الآن';
    if (diff < 86400000) return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'أمس';
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
  };

  const [lightboxUrl, setLightboxUrl] = useState(null);

  const backToList = () => {
    stopPolling();
    setActiveConv(null);
    setMessages([]);
    navigate('/chat');
  };

  const showList = !activeConv;
  const showWindow = !!activeConv;
  const referencedItems = activeConv ? getReferencedItems(activeConv) : [];

  if (loading) {
    return (
      <div className="chats-page" dir="rtl">
        <div className="messenger-container chat-skeleton">
          <div className="chats-sidebar">
            <div className="sidebar-header">
              <div className="chat-skeleton__line chat-skeleton__line--title" />
            </div>
            <div className="chats-list">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="chat-skeleton__item">
                  <div className="chat-skeleton__avatar" />
                  <div className="chat-skeleton__body">
                    <div className="chat-skeleton__line chat-skeleton__line--name" />
                    <div className="chat-skeleton__line chat-skeleton__line--msg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="chat-window chat-window--empty chat-skeleton__window">
            <MessageCircle size={48} strokeWidth={1.5} className="chat-empty-icon" />
            <p>جاري تحميل المحادثات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chats-page" dir="rtl">
      {showWarning && (
        <div className="chat-expiry-toast">
          <div className="chat-expiry-toast__inner">
            <span className="chat-expiry-toast__icon">⏳</span>
            <div>
              <p className="chat-expiry-toast__title">تنبيه: الرسائل تُحذف تلقائياً</p>
              <p className="chat-expiry-toast__text">
                تُحذف الرسائل بعد <strong>4 أيام</strong> من إرسالها لتخفيف التخزين.
              </p>
            </div>
          </div>
          <button type="button" className="chat-expiry-toast__btn" onClick={dismissWarning}>
            فهمت ✓
          </button>
        </div>
      )}

      {bootError && <div className="chat-boot-error">{bootError}</div>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden-input"
        onChange={(e) => handleImageSelect(e.target.files[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden-input"
        onChange={(e) => handleImageSelect(e.target.files[0])}
      />

      <div className="messenger-container">
        <div className={`chats-sidebar ${showWindow ? 'mobile-hidden' : ''}`}>
          <div className="sidebar-header">
            <h3><MessageCircle size={20} strokeWidth={2.2} /> الرسائل</h3>
            <span>{conversations.length} محادثة</span>
          </div>
          <div className="chats-list">
            {conversations.length === 0 ? (
              <div className="chats-empty-state">
                <MessageCircle size={40} strokeWidth={1.5} />
                <p>لا توجد محادثات بعد</p>
                <span>تواصل مع المتاجر من صفحة المنتج أو العرض</span>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = getOther(conv);
                const unread = getUnreadCountForUser(conv.unreadCount, myId);
                const isActive = activeConv?._id === conv._id;
                const lastMsgTxt = conv.lastMessage?.image
                  ? '📷 صورة'
                  : conv.lastMessage?.text || 'ابدأ المحادثة';

                return (
                  <div
                    key={conv._id}
                    className={`chat-item${isActive ? ' active' : ''}${unread > 0 ? ' has-unread' : ''}`}
                    onClick={() => openConversation(conv)}
                  >
                    <div className="chat-avatar">
                      {getInitial(other?.name)}
                    </div>
                    <div className="chat-info">
                      <h4>{other?.name || 'مستخدم'}</h4>
                      <p className={unread > 0 ? 'chat-preview-unread' : ''}>{lastMsgTxt}</p>
                    </div>
                    <div className="chat-meta">
                      <span className={`chat-time${unread > 0 ? ' chat-time--unread' : ''}`}>{formatListTime(conv.updatedAt)}</span>
                      {unread > 0 && (
                        <span className="chat-unread-badge">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {!activeConv ? (
          <div className={`chat-window chat-window--empty ${showList ? 'mobile-hidden' : ''}`}>
            <MessageCircle size={56} strokeWidth={1.2} className="chat-empty-icon" />
            <p className="chat-empty-title">اختر محادثة للبدء</p>
            <span className="chat-empty-sub">رسائلك مع المتاجر تظهر هنا</span>
          </div>
        ) : (
          <div className={`chat-window ${showList ? 'mobile-hidden' : ''}`}>
            <div className="window-header">
              <button type="button" className="back-mobile" onClick={backToList} aria-label="رجوع">
                <ChevronRight size={22} />
              </button>
              <div className="user-details">
                <div className="chat-avatar" style={{ cursor: 'default' }}>
                  {getInitial(getOther(activeConv)?.name)}
                </div>
                <div>
                  <h4>{getOther(activeConv)?.name || 'مستخدم'}</h4>
                  <span>⏳ الرسائل تُحذف بعد 4 أيام</span>
                </div>
              </div>
              <div className="header-links">
                <button
                  type="button"
                  className="mini-wa"
                  onClick={() => {
                    const other = getOther(activeConv);
                    const phone = other?.phone || other?.whatsapp;
                    if (!phone) return alert('رقم الواتساب غير متاح');
                    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
                  }}
                >
                  📱 واتساب
                </button>
              </div>
            </div>

            <ReferencedItemsBar items={referencedItems} onItemClick={goContext} />

            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-messages-empty">
                  <span>👋</span>
                  <p>ابدأ المحادثة الآن</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const senderId = msg.sender?._id || msg.sender;
                const isMine = normalizeId(senderId) === normalizeId(myId) && !!myId;
                return (
                  <div
                    key={msg.clientKey || msg._id || i}
                    className={`msg msg--animate ${isMine ? 'sent' : 'received'}`}
                    onDoubleClick={() => setReplyTo(msg)}
                    title="انقر مرتين للرد"
                  >
                    {msg.replyTo?.text && (
                      <div className="msg-reply-quote">
                        <span className="msg-reply-name">
                          {msg.replyTo.senderName}:
                        </span>{' '}
                        {msg.replyTo.text}
                      </div>
                    )}
                    {msg.image && (
                      <button
                        type="button"
                        className="msg-image-btn"
                        onClick={() => setLightboxUrl(resolveImageUrl(msg.image, { width: 1200 }))}
                      >
                        <img
                          src={resolveImageUrl(msg.image, { width: 600 })}
                          alt=""
                          className="msg-image"
                        />
                      </button>
                    )}
                    {msg.text && <p className="msg-text">{msg.text}</p>}
                    <span className="msg-meta">
                      {formatTime(msg.createdAt)}
                      {isMine && (
                        <span className="read-status" aria-label={msg.read ? 'مقروء' : 'مُرسَل'}>
                          {msg.read ? <CheckCheck size={14} /> : <Check size={14} />}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
              {sending && (
                <div className="typing-indicator" aria-label="جاري الإرسال">
                  <span /><span /><span />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {replyTo && (
              <div className="reply-preview-bar">
                <div>
                  <span style={{ color: '#667eea', fontWeight: 'bold' }}>
                    رداً على: {replyTo.sender?.name || 'مستخدم'}
                  </span>
                  <p>
                    {replyTo.image ? '📷 صورة' : replyTo.text}
                  </p>
                </div>
                <button type="button" onClick={() => setReplyTo(null)} aria-label="إلغاء الرد">
                  ✕
                </button>
              </div>
            )}

            {imagePreview && (
              <div className="image-preview-bar">
                <img src={imagePreview} alt="" />
                <span>صورة مرفقة</span>
                <button
                  type="button"
                  onClick={() => { setImagePreview(null); setImageFile(null); }}
                  aria-label="إزالة الصورة"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div className="chat-input-area">
              <button
                type="button"
                className="chat-media-btn"
                title="التقاط صورة"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera size={20} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="chat-media-btn"
                title="إرفاق صورة"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={20} strokeWidth={2} />
              </button>
              <input
                type="text"
                placeholder="اكتب رسالتك..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={sending}
              />
              <button
                type="button"
                className="send-msg-btn"
                onClick={sendMessage}
                disabled={sending || (!text.trim() && !imageFile)}
                aria-label="إرسال"
              >
                <Send size={20} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        )}
      </div>

      {lightboxUrl && (
        <div className="chat-lightbox" onClick={() => setLightboxUrl(null)} role="presentation">
          <button type="button" className="chat-lightbox__close" onClick={() => setLightboxUrl(null)} aria-label="إغلاق">
            <X size={24} />
          </button>
          <img src={lightboxUrl} alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
