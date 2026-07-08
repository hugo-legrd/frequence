import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { supabase } from '../lib/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function Index() {
  const router = useRouter();
  const navigationState = useRootNavigationState();


  useEffect(() => {

    if (!navigationState?.key) return;

    async function redirect() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/(auth)/login');
        return;
      }

      const onboardingKey = `onboarding_done_${session.user.id}`;
      const onboardingDone = await AsyncStorage.getItem(onboardingKey);

      if (!onboardingDone) {
        router.replace('/onboarding/genres');
      } else {
        router.replace('/(tabs)/screens/home');
      }
    }

    redirect();
  }, [navigationState?.key]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#a78bfa" />
    </View>
  );
}