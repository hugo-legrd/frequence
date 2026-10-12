import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from '../../services/supabase';

export type FollowRequest = {
  requester_id: string;
  name: string | null;
  handle: string | null;
  avatar_url : string | null;
  requested_at: string;
};

// Demandes d'abonnement reçues par l'utilisateur connecté (comptes privés)
export function useFollowRequests() {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const requestsRef = useRef<FollowRequest[]>([]);
  // Nom de channel unique par instance: le hook est utilisé à l fois dans amis.tsx et requests.tsx
  const channelSuffix = useRef(Math.random().toString(36).slice(2, 8));

  const apply = useCallback((rows: FollowRequest[]) => {
    requestsRef.current = rows;
    setRequests(rows);
  }, []);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_follow_requests');
    if (error) console.error(error);
    else apply((data ?? []) as FollowRequest[]);
    setLoading(false);
  }, [apply]);

  // Retire la demande de la liste tout de suite, la remet en cas d'échec
  const respond = useCallback(async (requesterId: string, accept: boolean) => {
    const before = requestsRef.current;
    apply(before.filter(r => r.requester_id !== requesterId));

    const { error } = await supabase.rpc('respond_follow_request', {
      requester: requesterId,
      accept,
    });

    if (error) {
      console.error(error);
      apply(before);
      return false;
    }
    return true;
  }, [apply]);

  const accept = useCallback((requesterId: string) => respond(requesterId, true), [respond]);
  const refuse = useCallback((requesterId: string) => respond(requesterId, false), [respond]);

  useEffect(() => {
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    (async () => {
      await refresh();

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId || cancelled) return;

      // Nouvelle demande reçue : on recharge la liste
      // (une demande annulée par son auteur disparaît au prochain rechargement)
      channel = supabase
        .channel(`follow-requests-${userId}-${channelSuffix.current}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'follow_requestes', filter: `target_id=eq.${userId}` },
          () => { refresh(); })
          .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { requests, loading, refresh, accept, refuse };
}