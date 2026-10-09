import { useEffect, useState } from "react";
import { supabase } from '../../services/supabase';
import type { FriendActivityRow } from '../../types/activity';

export function useFriendsActivity() {
  const [activity, setActivity] = useState<FriendActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  
  async function fetchActivity() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc('get_friends_activity', {
      current_user_id: user.id,
    });

    if (error) console.error(error);
    else setActivity((data ?? []) as FriendActivityRow[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchActivity();
  }, []);

  return { activity, loading, refetch: fetchActivity };
}
