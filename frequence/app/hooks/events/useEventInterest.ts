import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/services/supabase";
import type { InterestStatus } from "../../../lib/types/event"; 

type ActiveStatus = NonNullable<InterestStatus>;

/**
 * Cache module-level : la card d'un concert dans la liste et l'écran de détail
 * pointent sur le même événement. Sans ça, un tap sur l'un ne se reflète pas
 * sur l'autre tant qu'on n'a pas refetch.
 */
const cache = new Map<string, InterestStatus | null>();
const listeners = new Map<string, Set<(s: ActiveStatus | null) => void>>();

function broadcast(eventId: string, status: ActiveStatus | null) {
  cache.set(eventId, status);
  listeners.get(eventId)?.forEach((fn) => fn(status));
}

function subscribe(eventId: string, fn: (s: ActiveStatus | null) => void) {
  if (!listeners.has(eventId)) listeners.set(eventId, new Set());
  listeners.get(eventId)!.add(fn);
  return () => {
    const set = listeners.get(eventId);
    set?.delete(fn);
    if (set && set.size === 0) listeners.delete(eventId);
  };
}

/** À appeler après un logout : sinon le statut du compte précédent persiste. */
export function clearInterestCache() {
  cache.clear();
}

export function useEventInterest(eventId: string | undefined) {
  const [status, setStatus] = useState<ActiveStatus | null>(
    eventId ? cache.get(eventId) ?? null : null
  );
  const [loading, setLoading] = useState(!!eventId && !cache.has(eventId ?? ''));
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!eventId) return;
    return subscribe(eventId, setStatus);
  }, [eventId]);

  useEffect(() => {
    if (!eventId || cache.has(eventId)) { 
      setLoading(false);
      return;
  }
  let cancelled = false;
  
  (async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      if (!cancelled) setLoading(false);
      return;
    }

    const { data, error: err } = await supabase
      .from('interests')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (cancelled) return;
    if (err) setError(err);
    else broadcast(eventId, (data?.status as ActiveStatus) ?? null);
    setLoading(false);
  })();

    return () => {
      cancelled = true;
    };
  }, [eventId]);


  /**
   * Toggle 3 états : retaper le statut courant repasse à neutre.
   * L'UI est mise à jour avant la réponse réseau, et restaurée en cas d'échec.
   */
  const setInterest = useCallback(
    async (next: ActiveStatus) => {
      if (!eventId) return;

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setError(new Error('Connecte-toi pour enregistrer ton intérêt'));
        return;
      }

      const previous = cache.get(eventId) ?? null;
      const target = previous === next ? null : next;
      
      broadcast(eventId, target);
      setError(null);

      const query =
        target === null
          ? supabase
            .from('interests')
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', auth.user.id)
          : supabase
            .from('interests')
            .upsert(
              { event_id: eventId, user_id: auth.user.id, status: target },
              { onConflict: 'user_id,event_id' }
            );

      const { error: err } = await query;
      
      if (err) {
        broadcast(eventId, previous);
        setError(err);
      }
    },
    [eventId]
  );

  return {
    status,
    isInterested: status === 'interested',
    isGoing: status === 'going',
    loading, 
    error,
    setInterest,
  };
}