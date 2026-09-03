import { useEffect, type ReactNode } from "react";
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from "../../../lib/theme/ThemeContext";
import { makeStyles } from "../../../lib/theme/makeStyles";

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

type Props = { children: ReactNode; onBack?: () => void; backLabel?: string };

export function AuthScreen({ children, onBack, backLabel = 'Retour' }: Props) {
  const s = useStyles();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const pulse = useSharedValue(0.8);
  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [pulse, reduceMotion]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.94 + pulse.value * 0.08 }],
  }));

  const haloColors: [string, string] = isDark 
    ? ['rgba(145, 132, 217, 0.38)', 'rgba(145, 132, 217, 0)']
    : ['rgba(122, 92, 214, 0.16)', 'rgba(122, 92, 214, 0)'];

    return (
      <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <AnimatedGradient colors={haloColors} pointerEvents="none" style={[s.halo, haloStyle]} />

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[
          s.scroll,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsHorizontalScrollIndicator={false}
      >
        {onBack && (
          <Pressable
            style={s.back}
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
          >
            <Ionicons name="chevron-back" size={16} color={colors.textMuted}/>
            <Text style={s.backText}>{backLabel}</Text>
          </Pressable>
        )}
        {children}
      </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const useStyles = makeStyles((c) => ({
    container: { flex: 1, backgroundColor: c.bg },
    scrollView: { zIndex: 1 },
    halo: {
      position: 'absolute',
      width: 380,
      height: 380,
      borderRadius: 190,
      top: '22%',
      alignSelf: 'center',
    },
    scroll: { flexGrow: 1, paddingHorizontal: 28 },
    back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
    backText: { fontSize: 13, color: c.textMuted },
  }))
