import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export type FriendSuggestion = {
  id: string;
  display_name: string; 
  handle: string | null;
  avatar_url: string | null;
  mutual_count: number;
  shared_events: number;
  shared_genres: number;
  top_genre: string | null;
};

// Des gens à suivre, avec au moins un point commun (amis, soirées ou genres)
export function useFriendSuggestions(maxResults = 10) {
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_friend_suggestions', {
      max_results: maxResults,
    });
    if (error) console.error(error);
    else setSuggestions((data ?? []) as FriendSuggestion[]);
    setLoading(false);
  }, [maxResults]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { suggestions, loading, refetch };
}

// La raison affichée sous le nom, de la plus forte à la plus faible
export function suggestionReason(s: FriendSuggestion): string {
  if (s.mutual_count > 0) {
    return s.mutual_count === 1
      ? 'Suivi par un de tes amis'
      : `Suivi par ${s.mutual_count} de tes amis`;
  }
  if (s.shared_events > 0) {
    return s.shared_events === 1
      ? 'Une soirée en commun'
      : `${s.shared_events} soirées en commun`;
  }
  if (s.top_genre) return `Aime aussi ${s.top_genre}`;
  return 'Goûts musicaux proches';
}