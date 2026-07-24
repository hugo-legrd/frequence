import { useState } from 'react'; 
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/services/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email) {
      Alert.alert('Erreur', 'Entre ton adresse email.')
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://spylszxexpakvblhpynq.supabase.co/auth/v1/verify',
    });
    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['rgba(167,139,250,0.12)', 'transparent']}
        pointerEvents='none'
        style={styles.halo}
      />

      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Retour</Text>
      </Pressable>

      <View style={styles.top}>
        <Text style={styles.logo}>
          fréquence<Text style={styles.logoDot}>.</Text>
        </Text>
        <Text style={styles.subtitle}>Mot de passe oublié</Text>
      </View>

      {sent ? (
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>✉️</Text>
          <Text style={styles.successTitle}>Email envoyé !</Text>
          <Text style={styles.successText}>
              Vérifie ta boîte mail — ouvre le lien depuis un navigateur pour réinitialiser ton mot de passe. Cette fonctionnalité sera améliorée dans une prochaine version.          </Text>
          <Pressable style={styles.btnPrimary} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.btnText}>Retour au login</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.middle}>
          <Text style={styles.description}>
            Entre ton adresse email et on t'envoie un lien pour réinitialiser ton mot de passe.
          </Text>
          <TextInput
            style={[styles.input, emailFocused && styles.inputFocused]}
            placeholder="Email"
            placeholderTextColor="#3a3a3a"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
          />
          <Pressable
            style={[styles.btnPrimary, loading && { opacity: 0.6}]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#0f0f0f" />
              : <Text style={styles.btnText}>Envoyer le lien</Text>
            }
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    padding: 32,
    paddingTop: 64,
    paddingBottom: 48,
  },
  halo: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    top: '35%',
    alignSelf: 'center',
    zIndex: -1,
  },
  back: { 
    marginBottom: 32 
  },
  backText: { 
    color: '#555555', 
    fontSize: 13 
  },
  top: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: '300',
    color: '#e5e5e5',
    letterSpacing: -1.5,
  },
  logoDot: {
    color: '#a78bfa',
  },
  subtitle: {
    fontSize: 13,
    color: '#555555',
  },
  middle: {
    gap: 16,
  },
  description: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#1e1e1e',
    borderRadius: 12,
    padding: 15,
    fontSize: 14,
    color: '#e5e5e5',
  },
  inputFocused: {
    borderColor: '#a78bfa',
  },
  btnPrimary: {
    backgroundColor: '#a78bfa',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f0f0f',
  },
  successBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  successIcon: {
    fontSize: 48,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#e5e5e5',
  },
  successText: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
  },
});