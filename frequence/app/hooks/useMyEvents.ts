import { useEffect, useState } from 'react';
import { supabase } from '../../lib/services/supabase';
import type { MyEventRow } from '../../lib/types/profile';

export function useMyEvents() {
  const [events, setEvents] = useState<MyEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchEvents() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase.rpc('get_my_events', {
      current_user_id: user.id,
    });

    if (error) console.error(error);
    else setEvents(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchEvents(); }, []);

  return { events, loading, refetch: fetchEvents};
}