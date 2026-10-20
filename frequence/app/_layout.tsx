import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/services/supabase';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../lib/theme/ThemeContext';

export default function RootLayout() {
  const router = useRouter();
  const isReady = useRef(false);
  const segments = useSegments();
  const segmentsRef = useRef(segments);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    // Marquer le navigator comme prêt avant le premier render
    const timer = setTimeout(() => {
      isReady.current = true;
    }, 500);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isReady.current) return;
        if (_event === 'SIGNED_OUT' || !session) {
          const alreadyOnAuth = segmentsRef.current[0] === '(auth)';
          if (!alreadyOnAuth) router.replace('/(auth)/login');
        }
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
    </GestureHandlerRootView>
  );
}