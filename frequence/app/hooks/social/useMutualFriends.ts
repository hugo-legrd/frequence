import { useEffect, useState } from "react";
import { supabase } from "../../../lib/services/supabase";

export type MutualFriend = { id: string; display_name: string };

export function useMutualFriends(targetUserId: string) {
  const [mutuals, setMutuals] = useState<MutualFriend[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchMutuals() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!cancelled) setLoading(false); return; }

      const [namesResult, countResult] = await Promise.all([
        supabase.rpc('get_mutual_friends', {
          target_user_id: targetUserId,
          current_user_id: user.id,
        }),
        supabase.rpc('get_mutual_friends_count', {
          target_user_id: targetUserId,
          current_user_id: user.id,
        }),
      ]);

      if (cancelled) return;
      if (!namesResult.error) setMutuals(namesResult.data ?? []);
      if (!countResult.error) setTotalCount(countResult.data ?? 0);
      setLoading(false);
    }

    fetchMutuals();
    return () => { cancelled = true; };
  }, [targetUserId]);

  return { mutuals, totalCount, loading };
}