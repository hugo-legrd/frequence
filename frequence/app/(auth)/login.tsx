import { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/services/supabase';
import { makeStyles } from '../../lib/theme/makeStyles';
import { authErrorMessage } from '../../lib/auth/authErrors';
import { isValidEmail, normalizeEmail } from '../../lib/auth/validators';
import { useGoogleAuth } from '../../lib/auth/useGoogleAuth';
import { routeAfterAuth } from '../../lib/auth/routeAfterAuth';
import { AuthScreen } from '../components/auth/AuthScreen';
import { AuthHeader } from '../components/auth/AuthHeader';
import { Field } from '../components/auth/Field';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { GoogleButton } from '../components/auth/GoogleButton';
import { Divider } from '../components/auth/Divider';
import { Banner } from '../components/auth/Banner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';


type Errors = { email?: string; password?: string; form?: string };

export default function LoginScreen() {
  const s = useStyles();
  const { registered } = useLocalSearchParams<{ registered?: string}>();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState<'password' | 'google' | null>(null);

  const signInWithGoogle = useGoogleAuth();
  const canSubmit = isValidEmail(email) && password.length > 0;

  function fail(next: Errors) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setErrors(next);
  }

  async function signIn() {
    if (!isValidEmail(email)) return fail({email: 'Adresse email invalide'});
    if (!password) return fail({ password: 'Entre ton mot de passe. '});
    
    setErrors({});
    setLoading('password');
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email), 
      password });
    setLoading(null);

    if (error) return fail({ form: authErrorMessage(error)});

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await routeAfterAuth();
  }

  async function handleGoogle() {
    setErrors({});
    setLoading('google');
    const result = await signInWithGoogle();
    setLoading(null);

    if (result.ok) return routeAfterAuth();
    if (!result.cancelled && result.error) fail({ form: result.error });
  }
  
  return (
    <AuthScreen>
      <AuthHeader subtitle="La musique underground près de toi" />
      <Animated.View entering={FadeInDown.delay(80).duration(420)} style={s.form}>
        {registered === '1' && !errors.form && (
          <Banner tone="success" message="Compte créé! Connecte-toi avec tes identifiants." />
        )}
        {!!errors.form && <Banner message={errors.form} />}

        <Field 
          label="Email"
          value={email}
          onChangeText={(v) => { setEmail(v); setErrors({}); }}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize='none'
          autoComplete='email'
          textContentType='emailAddress'
          inputMode='email'
          returnKeyType='next'
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior='submit'
        />

        <Field
          ref={passwordRef}
          label="Mot de passe"
          value={password}
          onChangeText={(v) => { setPassword(v); setErrors({}); }}
          error={errors.password}
          secure
          autoCapitalize='none'
          autoComplete='current-password'
          textContentType='password'
          returnKeyType='go'
          onSubmitEditing={signIn}
        />

        <Pressable
          hitSlop={10}
          onPress={() => router.push('/(auth)/forgot-password')}
          accessibilityRole='button'
        >
          <Text style={s.forgot}>Mot de passe oublié</Text>
        </Pressable>

        <PrimaryButton
          label="Se connecter"
          onPress={signIn}
          loading={loading === 'password'}
          disabled={!canSubmit || loading !== null}
        />

        <Divider />

        <GoogleButton 
          onPress={handleGoogle}
          loading={loading === 'google'}
          disabled={loading !== null}
        />
      </Animated.View>

      <View style={s.bottom}>
        <Text style={s.bottomText}>Pas encore de compte ? </Text>
        <Pressable hitSlop={10} onPress={() => router.push('/(auth)/register')}>
          <Text style={s.bottomLink}>S'inscrire</Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}

const useStyles = makeStyles((c) => ({
  form: { gap: 12 },
  forgot: { fontSize: 12, color: c.textMuted, textAlign: 'right', marginTop: -2 },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 36,
  },
  bottomText: { fontSize: 13, color: c.textMuted },
  bottomLink: { fontSize: 13, color: c.accent, fontWeight: '600' },
}));