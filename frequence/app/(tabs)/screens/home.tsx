import { View, Text, Pressable } from 'react-native';
import { supabase } from '../../../lib/services/supabase';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff' }}>Accueil</Text>
      <Pressable
        onPress={() => supabase.auth.signOut()}
        style={{ marginTop: 20, padding: 12, backgroundColor: '#a78bfa', borderRadius: 8 }}
      >
        <Text style={{ color: '#0f0f0f' }}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}