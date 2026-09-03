import { forwardRef, useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, type TextInputProps } from 'react-native';
import Animated, {
  interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../lib/theme/ThemeContext";
import { makeStyles } from "../../../lib/theme/makeStyles";

const AnimatedText = Animated.createAnimatedComponent(Text);

type Props = Omit<TextInputProps, 'placeholder'> & {
  label: string;
  error?: string | null;
  secure?: boolean;
  half?: boolean;
  onFocusChange?: (focused: boolean) => void;
};

export const Field = forwardRef<TextInput, Props>(function Field(
  { label, error, secure, half, value, onFocus, onBlur, onFocusChange, style, ...rest },
  ref
) {
  const s = useStyles();
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();

  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const active = focused || !!value;
  const float = useSharedValue(active ? 1 : 0);
  const shake = useSharedValue(0);

  useEffect(() => {
    float.value = withTiming(active ? 1 : 0, { duration: 150 });
  }, [active, float]);

  useEffect(() => {
    if (!error || reduceMotion) return;
    shake.value = withSequence(
      withTiming(-6, { duration: 45 }),
      withTiming(6, { duration: 45 }),
      withTiming(-3, { duration: 45 }),
      withTiming(0, { duration: 45 })
    );
  }, [error, reduceMotion, shake]);

  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [0, -12]) }],
    fontSize: interpolate(float.value, [0, 1], [15, 11.5]),
  }));

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }]}));

  const labelColor = error ? colors.danger : focused ? colors.accent : colors.textMuted;

  return (
    <Animated.View style={[half && s.half, shakeStyle]}>
      <View
        style={[
          s.wrapper,
          focused && s.wrapperFocused,
          !!error && s.wrapperError,
        ]}
      >
        <AnimatedText style={[s.label, { color: labelColor }, labelStyle]} pointerEvents="none">
          {label}
        </AnimatedText>

        <TextInput
          ref={ref}
          style={[s.input, secure && s.inputWithAdornment, style]}
          value={value}
          secureTextEntry={secure && !revealed}
          autoCorrect={false}
          accessibilityLabel={label}
          selectionColor={colors.accent}
          onFocus={(e) => { setFocused(true); onFocusChange?.(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onFocusChange?.(false); onBlur?.(e); }}
          {...rest}
        />

        {secure && (
          <Pressable
            style={s.adornment}
            hitSlop={10}
            onPress={() => setRevealed((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>

      {!!error && <Text style={s.error}>{error}</Text>}
    </Animated.View>
  );
});

const useStyles = makeStyles((c) => ({
  half: { flex: 1 },
  wrapper: {
    height: 60,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.divider,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingTop: 24,
    paddingBottom: 8,
  },
  wrapperFocused: { borderColor: c.accent, backgroundColor: c.accentSoftBg },
  wrapperError: { borderColor: c.danger },
  label: { position: 'absolute', left: 16, top: 20, lineHeight: 20, includeFontPadding: false, color: c.textMuted },
  input: { height: 28, paddingVertical: 0, fontSize: 15, lineHeight: 20, includeFontPadding: false, color: c.text },
  inputWithAdornment: { paddingRight: 34 },
  adornment: { position: 'absolute', right: 14, top: 20 },
  error: { fontSize: 11.5, color: c.danger, marginTop: 6, paddingLeft: 4 },
}));