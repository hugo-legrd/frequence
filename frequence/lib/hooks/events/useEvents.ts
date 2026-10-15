import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Filters } from '../../components/FilterBar';

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
  genres: string[];
  sold_out: boolean;
  price_min: number | null;
  currency: string | null;
};

function getDateRange(dateFilter: string): { from: string; to: string} | null {
  const now = new Date();

  if (dateFilter === 'today') {
    // "Ce soir " = de 6h aujourd'hui à 6h demain
    // A 2h du matin on est encore dans la soirée d'hier
    const start = new Date(now);
    if (now.getHours() < 6) start.setDate(start.getDate() - 1);
    start.setHours(6, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return { from: start.toISOString(), to: end.toISOString() };
  }

  if (dateFilter === 'weekend') {
    // Du vendredi 18h au lundi 6h. Si on est déjà vendredi, samedi ou dimanche :
    // le week end en cours, sinon le prochain
    const daysSinceFriday = (now.getDay() + 2) % 7; // ven = 0, sam = 1, dim = 2 ... jeu = 6
    const friday = new Date(now);
    friday.setDate(now.getDate() + (daysSinceFriday <= 2 ? -daysSinceFriday : 7 - daysSinceFriday));
    friday.setHours(18, 0, 0, 0);
    const monday = new Date(friday);
    monday.setDate(friday.getDate() + 3);
    monday.setHours(6, 0, 0, 0);
    const from = friday > now ? friday : now; // pas d'événements déjà passés
    return { from: from.toISOString(), to: monday.toISOString() };
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
  const PAGE_SIZE = 10;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    setCurrentPage(0);
    setEvents([]);
    setHasMore(true);
    fetchEvents(0);
  }, [filters?.date, filters?.genres?.join(',')]);

  async function fetchEvents(pageNum: number) {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const isToday = filters?.date === 'today';
    const dateRange = filters?.date ? getDateRange(filters.date) : null;


    // Filtre genres: on récupère d'abord les ids concernés, puis on pagine dessus.
    let genreEventIds: string[] | null = null;
    if (filters?.genres && filters.genres.length > 0) {
      const { data : rows } = await supabase
        .from('event_genres')
        .select('event_id, genres!inner(name)')
        .in('genres.name', filters.genres);

      genreEventIds = [...new Set((rows ?? []).map((r: any) => r.event_id))];

      if (genreEventIds.length === 0) {
        if (pageNum === 0) { setEvents([]); setLoading(false); }
        else setLoadingMore(false);
        setHasMore(false);
        return;
      }
    }


    let query = supabase
      .from('events')
      .select(`
          id, name, starts_at, image_url, ticket_link, source, sold_out, price_min, currency,
          venues (id, name, address, latitude, longitude),
          artists (id, name, image_url),
          event_genres ( genres ( name ) )
        `)
        .order('starts_at', { ascending: true })
        .order('id', { ascending: true })
        .not('starts_at', 'is', null)
        .range(from, to);

    if (genreEventIds) {
      query = query.in('id', genreEventIds);
    }

    if (dateRange) {
      query = query
        .gte('starts_at', dateRange.from)
        .lte('starts_at', dateRange.to);
    } else {
      query = query.gte('starts_at', new Date().toISOString());
    } 

    const { data, error } = await query;

    if (error) {
      setError('Impossible de charger les événements.');
    } else {
      const mapped = (data ?? []).map((e: any) => ({
        ...e,
        venue: e.venues ?? null,
        artist: e.artists ?? null,
        genres: (e.event_genres ?? [])
          .map((eg: any) => eg.genres?.name)
          .filter(Boolean),
      }));


      if (pageNum === 0) {
        setEvents(mapped);
      } else {
        setEvents(prev => [...prev, ...mapped]);
      }
      setHasMore((data ?? []).length === PAGE_SIZE);
    }

    if (pageNum === 0) setLoading(false);
    else setLoadingMore(false);
  }
 
  function loadMore() {
    if (!hasMore || loading || loadingMore) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchEvents(nextPage);
  }

  return { events, loading, loadingMore, error, hasMore, loadMore };
}