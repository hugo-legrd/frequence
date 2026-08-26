import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/services/supabase';
import type { FriendGoing } from '../../../lib/types/friendsGoing';

export function useFriendsGoing(eventId: string) {
  const [friends, setFriends] = useState<FriendGoing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchFriends() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!cancelled) setLoading(false); return; }

      const { data, error } = await supabase.rpc('get_friends_going', {
        target_event_id: eventId,
        current_user_id: user.id,
      });

      if (cancelled) return;
      if (error) console.error(error);
      else setFriends(data ?? []);
      setLoading(false);
    }

    fetchFriends();
    return () => { cancelled = true };
  }, [eventId]);

  return { friends, loading };
}