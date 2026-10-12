import { useState } from 'react';
import { supabase } from '../../services/supabase';

// 'following' = abonné, 'requested' = demande envoyée (compte privé), null = échec
export type FollowResult = 'following' | 'requested' | null;

// Etat du bouton Suivre dans les listes
export type FollowState = 'none' | 'requested' | 'following';

export function initialFollowState(user: { is_following: boolean; has_requested?: boolean }): FollowState {
  if (user.is_following) return 'following';
  return user.has_requested ? 'requested' : 'none';
}

export const FOLLOW_LABELS: Record<FollowState, string> = {
  none: 'Suivre',
  requested: 'Demandé',
  following: 'Suivi',
};

export function useFollow() {
  const [loading, setLoading] = useState(false);

  
  // Abonnement direct si le compte est public, demande d'abonnement s'il est privé
  async function follow(targetUserId: string): Promise<FollowResult> {  
    setLoading(true);
    const { data, error } = await supabase.rpc('follow_user', { target: targetUserId });
    setLoading(false);

    if (error) {
      console.error(error);
      return null;
    }
    return data === 'requested' ? 'requested' : 'following';
  }

  async function unfollow(targetUserId: string) {
    const { data: { user }} = await supabase.auth.getUser();
    if (!user) return false;

    setLoading(true);
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId);
    setLoading(false);

    return !error;
  }

  async function cancelRequest(targetUserId: string) {
    setLoading(true);
    const { error } = await supabase.rpc('cancel_follow_request', { target: targetUserId });
    setLoading(false);

    if (error) console.error(error);
    return !error;
  }

  // Passe à l'état suivant et renvoie l'état réel après l'appel (null si échec)
  // abonné -> désabonné · demandé -> demande annulée · rien -> abonné ou demandé selon le compte
  async function toggle(targetUserId: string, current: FollowState): Promise<FollowState | null> {
    if (current === 'following') return (await unfollow(targetUserId)) ? 'none' : null;
    if (current === 'requested') return (await cancelRequest(targetUserId)) ? 'none' : null;
    return follow(targetUserId);
  }
  
  return { follow, unfollow, cancelRequest, toggle, loading };
}