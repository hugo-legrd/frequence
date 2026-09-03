import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { makeStyles } from '../../../lib/theme/makeStyles';

export function AuthHeader({ subtitle, compact = false }: { subtitle: string; compact?: boolean }) {
  const s = useStyles();
  return (
    <Animated.View entering={FadeInDown.duration(420)} style={[s.top, compact && s.topCompact]}>
      <Text style={[s.logo, compact && s.logoCompact]} accessibilityRole='header'>
        fréqunece<Text style={s.dot}>.</Text>
      </Text>
      <Text style={s.subtitle}>{subtitle}</Text>
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  top: { alignItems: 'center', gap: 10, marginTop: 40, marginBottom: 44 },
  topCompact: { marginTop: 20, marginBottom: 30 },
  logo : { fontSize: 42, fontWeight: '300', color: c.text, letterSpacing: -1.6 },
  logoCompact: { fontSize: 34 },
  dot: { color: c.accent },
  subtitle: { fontSize: 13, color: c.textMuted, letterSpacing: 0.4 },
}));
