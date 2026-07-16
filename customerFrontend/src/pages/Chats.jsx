import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CornerUpLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
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
    return d.toLocaleDateString('ar-EG');
  };

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
    return <p className="text-center py-12 text-gray-500 font-bold">⏳ جاري التحميل...</p>;
  }

  return (
    <div className="chats-page" dir="rtl">
      {showWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[99] bg-slate-800 text-white p-4 rounded-xl max-w-sm w-[90%] shadow-xl text-sm">
          <p className="font-bold mb-1">⏳ الرسائل تُحذف بعد 4 أيام</p>
          <button type="button" onClick={dismissWarning} className="mt-2 w-full py-2 bg-indigo-500 rounded-lg font-bold">فهمت ✓</button>
        </div>
      )}

      {bootError && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {bootError}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleImageSelect(e.target.files[0])} />

      <div className="messenger-container">
        <div className={`chats-sidebar ${showWindow ? 'mobile-hidden' : ''}`}>
          <div className="sidebar-header flex justify-between items-center">
            <h3 className="font-black text-gray-800">💬 الرسائل</h3>
            <span className="text-xs text-gray-400">{conversations.length} محادثة</span>
          </div>
          <div className="chats-list-scroll">
            {conversations.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm">لا توجد محادثات بعد</p>
            ) : (
              conversations.map((conv) => {
                const other = getOther(conv);
                const isActive = activeConv?._id === conv._id;
                const refCount = getReferencedItems(conv).length;
                const lastMsg = conv.lastMessage?.image ? '📷 صورة' : conv.lastMessage?.text || 'ابدأ المحادثة';
                return (
                  <div key={conv._id} className={`chat-item ${isActive ? 'active' : ''}`} onClick={() => openConversation(conv)}>
                    <div className="chat-avatar">{getInitial(other?.name)}</div>
                    <div className="chat-info">
                      <h4>{other?.name || 'مستخدم'}</h4>
                      <p className="truncate">{lastMsg}</p>
                      {refCount > 0 && (
                        <span className="text-[10px] text-indigo-600 font-bold">{refCount} عنصر مرتبط</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400">{formatTime(conv.updatedAt)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {!activeConv ? (
          <div className={`chat-window ${showList ? 'mobile-hidden md:flex' : 'hidden md:flex'} items-center justify-center text-gray-400`}>
            <div className="text-center">
              <div className="text-5xl mb-2">💬</div>
              <p className="font-bold">اختر محادثة للبدء</p>
            </div>
          </div>
        ) : (
          <div className={`chat-window ${showList ? 'mobile-hidden' : ''}`}>
            <div className="window-header">
              <button type="button" className="back-mobile" onClick={backToList}>→</button>
              <div className="user-details">
                <div className="chat-avatar">{getInitial(getOther(activeConv)?.name)}</div>
                <div>
                  <h4 className="font-black text-sm m-0">{getOther(activeConv)?.name || 'مستخدم'}</h4>
                  <span className="text-[10px] text-gray-400">⏳ تُحذف بعد 4 أيام</span>
                </div>
              </div>
            </div>

            <ReferencedItemsBar items={referencedItems} onItemClick={goContext} />

            <div className="chat-messages">
              {messages.length === 0 && <p className="text-center text-gray-400 py-8">ابدأ المحادثة الآن 👋</p>}
              {messages.map((msg, i) => {
                const senderId = msg.sender?._id || msg.sender;
                const isMine = normalizeId(senderId) === normalizeId(myId) && !!myId;
                return (
                  <div
                    key={msg.clientKey || msg._id || i}
                    className={`msg-wrap ${isMine ? 'msg-wrap-mine' : 'msg-wrap-theirs'}`}
                  >
                    <div className={`msg ${isMine ? 'sent' : 'received'}`}>
                      {msg.replyTo?.text && (
                        <div className="msg-reply-quote">
                          <strong>{msg.replyTo.senderName}:</strong> {msg.replyTo.text}
                        </div>
                      )}
                      {msg.image && (
                        <img
                          src={resolveImageUrl(msg.image, { width: 600 })}
                          alt=""
                          className="max-w-[200px] rounded-lg mb-1 cursor-pointer"
                          onClick={() => window.open(msg.image, '_blank')}
                        />
                      )}
                      {msg.text && <p className="m-0 whitespace-pre-wrap">{msg.text}</p>}
                      <span className="msg-time">{formatTime(msg.createdAt)}</span>
                    </div>
                    <button
                      type="button"
                      className="msg-reply-btn"
                      onClick={() => setReplyTo(msg)}
                      aria-label="رد على الرسالة"
                      title="رد"
                    >
                      <CornerUpLeft size={16} />
                    </button>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {replyTo && (
              <div className="px-4 py-2 bg-indigo-50 flex justify-between items-center text-sm">
                <span>رداً على: {replyTo.text?.slice(0, 40)}</span>
                <button type="button" onClick={() => setReplyTo(null)}>✕</button>
              </div>
            )}

            {imagePreview && (
              <div className="px-4 py-2 flex items-center gap-2 border-t">
                <img src={imagePreview} alt="" className="w-12 h-12 rounded object-cover" />
                <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); }} className="text-red-500">✕</button>
              </div>
            )}

            <div className="chat-input-area">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xl">🖼️</button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder="اكتب رسالتك..."
                disabled={sending}
              />
              <button type="button" className="send-msg-btn" onClick={sendMessage} disabled={sending || (!text.trim() && !imageFile)}>
                {sending ? '⏳' : 'إرسال'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
