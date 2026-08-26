import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/services/supabase';
import type { MyProfile } from '../../../lib/types/profile';

export function useMyProfile() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase.rpc('get_my_profile', {
      current_user_id: user.id,
    });

    if (error) console.error(error);
    else setProfile(data?.[0] ?? null);
    setLoading(false);
  }

  useEffect(() => { fetchProfile(); }, []);

  return { profile, loading, refetch: fetchProfile };
}