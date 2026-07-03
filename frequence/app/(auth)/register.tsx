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

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  async function signUp() {
    if (!firstName || !email || !password) {
      Alert.alert('Erreur', 'Merci de remplir tous les champs obligatoires.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else { 
      router.replace('/(auth)/login');
      Alert.alert(
        'Compte créé !',
        'Connecte-toi avec tes identifiants.'
      );
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'frequence://auth/callback' },
    });
    setLoading(false);
    if (error) Alert.alert('Erreur', error.message);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <LinearGradient
          colors={['rgba(167,139,250,0.12)', 'transparent']}
          pointerEvents="none"
          style={styles.halo}
        />

        <ScrollView 
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          style={{ zIndex:1 }}>
            {/* Retour */}
            <Pressable style={styles.back} onPress={() => router.back()}>
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backText}>Retour</Text>
            </Pressable>

            {/* Logo */}
            <View style={styles.top}>
              <Text style={styles.logo}>
                fréquence<Text style={styles.logoDot}>.</Text>
              </Text>
              <Text style={styles.subtitle}>Crée ton compte</Text>
            </View>

            {/* Formulaire */}
            <View style={styles.middle}>
              <View style={styles.nameRow}>
                <TextInput
                  style={[styles.input, styles.inputHalf, firstNameFocused && styles.inputFocused]}
                  placeholder="Prénom"
                  placeholderTextColor="#3a3a3a"
                  autoCapitalize="words"
                  value={firstName}
                  onChangeText={setFirstName}
                  onFocus={() => setFirstNameFocused(true)}
                  onBlur={() => setFirstNameFocused(false)}
                />
                <TextInput
                  style={[styles.input, styles.inputHalf, lastNameFocused && styles.inputFocused]}
                  placeholder="Nom"
                  placeholderTextColor="#3a3a3a"
                  autoCapitalize="words"
                  value={lastName}
                  onChangeText={setLastName}
                  onFocus={() => setLastNameFocused(true)}
                  onBlur={() => setLastNameFocused(false)}
                />
              </View>

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

              <View>
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
                <Text style={styles.hint}>8 caractères minimum</Text>
              </View>

              <Pressable
                style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
                onPress={signUp}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="0f0f0f"/>
                  : <Text style={styles.btnPrimaryText}>Créer mon compte</Text>
                }
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={[styles.btnGoogle, loading && { opacity: 0.6 }]}
                onPress={signInWithGoogle}
                disabled={loading}
              >
                <Text style={styles.btnGoogleText}>Continuer avec Google</Text>
              </Pressable>

              <Text style={styles.terms}>
                En créant un compte, tu accepts nos{' '}
                <Text style={styles.termsLink}>CGU</Text>
                {' '}et notre{' '}
                <Text style={styles.termsLink}>politique de confidentialité</Text>
              </Text>
            </View>

            {/* Login */}
            <View style={styles.bottom}>
              <Text style={styles.loginText}>Déjà un compte ?</Text>
              <Pressable onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.loginLink}> Se connecter</Text>
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
    backgroundColor: '#0f0f0f'
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
  scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 48,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backArrow: {
    fontSize: 16,
    color: '#555555',
  },
  backText: {
    fontSize: 13,
    color: '#555555',
  },
  top: {
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
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
    letterSpacing: 0.3,
  },
  middle: {
    gap: 12,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
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
  inputHalf: {
    flex: 1,
  },
  inputFocused: {
    borderColor: '#a78bfa',
  },
  hint: {
    fontSize: 11,
    color: '#3a3a3a',
    marginTop: 6,
    paddingLeft: 4,
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
    marginVertical: 2,
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
  terms: {
    fontSize: 11,
    color: '#3a3a3a',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: -4, 
  },
  termsLink: {
    color: '#555555'
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 13,
    color: '#555555',
  },
  loginLink: {
    fontSize: 13,
    color: '#a78bfa',
    fontWeight: '500',
  },
});