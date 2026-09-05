import type { ReactNode } from 'react';
import { View, Text } from 'react-native';
import  Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { makeStyles } from '../../lib/theme/makeStyles';

type Props = {
  step: number;
  total: number;
  title: ReactNode;
  subtitle: string;
};

export function StepHeader({ step, total, title, subtitle }: Props) {
  const s = useStyles();

  return (
    <View>
      <View
        style={s.progress}
        accessibilityRole='progressbar'
        accessibilityValue={{ min: 1, max: total, now: step }}
      >
        {Array.from({ length: total }, (_, i) => (
          <Animated.View 
            key={i}
            layout={LinearTransition.duration(220)}
            style={[s.bar, i < step && s.barActive]}
          />
        ))}
      </View>

      <Animated.View entering={FadeInDown.duration(380)} style={s.top}>
        <Text style={s.step}>
          Étape {step} / {total}
        </Text>
        <Text style={s.title}>{title}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
      </Animated.View>
    </View>
  )
}

export function Accent({ children }: { children: ReactNode }) {
  const s = useStyles();
  return <Text style={s.titleAccent}>{children}</Text>;
}

const useStyles = makeStyles((c) => ({
  progress: { flexDirection: 'row', gap: 6, marginBottom: 40 },
  bar: { flex: 1, height: 2, borderRadius: 2, backgroundColor: c.divider },
  barActive: { backgroundColor: c.accent },
  top: { marginBottom: 32 },
  step: {
    fontSize: 11,
    color: c.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 25,
    fontWeight: '300',
    color: c.text,
    letterSpacing: -0.5,
    lineHeight: 33,
  },
  titleAccent: { color: c.accent },
  subtitle: { fontSize: 13, color: c.textMuted, marginTop: 10, lineHeight: 20 },
}));