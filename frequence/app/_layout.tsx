import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/services/supabase';

export default function RootLayout() {
  const router = useRouter();
  const isReady = useRef(false);


  useEffect(() => {
    // Marquer le navigator comme prêt avant le premier render
    const timer = setTimeout(() => {
      isReady.current = true;
    }, 500);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isReady.current) {
        return;
      }

      //Uniquement gérer la déconnexion ici
      // La connexion est gérée dans index.tsx et login.tsx
      if (!session) {
        router.replace('/(auth)/login');
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}