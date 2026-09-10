import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/services/supabase";

export type FollowListUser = {
  id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  is_following: boolean;
};

export function useFollowList(targetUserId: string | undefined, kind: 'followers' | 'following') {
  const [users, setUsers] = useState<FollowListUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const target = targetUserId ?? auth.user.id;
    const { data, error } = await supabase.rpc('get_follow_list', {
      target_user_id: target,
      current_user_id: auth.user.id,
      kind,
    });

    if (!error) setUsers((data as FollowListUser[]) ?? []);
    setLoading(false);
  }, [targetUserId, kind]);

  useEffect(() => { fetchList(); }, [fetchList]);

  return { users, loading, refetch: fetchList };
}