import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { supabase } from '../lib/services/supabase';


export default function Index() {
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/(tabs)/screens/home');
      else router.replace('/(auth)/login');
    });
  }, [navigationState?.key]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#a78bfa" />
    </View>
  );
}