import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function ForgotPasswordScreen() {
  return (
    <View style={styles.container}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Retour</Text>
      </Pressable>
      <Text style={styles.title}>Mot de passe oublié</Text>
      <Text style={styles.subtitle}>On implémente ça bientôt !</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    padding: 32,
    paddingTop: 64,
  },
  back: { marginBottom: 32 },
  backText: { color: '#555555', fontSize: 13 },
  title: { color: '#e5e5e5', fontSize: 22, fontWeight: '300', marginBottom: 8 },
  subtitle: { color: '#555555', fontSize: 13 },
});