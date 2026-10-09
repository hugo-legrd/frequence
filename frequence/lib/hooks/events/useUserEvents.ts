import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import type { MyEventRow } from '../../types/profile';

export function useUserEvents(userId: string | undefined, enabled: boolean) {
  const [events, setEvents] = useState<MyEventRow[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!userId || !enabled) {
      setEvents([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || cancelled) return;

      const { data, error } = await supabase.rpc('get_user_events', {
        target_user_id: userId,
        current_user_id: auth.user.id,
      });

      if (cancelled) return;
      if (!error) setEvents((data as MyEventRow[]) ?? []);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [userId, enabled]);

  return { events, loading };
}