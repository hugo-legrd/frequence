import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../services/supabase';
import {
  getArtistTopTags,
  getSimilarArtists,
  getTopArtistsByTag,
  LastFmArtist,
} from '../../services/lastfm';
import { getArtistImage } from '../../services/deezer';
import { timed } from '../../utils/perf';

const CACHE_KEY = 'recommendations_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

export type ArtistRecommendation = {
  name: string;
  match: number;
  tags: string[];
  initials: string;
  color: string;
  imageUrl: string | null;
};


// Couleurs pour les avatars - générées depuis le nom de l'artiste
const AVATAR_COLORS = [
  '#a78bfa', '#f97316', '#60a5fa',
  '#34d399', '#f472b6', '#facc15',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<ArtistRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    timed('Recommandations', loadRecommendations).then(result => {
      if (cancelled) return;
      if (result) setRecommendations(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);
  return { recommendations, loading };
}

async function loadRecommendations() {
  const cached = await AsyncStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) return data;
    } catch {
      // cache illisible : on recalcule
    }
  }

  // Récupérer les genres de l'utilisateur
  const genres = await getUserGenres();
  if (genres.length === 0) return [];

  // 2. le top artistes des 3 premiers genres, tous en même temps
  const byTag = await Promise.all(
    genres.slice(0, 3).map(genre => getTopArtistsByTag(genre, 5).catch(() => [] as LastFmArtist[]))
  );
  const artistsMap = new Map<string, LastFmArtist>();
    for (const list of byTag) {
      for (const artist of list) {
          if (!artistsMap.has(artist.name)) artistsMap.set(artist.name, artist);
      }
    }

  // 3. Les artsistes similaires au 3 premiers, tous en même temps
  const baseArtists = Array.from(artistsMap.values()).slice(0, 3);
  const similarLists = await Promise.all(
    baseArtists.map(a => getSimilarArtists(a.name, 5).catch(() => [] as LastFmArtist[]))
  );
  const similarMap = new Map<string, LastFmArtist>();
  for (const list of similarLists) {
    for (const artist of list) {
        if (!similarMap.has(artist.name) && !artistsMap.has(artist.name)) {
          similarMap.set(artist.name, artist);
        }
      }
    }

    // 4. On garde les 10 meilleurs, puis tags + image en parallèle (seulement pour ces 10)
    const top = Array.from(similarMap.values())
      .sort((a, b) => b.match - a.match)
      .slice(0,10)
        
    const enriched = await Promise.all(
          top.map(async a => {
            const [tags, imageUrl] = await Promise.all([
              getArtistTopTags(a.name).catch(() => [] as string[]),
              getArtistImage(a.name).catch(() => null),
            ]);
            return { 
              name: a.name, 
              match: Math.round(a.match * 100),
              tags: tags.slice(0, 2),
              initials: getInitials(a.name),
              color: getAvatarColor(a.name),
              imageUrl,
            };
          })
        );

    // 5. Mise en cache pour 24h
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: enriched, timestamp: Date.now() }));
    return enriched;
}

async function getUserGenres(): Promise<string[]> {
  // Essai depuis Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data } = await supabase
      .from('user_genres')
      .select('genres(name)')
      .eq('user_id', user.id)
    if (data && data.length > 0) {
      return data.map((row: any) => row.genres?.name).filter(Boolean);
    }
  }

  // Fallback AsyncStorage
  const local = await AsyncStorage.getItem('user_genres');
  if (local) return JSON.parse(local);

  return [];
}
