import { useCallback, useEffect, useState } from "react";
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../services/supabase';

// Savoir si l'utilisateur suit une salle, et la suivre / ne plus la suivre.
export function useVenueFollow(venueId: string | null | undefined) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Au changement de salle: est-ce que je la suis déjà?
  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!venueId) {
        setFollowing(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setFollowing(false);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from('venue_follows')
        .select('venue_id')
        .eq('user_id', user.id)
        .eq('venue_id', venueId)
        .maybeSingle();

      if (cancelled) return;
      if (error) console.error(error);
      setFollowing(Boolean(data));
      setLoading(false); 
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [venueId]);

  const toggle = useCallback(async () => {
    if (!venueId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/(auth)/login');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // On met à jour le bouton tout de suite, sans attendre Supabase
    const next = !following;
    setFollowing(next);

    const { error } = next
      ? await supabase
        .from('venue_follows')
        .insert({ user_id : user.id, venue_id: venueId })
      : await supabase
        .from('venue_follows')
        .delete()
        .eq('user_id', user.id)
        .eq('venue_id', venueId);

    // En cas d'erreur, on remet le bouton comme avant
    if (error) {
      console.error(error);
      setFollowing(!next);
    }
  }, [venueId, following]);

  return { following, loading, toggle };
}