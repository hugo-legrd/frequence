import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
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
import { PasswordRules } from '../components/auth/PasswordRules';

type Errors = { firstName?: string; email?: string; password?: string; form?: string };

export default function RegisterScreen() {
  const s = useStyles();
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState<'password' | 'google' | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const signInWithGoogle = useGoogleAuth();

  function fail(next: Errors) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setErrors(next);
  }

  async function signUp() {
    if (!firstName.trim()) return fail({ firstName: 'Ton prénom est requis.'});
    if (!isValidEmail(email)) {
      emailRef.current?.focus();
      return fail({ email: 'Adresse email invalide.'})
    }
    if (password.length < 8) {
      passwordRef.current?.focus();
      return fail({ password: 'Au moins 8 caractères.'});
    }  
    
    setErrors({});
    setLoading('password');
    const { error } = await supabase.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: {
        data: { first_name: firstName.trim(), last_name: lastName.trim() },
      },
    });
    setLoading(null);

    if (error) return fail({ form: authErrorMessage(error) });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: '/(auth)/login', params: { registered: '1' } });
  }

  async function handleGoogle(){
    setErrors({});
    setLoading('google');
    const result = await signInWithGoogle();
    setLoading(null);

    if (result.ok) return routeAfterAuth();
    if (!result.cancelled && result.error) fail({ form: result.error });
  }

  return (
    <AuthScreen onBack={() => router.back()}>
      <AuthHeader subtitle="Crée ton compte" compact />

      <Animated.View entering={FadeInDown.delay(80).duration(420)} style={s.form}>
        {!!errors.form && <Banner message={errors.form} />}

        <View style={s.row}>
          <Field
            half
            label="Prénom"
            value={firstName}
            onChangeText={(v) => { setFirstName(v); setErrors({}); }}
            error={errors.firstName}
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
            returnKeyType='next'
            onSubmitEditing={() => lastNameRef.current?.focus()}
            submitBehavior='submit'
          />
          <Field
            half
            ref={lastNameRef}
            label="Nom"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize='words'
            autoComplete='family-name'
            textContentType='familyName'
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            submitBehavior='submit'
          />
        </View>

        <Field
          ref={emailRef}
          label="Email"
          value={email}
          onChangeText={(v) => { setEmail(v); setErrors({}); }}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize='none'
          autoComplete='email'
          textContentType='emailAddress'
          inputMode='email'
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior='submit'
        />

        <View>
          <Field
            ref={passwordRef}
            label="Mot de passe"
            value={password}
            onChangeText={(v) => { setPassword(v); setErrors({}); }}
            error={errors.password}
            secure
            onFocusChange={setPasswordFocused}
            autoCapitalize='none'
            autoComplete='new-password'
            textContentType='newPassword'
            passwordRules="minlength: 8; required: lower; required: upper; required: digit;"
            returnKeyType='go'
            onSubmitEditing={signUp}
          />
          <PasswordRules 
            password={password}
            visible={passwordFocused || (password.length > 0 && password.length < 8)}
          />
        </View>

        <PrimaryButton
          label="Créer ton compte"
          onPress={signUp}
          loading={loading === 'password'}
          disabled={loading !== null}
        />

        <Divider />

        <GoogleButton
          onPress={handleGoogle}
          loading={loading === 'google'}
          disabled={loading !== null}
        />

        <Text style={s.terms}>
          En créant un compte, tu acceptes nos <Text style={s.termsLink}>CGU</Text> et notre{' '}
          <Text style={s.termsLink}>politique de confidentialité</Text>
        </Text>
      </Animated.View>

      <View style={s.bottom}>
        <Text style={s.bottomText}>Déjà un compte?</Text>
        <Pressable hitSlop={10} onPress={() => router.replace('/(auth)/login')}>
          <Text style={s.bottomLink}> Se connecter</Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}

const useStyles = makeStyles((c) => ({
  form: { gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
  terms: { fontSize: 11, color: c.textMuted, textAlign: 'center', lineHeight: 17, marginTop: 4 },
  termsLink: { color: c.text, textDecorationLine: 'underline' },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 32,
  },
  bottomText: { fontSize: 13, color: c.textMuted },
  bottomLink: { fontSize: 13, color: c.accent, fontWeight: '600' },
}));