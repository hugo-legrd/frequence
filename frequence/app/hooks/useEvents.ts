import { useState, useEffect } from 'react';
import { supabase } from '../../lib/services/supabase';

export type Event = {
  id: string;
  name: string;
  starts_at: string | null;
  image_url: string | null;
  ticket_link: string | null;
  source: string | null;
  venue: {
    id: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null; 
  } | null;
  artist: {
    id: string;
    name: string; 
    image_url: string | null;
  } | null;
};


export function useEvents(filters?: { genre?: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);

      let query = supabase 
        .from('events')
        .select(`
          id,
          name,
          starts_at,
          image_url,
          ticket_link,
          source,
          venues (
            id,
            name,
            address,
            latitude,
            longitude
          ),
          artists (
            id,
            name,
            image_url
          )
        `)
        .order('starts_at', { ascending: true})
        .not('starts_at', 'is', null);

      if (filters?.genre) {
        query = query.contains('style', [filters.genre]);
      }

      const { data, error } = await query;

      if (error) {
        setError('Impossible de charger les événements.');
        console.error(error);
      } else {
        setEvents(
          (data ?? []).map((e: any) => ({
            ...e,
            venue: e.venues ?? null,
            artist: e.artists ?? null,
          }))
        );
      }

      setLoading(false);
    }

    fetchEvents()

  }, [filters?.genre]);

  return { events, loading, error };
}