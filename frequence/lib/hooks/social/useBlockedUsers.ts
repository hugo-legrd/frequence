import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { unblockUser } from "../../services/moderation";
import { ref } from "node:process";

export type BlockedUser = {
  id: string;
  display_name: string;
  handle: string | null;
};

// Liste des comptes que j'ai bloqués, avec la possibilité de les débloquer
export function useBlockedUsers() {
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_blocked_users');
    if (error) console.error(error);
    else setUsers((data ?? []) as BlockedUser[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const unblock = useCallback(async (userId: string) => {
    const before = users;
    // On retire la personne de la liste tout de suite
    setUsers(prev => prev.filter(u => u.id !== userId));
    const ok = await unblockUser(userId);
    if (!ok) setUsers(before);
  }, [users]);

  return { users, loading, unblock, refetch };
}
