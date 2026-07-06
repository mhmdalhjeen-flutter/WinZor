import { useCallback, useEffect, useState } from 'react';
import axios from '../api/axios';

let cachedCount = 0;
let cacheAt = 0;
let inFlight = null;
let subscribers = new Set();

async function fetchUnreadCount() {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const { data } = await axios.get('/chats/unread-count');
      cachedCount = data?.count || 0;
    } catch {
      cachedCount = 0;
    }
    cacheAt = Date.now();
    subscribers.forEach((fn) => fn(cachedCount));
    return cachedCount;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

export default function useAdminChatUnread(enabled = true) {
  const [count, setCount] = useState(cachedCount);

  const refresh = useCallback(async () => {
    const value = await fetchUnreadCount();
    setCount(value);
    return value;
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const listener = (value) => setCount(value);
    subscribers.add(listener);

    if (cacheAt) {
      setCount(cachedCount);
    } else {
      fetchUnreadCount();
    }

    return () => {
      subscribers.delete(listener);
    };
  }, [enabled]);

  return { count, refresh };
}
