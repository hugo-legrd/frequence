import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/services/supabase';
import { getArtistImage } from '../../../lib/services/deezer';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MyArtistRow = {
  artist_id: string;
  artist_name: string;
  image_url: string | null;
  events_count: number;
};

const CACHE_KEY = 'artist_mages_cache';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type CacheEntry = { url: string | null; fetchedAt: number };
type Cache = Record<string, CacheEntry>;

async function loadCache(): Promise<Cache> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveCache(cache: Cache) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export function useMyArtists() {
  const [artists, setArtists] = useState<MyArtistRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchArtists() {
      const { data: { user } } = await supabase.auth.getUser(); 
      if (!user) { if (!cancelled) setLoading(false); return; }

      const { data, error } = await supabase.rpc('get_my_artists', {
        current_user_id: user.id,
      });

      if (cancelled) return;
      if (error) { console.error(error); setLoading(false); return; };
      
      const rows = data ?? [];
      const cache = await loadCache();
      const now = Date.now();

      const enriched = await Promise.all(
        rows.map(async (row: { artist_id: string; artist_name: string; events_count: number }) => {
          const cached = cache[row.artist_name];
          const isCacheValid = cached && (now - cached.fetchedAt) < CACHE_TTL_MS;

          const image_url = isCacheValid
            ? cached.url
            : await getArtistImage(row.artist_name);

          if (!isCacheValid) {
            cache[row.artist_name] = { url: image_url, fetchedAt: now };
          }

          return { ...row, image_url };
        })
      );

      if (cancelled) return;
      setArtists(enriched);
      setLoading(false);
      saveCache(cache);
    }
    fetchArtists();
    return () => { cancelled = true };
  }, []);

  return { artists, loading };
}