import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { getDateRange } from './useEvents';

export type NightEvent = {
  id: string;
  name: string;
  starts_at: string | null;
  image_url: string | null;
  category: string | null;
  sold_out: boolean;
  venue_name: string | null;
  artist_name: string | null;
  friends_count: number;
};

export type HomeNight = {
  pick: NightEvent | null;
  pick_friends: { name: string }[];
  others: NightEvent[];
  total: number;
  friends_out: number;
};

//Tout ce que l'accueil affiche pour ce soir ou ce week-end, en un seul appel
export function useNightPick(when: 'today' | 'weekend') {
  const [night, setNight] = useState<HomeNight | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const range = getDateRange(when);
    if (!range) return;

    const { data, error } = await supabase.rpc('get_home_night', {
      range_from: range.from,
      range_to: range.to,
    });

    if (error) console.error(error);
    else setNight(data as HomeNight);
    setLoading(false);
  }, [when]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { night, loading, refetch };
}