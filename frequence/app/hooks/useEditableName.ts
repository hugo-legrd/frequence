import { useEffect, useState } from 'react';
import { supabase } from '../../lib/services/supabase';

export function useEditableName() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setFirstName(user.user_metadata?.first_name ?? '');
        setLastName(user.user_metadata?.last_name ?? '');
      } 
      setLoading(false);
    }
    fetchUser();
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { first_name: firstName.trim(), last_name: lastName.trim()},
    });
    setSaving(false);
    return !error;
  }

  return { firstName, setFirstName, lastName, setLastName, loading, saving, save };
}