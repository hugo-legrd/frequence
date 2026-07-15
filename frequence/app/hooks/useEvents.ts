import { useState, useEffect } from 'react';
import { supabase } from '../../lib/services/supabase';
import { Filters } from '../components/FilterBar';

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

function getDateRange(dateFilter: string): { from: string; to: string} | null {
  const now = new Date();

  if (dateFilter === 'tonight') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }

  if (dateFilter === 'weekend') {
    const day = now.getDay();
    const diffToSat = (6 - day + 7) % 7;
    const sat = new Date(now);
    sat.setDate(now.getDate() + diffToSat);
    sat.setHours(0, 0, 0, 0);
    const sun = new Date(sat);
    sun.setDate(sat.getDate() + 1);
    sun.setHours(23, 59, 59, 999);
    return { from: sat.toISOString(), to: sun.toISOString() };
  }

  if (dateFilter === 'week') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(now.getDate() + 7);
    end.setHours(23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }

  if (dateFilter === 'month') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }

  return null;
}

export function useEvents(filters?: Filters) {
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
          id, name, starts_at, image_url, ticket_link, source,
          venues (id, name, address, latitude, longitude),
          artists (id, name, image_url)
        `)
        .order('starts_at', { ascending: true })
        .not('starts_at', 'is', null);

      // Filtre date
      const dateRange = filters?.date ? getDateRange(filters.date) : null;
      if (dateRange) {
        query = query
          .gte('starts_at', dateRange.from)
          .lte('starts_at', dateRange.to);
      }

      const { data, error } = await query;

      if (error) {
        setError('Impossible de charger les événements.');
        console.error(error);
      } else {
        let results = (data ?? []).map((e: any) => ({
          ...e,
          venue: e.venues ?? null,
          artist: e.artists ?? null,
        }));

        // Filtre genre côté client (pas de colonne genre en base pour l'instant)
        if (filters?.genres && filters.genres.length > 0) {
          results = results.filter((e: Event) =>
            filters.genres.some(g =>
              e.name.toLowerCase().includes(g.toLowerCase()) ||
              e.artist?.name.toLowerCase().includes(g.toLowerCase())
            )
          );
        }
        
        setEvents(results);
      }

      setLoading(false);
    }

    fetchEvents();
  }, [filters?.date, filters?.genres?.join(',')]);

  return { events, loading, error };
}