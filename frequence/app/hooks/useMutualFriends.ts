import { useEffect, useState } from "react";
import { supabase } from "../../lib/services/supabase";

export type MutualFriend = { id: string; display_name: string };

export function useMutualFriends(targetUserId: string) {
  const [mutuals, setMutuals] = useState<MutualFriend[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchMutuals() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!cancelled) setLoading(false); return; }

      const { data, error } = await supabase.rpc('get_mutual_friends', {
        target_user_id: targetUserId,
        current_user_id: user.id,
      });

      if (cancelled) return;
      if (!error) setMutuals(data ?? []);
      setLoading(false);
    }

    fetchMutuals();
    return () => { cancelled = true; };
  }, [targetUserId]);

  return { mutuals, loading };
}