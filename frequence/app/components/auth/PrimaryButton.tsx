import { Text, Pressable, ActivityIndicator, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../lib/theme/ThemeContext';
import { makeStyles, onAccent } from '../../../lib/theme/makeStyles';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, loading, disabled, style }: Props) {
  const s = useStyles();
  const { colors, isDark } = useTheme();
  const inert = disabled || loading;

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inert, busy: !!loading }}
      disabled={inert}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        s.btn,
        disabled && s.btnDisabled,
        pressed && s.btnPressed,
        style,
      ]}
    >
      { loading ? (
        <ActivityIndicator color={onAccent(colors, isDark)}/>
      ) : (
        <Text style={s.text}>{label}</Text>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((c, isDark) => ({
  btn: {
    height: 52,
    backgroundColor: c.accent,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.4 },
  btnPressed: { transform: [{ scale: 0.98 }], opacity: 0.9},
  text: { fontSize: 15, fontWeight: '600', color: onAccent(c, isDark)},
}));