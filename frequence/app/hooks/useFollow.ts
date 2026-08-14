import { useState } from 'react';
import { supabase } from '../../lib/services/supabase';

export function useFollow() {
  const [loading, setLoading] = useState(false);

  async function follow(targetUserId: string) {
    const { data: { user }} = await supabase.auth.getUser();
    if (!user) return false;
    
    setLoading(true);
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: targetUserId });
    setLoading(false);

    return !error;
  }

  async function unfollow(targetUserId: string) {
    const { data: { user }} = await supabase.auth.getUser();
    if (!user) return false;

    setLoading(true);
    const { error } = await supabase
      .from('fellows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId);
    setLoading(false);

    return !error;
  }

  return { follow, unfollow, loading};
}