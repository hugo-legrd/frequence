import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { routeAfterAuth } from '../../lib/auth/routeAfterAuth';
import  * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/services/supabase';
import { makeStyles } from '../../lib/theme/makeStyles';
import { useHandleAvailability } from '../hooks/social/useHandleAvailability';
import { AuthScreen } from '../components/auth/AuthScreen';
import { AuthHeader } from '../components/auth/AuthHeader';
import { Field } from '../components/auth/Field';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { Banner } from '../components/auth/Banner';

export default function ChooseHandleScreen() {
  const s = useStyles();
  const [handle, setHandle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const state = useHandleAvailability(handle);

  async function submit() {
    if (state !== 'available') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return setError(
        state === 'taken' ? 'Ce pseudo est déjà pris.' : '3 à 20 caractères: lettres, chiffres, underscore.'
      );
    }

    setLoading(true);
    const { error: rpcError } = await supabase.rpc('set_my_handle', {
      new_handle: handle.trim().toLowerCase(),
    });
    setLoading(false);

    if (rpcError) return setError('Impossible d\'enregistrer ce pseudo.');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await routeAfterAuth();
  }

  return (
    <AuthScreen>
      <AuthHeader subtitle="Choisis ton pseudo" compact />
      {!!error && <Banner message={error} />}
      <View style={s.form}>
        <Text style={s.explain}>
          C'est le nom unique qui permettra à tes amis de te retrouver.
        </Text>
        <Field 
          label="Pseudo"
          value={handle}
          onChangeText={(v) => { setHandle(v.toLowerCase()); setError(null); }}
          hint={
            state === 'available' ? '✓ Disponible'
            : state === 'taken' ? 'Déjà pris'
            : state === 'checking' ? 'Vérification…'
            : undefined
          }
          autoCapitalize="none"
          autoComplete="username"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <PrimaryButton label="Continuer" onPress={submit} loading={loading} />
      </View>
    </AuthScreen>
  );
}

const useStyles = makeStyles((c) => ({
  form: { gap: 12 },
  explain: { fontSize: 13, color: c.textMuted, lineHeight: 19 },
}))