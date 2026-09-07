import { Pressable, Text, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { useEventInterest } from '../hooks/events/useEventInterest';
import { useTheme } from '../../lib/theme/ThemeContext';
import type { ThemeColors } from '../../lib/theme/tokens';

export default function InterestButton({ eventId }: Readonly<{ eventId: string }>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { status, setInterest } = useEventInterest(eventId);

  return (
    <Pressable
      style={[styles.btn, status && styles.btnActive]}
      hitSlop={8}
      onPress={(e) => {
        e.stopPropagation();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setInterest('interested');
      }}
    >
      <Text style={styles.icon}>{status ? '★' : '☆'}</Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    btn: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.scrim,
    },
    btnActive: { backgroundColor: colors.accentSoftBg },
    icon: { fontSize: 17, color: colors.accent },
  });
}