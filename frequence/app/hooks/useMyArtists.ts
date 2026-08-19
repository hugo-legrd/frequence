import { useEffect, useState } from 'react';
import { supabase } from '../../lib/services/supabase';

export type MyArtistRow = {
  artist_id: string;
  artist_name: string;
  image_url: string | null;
  events_count: number;
};

export function useMyArtists() {
  const [artists, setArtists] = useState<MyArtistRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: { user } } = await supabase.auth.getUser(); 
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase.rpc('get_my_artists', {
        current_user_id: user.id,
      });

      if (error) console.error(error);
      else setArtists(data ?? []);
      setLoading(false);
    }
    fetch();
  }, []);

  return { artists, loading };
}