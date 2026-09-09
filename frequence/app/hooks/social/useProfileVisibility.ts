import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/services/supabase';

export type Visibility = 'public' | 'followers';

export function useProfileVisibility() {
  const [visibility, setVisibility] = useState<Visibility | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
        if (!auth.user || cancelled) return;

        const { data } = await supabase
          .from('users')
          .select('profile_visibility')
          .eq('id', auth.user.id)
          .maybeSingle();

        if (!cancelled) setVisibility((data?.profile_visibility as Visibility) ?? 'public');
    })();
    return () => { cancelled = true; }; 
  }, []);

  const update = useCallback(async (next: Visibility) => {
    const previous = visibility;
    setVisibility(next);
    setSaving(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc('set_my_visibility', { visibility: next });
    setSaving(false);

    if (rpcError) {
      setVisibility(previous);
      setError('Impossible d\'enregistrer ce réglage.');
    }
  }, [visibility]);

  return { visibility, update, saving, error };
}