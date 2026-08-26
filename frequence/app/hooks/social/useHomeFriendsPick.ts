import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/services/supabase';
import type { FriendsPick } from '../../../lib/types/home';

export function useHomeFriendsPick() {
  const [pick, setPick] = useState<FriendsPick | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPick() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase.rpc('get_home_friends_pick', {
        current_user_id: user.id,
      });

      if (error) console.error(error);
      else setPick(data?.[0] ?? null);
      setLoading(false);
    }
    fetchPick();
  }, []);
  return { pick, loading };
}