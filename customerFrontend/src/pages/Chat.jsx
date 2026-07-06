import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Loader2, ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import { queryKeys } from '../lib/queryClient';
import { getStoredUser } from '../utils/safeStorage';
import { getUnreadCountForUser } from '../utils/unreadCount';

const getMyId = () => {
  const user = getStoredUser(null);
  return user?._id || user?.id || null;
};

const Chat = () => {
  const navigate = useNavigate();
  const myId = getMyId();
  const { data: conversations = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.chats,
    queryFn: async () => {
      const { data } = await axios.get('/chats');
      return data.conversations || [];
    },
  });

  return (
    <div className="space-y-4 text-right pb-24" dir="rtl">
      <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
        <MessageCircle className="text-primary" size={24} /> المحادثات
      </h1>

      {loading && (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" size={28} /></div>
      )}

      {!loading && conversations.length === 0 && (
        <p className="text-center text-gray-400 font-bold py-12 text-sm">لا توجد محادثات بعد</p>
      )}

      <div className="space-y-2">
        {conversations.map((conv) => {
          const other = (conv.participants || []).find((p) => p._id !== myId) || {};
          const unread = getUnreadCountForUser(conv.unreadCount, myId);
          return (
            <div
              key={conv._id}
              onClick={() => navigate(`/chat/${conv._id}`)}
              className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">
                  {other.name?.[0] || '؟'}
                </div>
                <div>
                  <h4 className="font-black text-gray-900">{other.name || 'مستخدم'}</h4>
                  <p className="text-[11px] text-gray-400 font-bold line-clamp-1">
                    {conv.lastMessage?.text || conv.context?.itemName || 'محادثة'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <span className="bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{unread}</span>
                )}
                <ChevronLeft size={18} className="text-gray-300" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Chat;
