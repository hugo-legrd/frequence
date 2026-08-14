import { useEffect, useState } from 'react';
import { supabase } from '../../lib/services/supabase';
import type { PublicProfile } from '../../lib/types/publicProfile';

export function usePublicProfile(userId: string) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      setLoading(true);
      const { data: { user }} = await supabase.auth.getUser();
      if (!user) { if (!cancelled) setLoading(false); return; }

      const { data, error } = await supabase.rpc('get_public_profile', {
        target_user_id: userId,
        current_user_id: user.id,
      });

      if (cancelled) return;
      if (error) console.error(error);
      else setProfile(data?.[0] ?? null);
      setLoading(false);
    }

    fetchProfile();
    return () => { cancelled = true };
  }, [userId]);

  return { profile, loading, setProfile };
}