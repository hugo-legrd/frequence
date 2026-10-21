// hooks/useVenueEvents.ts
import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { timed } from '../../utils/perf';

export type VenueEvent = {
  id: string;
  name: string;
  starts_at: string | null;
  image_url: string | null;
  artist: { name: string } | null;
};

export function useVenueEvents(venueId: string | null, limit = 5) {
  const [events, setEvents] = useState<VenueEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!venueId) {
      setEvents([]);
      setTotal(0);
      return;
    }

    let cancelled = false;
    setLoading(true);

    timed(`Événements de la salle (${limit} max)`, async () => {
      const { data, error, count} = await supabase
        .from('events')
        .select('id, name, starts_at, image_url, artists (name)', { count: 'exact' })
        .eq('venue_id', venueId)
        .gte('starts_at', new Date().toISOString()) // uniquement les events à venir
        .order('starts_at', { ascending: true })
        .range(0, limit -1);
    
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0};
    }).then(result => {
      if (cancelled) return;
      if (result) {
        setEvents(
          result.rows.map((e: any) => ({
            id: e.id, 
            name: e.name,
            starts_at: e.starts_at,
            image_url: e.image_url,
            artist: e.artists ?? null,
          }))
        );
        setTotal(result.count);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [venueId, limit]);

  return { events, total, loading };
}