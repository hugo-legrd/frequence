import { View, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../lib/theme/ThemeContext';
import { makeStyles } from '../../../lib/theme/makeStyles';

export function Banner({ message, tone = 'error'}: { message: string; tone?: 'error' | 'success' }) {
  const s = useStyles();
  const { colors } = useTheme();
  const color = tone === 'error' ? colors.danger : colors.accent;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[s.box, { borderColor: color }]}
      accessibilityLiveRegion="polite"
    >
      <Ionicons
        name={tone === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'}
        size={17}
        color={color}
      />
      <Text style={[s.text, { color }]}>{message}</Text>
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
    backgroundColor: c.surface,
  },
  text: { flex: 1, fontSize: 12.5, lineHeight: 17 },
}));