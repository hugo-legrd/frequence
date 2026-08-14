import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/services/supabase';

const LAST_SEEN_KEY = 'friends_last_seen_at';

export function useUnreadActivityCount() {
  const [count, setCount] = useState(0);

  async function refresh() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const lastSeen = await AsyncStorage.getItem(LAST_SEEN_KEY);
    const { data } = await supabase.rpc('get_friends_activity', {
      current_user_id: user.id,
      limit_count: 50,
    });

    if (!data) return;
    if (!lastSeen) { setCount(data.length); return; }

    const unread = data.filter((row: any) => new Date(row.created_at) > new Date(lastSeen));
    setCount(unread.length);
  }

  async function markAsSeen() {
    await AsyncStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    setCount(0);
  }

  useEffect(() => { refresh(); }, []);

  return { count, refresh, markAsSeen };
}