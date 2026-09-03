import { useState } from 'react'; 
import { View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { supabase } from '../../lib/services/supabase';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../lib/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { makeStyles } from '../../lib/theme/makeStyles';
import { authErrorMessage } from '../../lib/auth/authErrors';
import { isValidEmail, normalizeEmail } from '../../lib/auth/validators';
import { AuthScreen } from '../components/auth/AuthScreen';
import { AuthHeader } from '../components/auth/AuthHeader';
import { Field } from '../components/auth/Field';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { Banner } from '../components/auth/Banner';

const RESET_REDIRECT = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/verify`;

export default function ForgotPasswordScreen() {
  const s = useStyles();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!isValidEmail(email)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFieldError('Adresse email invalide.');
      return;
    }

    setFieldError(null);
    setFormError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: RESET_REDIRECT,
    });
    setLoading(false);

    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError(authErrorMessage(error));
      return;  
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSent(true);
  }  

  return (
    <AuthScreen onBack={() => router.back()}>
      <AuthHeader subtitle="Mot de passe oublié" compact />

      {sent ? (
        <Animated.View entering={FadeIn.duration(300)} style={s.success}>
          <View style={s.successIcon}>
            <Ionicons name="mail-outline" size={30} color={colors.accent} />
          </View>
          <Text style={s.successTitle}>Email envoyé</Text>
          <Text style={s.successText}>
            Un lien vient de partir vers {normalizeEmail(email)}. Ouvre-le depuis ton navigateur
            pour choisir un nouveau mot de passe.
          </Text>
          <PrimaryButton
            label="Retour à la connexion"
            onPress={() => router.replace('/(auth)/login')}
            style={{ alignSelf: 'stretch'}}
          />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.delay(80).duration(420)} style={s.form}>
          <Text style={s.description}>
            Entre ton adresse email et on t'envoie un lien pour réinitialiser ton mot de passe.
          </Text>

          {!!formError && <Banner message={formError} />}

          <Field
            label="Email"
            value={email}
            onChangeText={(v) => { setEmail(v); setFieldError(null); setFormError(null); }}
            error={fieldError}
            keyboardType='email-address'
            autoCapitalize='none'
            autoComplete="email"
            textContentType='emailAddress'
            inputMode="email"
            returnKeyType='send'
            onSubmitEditing={handleReset}
          />

          <PrimaryButton
            label="Envoyer le lien"
            onPress={handleReset}
            loading={loading}
            disabled={!isValidEmail(email)}
          />
        </Animated.View>
      )}
    </AuthScreen>
  );
}

const useStyles = makeStyles((c) => ({
  form: { gap: 14 },
  description: { fontSize: 13, color: c.textMuted, lineHeight: 20 },
  success: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, paddingBottom: 60 },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.accentSoftBg,
    borderWidth: 1,
    borderColor: c.accentSoftBorder,
    marginBottom: 4,
  },
  successTitle: { fontSize: 20, fontWeight: '600', color: c.text },
  successText: {
    fontSize: 13,
    color: c.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
  },
}));