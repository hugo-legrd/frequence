import { createClient } from "@supabase/supabase-js";
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Database } from "../types/database";


const StorageAdapter = {
  getItem: async (key: string) => {
    try {
      const secureValue = await SecureStore.getItemAsync(key);
      if (secureValue) return secureValue;
    } catch {}
    return  AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (value.length > 2048) {
      await AsyncStorage.setItem(key, value);
    } else {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch {
        await AsyncStorage.setItem(key, value);
      }
    }
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key).catch(() => {});
    await AsyncStorage.removeItem(key);
  }
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseKey, 
  { auth: { storage: StorageAdapter, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false,} }
);
