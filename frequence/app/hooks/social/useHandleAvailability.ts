import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/services/supabase';

export type HandleState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

const DEBOUNCE_MS = 400;

export function useHandleAvailability(handle: string) {
  const [state, setState] = useState<HandleState>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const value = handle.trim().toLowerCase();

    if (value.length === 0) {
      setState('idle');
      return;
    }
    if(!/^[a-z0-9_]{3,20}$/.test(value)) {
      setState('invalid');
      return;
    }

    setState('checking');
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc('is_handle_available', {
        candidate: value,
      });
      if (error) return setState('idle');
      setState(data ? 'available' : 'taken');
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [handle]);

  return state;
}