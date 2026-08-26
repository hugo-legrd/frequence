import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/services/supabase';
import type { RandomEvent } from '../../../lib/types/home';

export function useRandomEvent() {
  const [event, setEvent] = useState<RandomEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      const { data, error } = await supabase.rpc('get_random_upcoming_event');
      if (error) console.error(error);
      else setEvent(data?.[0] ?? null);
      setLoading(false);
    }
    fetchEvent();
  }, []);

  return { event, loading };
}