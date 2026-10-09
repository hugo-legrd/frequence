import { useCallback, useEffect, useState } from 'react';

import { AppState } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../../services/supabase';

const LAST_SEEN_KEY = 'friends_last_seen_at';

export function useUnreadActivityCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setCount(0);
      return;
    }

    const lastSeen = await AsyncStorage.getItem(LAST_SEEN_KEY);
    const { data, error } = await supabase.rpc(
      'get_unread_activity_count',
      lastSeen ? { since: lastSeen } : {},
    );

    if (error) {
      console.error(error);
      return;
    }
    if (typeof data === 'number') setCount(data);
  }, []);

  const markAsSeen = useCallback(async () => {
    await AsyncStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    setCount(0);
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
    }, [refresh]);

  return { count, refresh, markAsSeen };
}
