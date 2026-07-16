import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Send, Loader2 } from 'lucide-react';
import axios from '../api/axios';
import { resolveImageUrl } from '../utils/mediaUrl';

const getMyId = () => {
  try {
    return JSON.parse(localStorage.getItem('user'))?._id || null;
  } catch {
    return null;
  }
};

const ChatConversation = () => {
  const { convId } = useParams();
  const navigate = useNavigate();
  const myId = getMyId();

  const [messages, setMessages] = useState([]);
  const [otherName, setOtherName] = useState('المحادثة');
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(`/chats/${convId}`);
      setMessages(data.messages || []);
    } catch {
      /* تجاهل */
    } finally {
      setLoading(false);
    }
  };

  const fetchHeader = async () => {
    try {
      const { data } = await axios.get('/chats');
      const conv = (data.conversations || []).find((c) => c._id === convId);
      if (conv) {
        const other = (conv.participants || []).find((p) => p._id !== myId);
        if (other) setOtherName(other.name || 'المحادثة');
      }
    } catch {
      /* تجاهل */
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchHeader();
    // تحديث دوري بسيط للرسائل الواردة
    const t = setInterval(fetchMessages, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      const { data } = await axios.post(`/chats/${convId}`, { text: value });
      setMessages((prev) => [...prev, data.message]);
      setText('');
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <button onClick={() => navigate('/chat')} className="text-gray-500"><ChevronRight size={24} /></button>
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">
          {otherName?.[0] || '؟'}
        </div>
        <h2 className="font-black text-gray-900">{otherName}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-center text-gray-400 font-bold py-8 text-sm">ابدأ المحادثة الآن</p>
        )}
        {messages.map((m) => {
          const mine = (m.sender?._id || m.sender) === myId;
          return (
            <div key={m._id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm font-medium whitespace-pre-wrap break-words ${
                mine ? 'bg-primary text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                {m.text}
                {m.image && (
                  <img
                    src={resolveImageUrl(m.image, { width: 600 })}
                    className="mt-2 rounded-xl max-w-full"
                    alt=""
                  />
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب رسالة..."
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button type="submit" disabled={sending || !text.trim()}
          className="bg-primary text-white p-3 rounded-2xl disabled:opacity-50">
          {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
};

export default ChatConversation;
