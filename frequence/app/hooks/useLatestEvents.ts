import { useEffect, useState } from "react";
import { supabase } from "../../lib/services/supabase";
import type { LatestEvent } from "../../lib/types/home";

export function useLatestEvents() {
  const [events, setEvents] = useState<LatestEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('id, image_url')
        .order('created_at', { ascending: false})
        .limit(2)

      if (error) console.error(error);
      else setEvents(data ?? []);
      setLoading(false);
    }
    fetchEvents();
  }, []);
  
  return { events, loading };
}