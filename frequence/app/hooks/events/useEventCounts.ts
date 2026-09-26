import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/services/supabase';

export type EventCounts = {
  interested_count: number;
  going_count: number;
  friends_going: number;
  friends_interested: number;
};

export function useEventCounts(eventIds: string[]) {
  const [counts, setCounts] = useState<Record<string, EventCounts>>({});
  const key = eventIds.join(',');

  useEffect(() => {
    if (eventIds.length === 0) return;
    let cancelled = false;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || cancelled) return;

      const { data, error } = await supabase.rpc('get_event_counts', {
        event_ids: eventIds,
        current_user_id: auth.user.id,
      });

      if (cancelled || error || !data) return;

      const map: Record<string, EventCounts> = {};
      for (const row of data as any[]) {
        map[row.event_id] = {
          interested_count: Number(row.interested_count),
          going_count: Number(row.going_count),
          friends_going: Number(row.friends_going),
          friends_interested: Number(row.friends_interested)
        };
      }
      setCounts(map);
    })();

    return () => { cancelled = true; };
  }, [key]);

  return counts;
}