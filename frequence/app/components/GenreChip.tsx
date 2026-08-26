import { Pressable, Text, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useTheme } from '../../lib/theme/ThemeContext';
import { ThemeColors } from '../../lib/theme/tokens';

type Props = {
  label: string,
  active: boolean,
  onPress: () => void;
}

export default function GenreChip({ label, active, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
    >
      <Text style={[styles.text, active && styles.textActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  text: {
    fontSize: 13,
    color: colors.textMuted,
  },
  textActive: {
    color: colors.bg,
    fontWeight: '500',
  },
})
};