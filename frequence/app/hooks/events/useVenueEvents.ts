// hooks/useVenueEvents.ts
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/services/supabase';

export type VenueEvent = {
  id: string;
  name: string;
  starts_at: string | null;
  image_url: string | null;
  artist: { name: string } | null;
};

export function useVenueEvents(venueId: string | null) {
  const [events, setEvents] = useState<VenueEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!venueId) {
      setEvents([]);
      return;
    }

    let cancelled = false;

    async function fetchEvents() {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          id, name, starts_at, image_url,
          artists (name)
        `)
        .eq('venue_id', venueId)
        .gte('starts_at', new Date().toISOString()) // uniquement les events à venir
        .order('starts_at', { ascending: true });

      if (cancelled) return;
      if (error) console.error(error);
      else {
        setEvents(
          (data ?? []).map((e: any) => ({
            id: e.id,
            name: e.name,
            starts_at: e.starts_at,
            image_url: e.image_url,
            artist: e.artists ?? null,
          }))
        );
      }
      setLoading(false);
    }

    fetchEvents();
    return () => { cancelled = true; };
  }, [venueId]);

  return { events, loading };
}