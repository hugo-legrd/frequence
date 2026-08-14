import { useEffect, useState } from "react";
import { supabase } from '../../lib/services/supabase';
import type { FriendActivityRow } from '../../lib/types/activity';

export function useFriendsActivity() {
  const [activity, setActivity] = useState<FriendActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchActivity() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_friends_activity', {
        current_user_id: user.id,
      });

      if (cancelled) return;

      if (error) console.error(error);
      else setActivity(data ?? []);
      setLoading(false);
    }

    fetchActivity();
    return () => { cancelled = true; };
  }, []);

  return { activity, loading };
}
