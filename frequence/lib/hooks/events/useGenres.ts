import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

export type GenreOption = { name: string; event_count: number };

export function useGenres() {
  const [genres, setGenres] = useState<GenreOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('get_active_genres');
      if (!cancelled && !error) setGenres((data as GenreOption[]) ?? []);
    })();
    return () => { cancelled = true; };
  }, []);

  return genres;
}