import { View, Text } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../lib/theme/ThemeContext';
import { makeStyles } from '../../../lib/theme/makeStyles';

type Rule = { label: string; ok: boolean, required: boolean};

export function PasswordRules({ password, visible}: { password: string; visible: boolean }) {
  const s = useStyles();
  const { colors } = useTheme();

  if (!visible) return null;

  const rules: Rule[] = [
    { label: '8 caractères minimum', ok: password.length >= 8, required: true },
    { label: 'Une majuscule', ok: /[A-Z]/.test(password), required: false},
    { label: 'Un chiffre', ok: /\d/.test(password), required: false },
    { label: 'Un caractère spécial', ok: /[^A-Za-z0-9]/.test(password), required: false},
  ];

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(140)}
      layout={LinearTransition.duration(180)}
      style={s.box}
    >
      {rules.map((rule) => (
        <View key={rule.label} style={s.row}>
          <Ionicons 
            name={rule.ok ? 'checkmark-circle' : 'ellipse-outline'}
            size={13}
            color={rule.ok ? colors.accent : colors.textMuted}
          />
          <Text style={[s.label, rule.ok && s.labelOk]}>
            {rule.label}
            {!rule.required && <Text style={s.optional}> · conseillé</Text>}
          </Text>
        </View>
      ))}
    </Animated.View>
  )
}

const useStyles = makeStyles((c) => ({
  box: {
    gap: 6,
    marginTop: 8,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.divider,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  label: { fontSize: 11.5, color: c.textMuted },
  labelOk: { color: c.text },
  optional: { color: c.textMuted, fontStyle: 'italic' },
}));