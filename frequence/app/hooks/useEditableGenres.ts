import { useEffect, useState } from "react";
import { supabase } from "../../lib/services/supabase";
import type { GenreOption } from "../../lib/types/editProfile";

export function useEditableGenres() {
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchGenres() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase.rpc('get_all_genres_with_selection', {
        current_user_id: user.id,
      });

      if (error) console.error(error);
      else setGenres(data ?? []);
      setLoading(false);
    }
    fetchGenres();
  }, []);

  async function toggleGenre(genreId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const genre = genres.find(g => g.id === genreId);
    if (!genre) return;

    const wasSelected = genre.selected;

    setGenres(prev =>
      prev.map(g => (g.id === genreId ? { ...g, selected: !wasSelected } : g))
    );

    setSaving(true);
    if (wasSelected) {
      await supabase
        .from('user_genres')
        .delete()
        .eq('user_id', user.id)
        .eq('genre_id', genreId);
    } else {
      await supabase
        .from('user_genres')
        .insert({ user_id: user.id, genre_id: genreId });
    }
    setSaving(false);
  }

  return { genres, loading, saving, toggleGenre };
}