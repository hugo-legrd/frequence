import { useCallback, useEffect, useRef, useState } from "react";

import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from '../../services/supabase';

import type { FriendActivityRow } from '../../types/activity';

const PAGE_SIZE = 30;
// Supabase Realtime accepte au plus 100 valeurs dans un filtre 'in'
const MAX_REALTIME_IDS = 100;

// Id stable d'une activité : un ami n'a qu'une ligne par concert et par personne suivie
function activityKey(row: FriendActivityRow): string {
  return `${row.kind}-${row.actor_id}-${row.event_id ?? row.target_user_id}`;
}

// Place les lignes fraîches en tête sans perdre les pages déjà chargées plus bas
function mergeFresh(prev: FriendActivityRow[], fresh: FriendActivityRow[]): FriendActivityRow[] {
  if (fresh.length < PAGE_SIZE) return fresh;
  const freshKeys = new Set(fresh.map(activityKey));
  const oldest = fresh[fresh.length - 1].activity_at;
  const older = prev.filter(r => !freshKeys.has(activityKey(r)) && r.activity_at < oldest);
  return [...fresh, ...older];
}

export function useFriendsActivity() {
  const [activity, setActivity] = useState<FriendActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [followingIds, setFollowingIds] = useState<string[] | null>(null);

  const activityRef = useRef<FriendActivityRow[]>([]);
  const loadingMoreRef = useRef(false);

  const applyActivity = useCallback((rows: FriendActivityRow[]) => {
    activityRef.current = rows;
    setActivity(rows);
  }, []);

  const fetchFirstPage = useCallback(async (mode: 'reset' | 'merge' = 'reset') => {
    const { data, error } = await supabase.rpc('get_friends_activity', { limit_count: PAGE_SIZE });

    if (error) {
      console.error(error);
      setError("Impossible de charger l'activité");
    } else {
      const rows = (data ?? []) as FriendActivityRow[];
      applyActivity(mode === 'merge' ? mergeFresh(activityRef.current, rows) : rows);
      if (mode === 'reset') setHasMore(rows.length === PAGE_SIZE);
      setError(null);
    }
    setLoading(false);
  }, [applyActivity]);

  // Qui l'utilisateur suit : sert à l'état vide et au filtre en temps réel
  const loadFollowing = useCallback(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id ?? null;
      setCurrentUserId(userId);
      if (!userId) {
        setFollowingIds([]);
        return;
      }

      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (error) {
        console.error(error);
        return;
      }

      const ids = (data ?? []).map(f => f.following_id as string).sort();
      // Ne change l'état que si la liste a vraiment changé pour ne pas relancer l'abonnement temps réel
      setFollowingIds(prev => (prev && prev.join(',') === ids.join(',') ? prev : ids));
  }, []);

  const loadMore = useCallback(async () => {
    const current = activityRef.current;
    if (loadingMoreRef.current || !hasMore || current.length === 0) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    const last = current[current.length - 1];
    const { data, error } = await supabase.rpc('get_friends_activity', {
      before_at: last.activity_at,
      limit_count: PAGE_SIZE,
    });

    if (error) {
      console.error(error);
    } else {
      const rows = (data ?? []) as FriendActivityRow[];
      applyActivity([...activityRef.current, ...rows]);
      setHasMore(rows.length === PAGE_SIZE);
    }

    loadingMoreRef.current = false;
    setLoadingMore(false);
  }, [hasMore, applyActivity])

  const refetch = useCallback(async () => {
    await Promise.all([fetchFirstPage('reset'), loadFollowing()]);
  }, [fetchFirstPage, loadFollowing]);

  //Chargement initial
  useEffect(() => {
    refetch();
  }, [refetch])

  useEffect(() => {
    if (!currentUserId || !followingIds || followingIds.length === 0) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    // Plusieurs événements peuvent arriver d'un coup: on regroupe en un seul rechargement
    const scheduleRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fetchFirstPage('merge'), 500);
    };

    const list = followingIds.slice(0, MAX_REALTIME_IDS).join(',');

    const channel: RealtimeChannel = supabase
      .channel(`friends-activity-${currentUserId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'interests', filter: `user_id=in.(${list})` },
      scheduleRefresh)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'interests', filter: `user_id=in.(${list})` },
      scheduleRefresh)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'follows', filter: `follower_id=in.(${list})` },
      scheduleRefresh)
      .subscribe();

      return () => {
        if (timer) clearTimeout(timer);
        supabase.removeChannel(channel);
      };
  }, [currentUserId, followingIds, fetchFirstPage]);

  return {
    activity,
    loading,
    loadingMore,
    hasMore,
    error,
    currentUserId,
    followingCount: followingIds?.length ?? null,
    refetch,
    loadMore,
  };
  
}
