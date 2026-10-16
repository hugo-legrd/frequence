import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export type MyVenueRow = {
  venue_id: string;
  name: string;
  address: string | null;
};

// Liste des salles suivies par l'utilisateur, la plus récente en premier.
export function useMyVenues() {
  const [venues, setVenues] = useState<MyVenueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setVenues([]);
      setLoading(false);
      return;
    }

    // On part des abonnements et on récupère les infos de chaque salle
    const { data, error } = await supabase
      .from('venue_follows')
      .select('created_at, venues ( id, name, address )')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        setLoading(false)
        return;
      }

      const rows: MyVenueRow[] = (data ?? [])
        .map((row: any) => row.venues)
        .filter(Boolean)
        .map((venue: any) => ({
          venue_id: venue.id,
          name: venue.name,
          address: venue.address ?? null,
        }));

        setVenues(rows);
        setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { venues, loading, refetch};
}
