import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/services/supabase';

export type UserSearchResult = {
  id: string;
  display_name: string | null;
  is_following: boolean;
};

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

export function useUserSearch(query: string) {
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null >(null);

  useEffect(() => {
    if (query.trim().length < MIN_CHARS) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setLoading(true);
      const { data, error } = await supabase.rpc('search_users', {
        search_term: query.trim(),
        current_user_id: user.id,
      });
      if (!error) setResults(data ?? []);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { results, loading };
}