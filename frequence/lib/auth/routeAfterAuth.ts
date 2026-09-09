import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from 'expo-router';
import { supabase } from '../services/supabase';

/** Router vers l'onboarding ou le home selon l'état du user courant. */
export async function routeAfterAuth() {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id
  if (!userId) return;

  const { data: profile } = await supabase
    .from('users')
    .select('handle')
    .eq('id', userId)
    .maybeSingle();

  if (!profile?.handle) {
    return router.replace('/(auth)/choose-handle');
  }

  const done = await AsyncStorage.getItem(`onboarding_done_${userId}`);
  router.replace(done ? '/(tabs)/screens/home' : '/onboarding/genres');
}

