import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../lib/services/supabase';
import {
  getArtistTopTags,
  getSimilarArtists,
  getTopArtistsByTag,
  LastFmArtist,
} from '../../../lib/services/lastfm';
import { getArtistImage } from '../../../lib/services/deezer';

const CACHE_KEY = 'ecommendations_cache';
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
    loadRecommendations();
  }, []);

  async function loadRecommendations() {
    await AsyncStorage.removeItem(CACHE_KEY);
    try {
      // Vérifier le cache 24h
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setRecommendations(data);
          setLoading(false);
          return;
        }
      }

      // Récupérer les genres de l'utilisateur
      const genres = await getUserGenres();
      if (genres.length === 0) {
        setLoading(false);
        return;
      }

      // Pour chaque genre, récupérer les top artistes
      const artistsMap = new Map<string, LastFmArtist>();

      for (const genre of genres.slice(0, 3)) {
        const artists = await getTopArtistsByTag(genre, 5);
        for (const artist of artists) {
          if (!artistsMap.has(artist.name)) {
            artistsMap.set(artist.name, artist);
          }
        }
      }

      // Pour chaque artiste, récupérer des artistes similaires
      const similarMap = new Map<string, LastFmArtist>();
      const baseArtists = Array.from(artistsMap.values()).slice(0, 3);

      for (const baseArtist of baseArtists) {
        const similar = await getSimilarArtists(baseArtist.name, 5);
        for (const artist of similar) {
          if (!similarMap.has(artist.name) && !artistsMap.has(artist.name)) {
            // Enrichir avec les tags
            const tags = await getArtistTopTags(artist.name);
            similarMap.set(artist.name, { ...artist, tags });
          }
        }
      }

      // Fusionner, dédupliquer, trier par match
      const all = Array.from(similarMap.values())
        .sort((a, b) => b.match - a.match)
        .slice(0,10)
        .map(a => ({
          name: a.name,
          match: Math.round(a.match * 100),
          tags: a.tags.slice(0, 2),
          initials: getInitials(a.name),
          color: getAvatarColor(a.name),
        }));

        const enriched = await Promise.all(
          all.map(async artist => {
            const imageUrl = await getArtistImage(artist.name);
            return { ...artist, imageUrl };
          })
        );

        setRecommendations(enriched);

        // Mettre en cache 24h
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
          data: enriched,
          timestamp: Date.now(),
        }));

    } catch (err) {
      console.warn('⚠️ Recommendations error:', err);
    } finally {
      setLoading(false);
    }
  }

  return { recommendations, loading };
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
