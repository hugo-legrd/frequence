import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/services/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  async function signIn() {
    if (!email || !password) {
      Alert.alert('Erreur', 'Merci de remplir tous les champs.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Erreur', error.message); 
    } else {
      router.replace('/(tabs)/screens/home');
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'frequence://auth/callback' },
    });
    setLoading(false);
    if (error) Alert.alert('Erreur', error.message);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.top}>
          <Text style={styles.logo}>
            fréquence<Text style={styles.logoDot}>.</Text>
          </Text>
          <Text style={styles.tagline}>La musique underground près de toi</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.middle}>
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
          <TextInput
            style={[styles.input, passwordFocused && styles.inputFocused]}
            placeholder="Mot de passe"
            placeholderTextColor="#3a3a3a"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
          />

          <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgot}>Mot de passe oublié?</Text>
          </Pressable>

          <Pressable style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
            onPress={signIn}
            disabled={loading}>
              {loading
                ? <ActivityIndicator color="#0f0F0F" />
                : <Text style={styles.btnPrimaryText}>Se connecter</Text>
          }
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google */}
          <Pressable style={[styles.btnGoogle, loading && { opacity: 0.6 }]}
            onPress={signInWithGoogle}
            disabled={loading}
          >
            <Text style={styles.btnGoogleText}>Continuer avec Google</Text>
          </Pressable>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.signupText}>Pas encore de compte ? </Text>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.signupLink}>S'inscrire</Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* Halo ambiant violet*/}
      <LinearGradient
        colors={['rgba(167, 139, 250, 0.5)', 'transparent']}
        pointerEvents='none'
        style={{
          position: 'absolute',
          width: 350,
          height: 400,
          borderRadius: 175,
          top: '30%',
          alignSelf: 'center',
        }}
      >
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 100,
    paddingBottom: 48,
  },
  top: {
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    fontSize: 42,
    fontWeight: '300',
    color: '#e5e5e5',
    letterSpacing: -1.5,
  },
  logoDot: {
    color: 'rgb(167, 139, 250)',
  },
  tagline: {
    fontSize: 13,
    color: '#555555',
    letterSpacing: 0.5,
  },
  middle: {
    gap: 12,
  },
  input: {
    backgroundColor: '#000000',
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
  forgot: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'right',
    marginTop: -4,
  },
  btnPrimary: {
    backgroundColor: '#a78bfa',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f0f0f',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1e1e1e',
  },
  dividerText: {
    fontSize: 11,
    color: '#3a3a3a',
  },
  btnGoogle: {
    borderWidth: 1,
    borderColor: '#1e1e1e',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  btnGoogleText: {
    fontSize: 14,
    color: '#e5e5e5',
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 13,
    color: '#555555',
  },
  signupLink: {
    fontSize: 13,
    color: '#a78bfa',
    fontWeight: '500',
  },
});

