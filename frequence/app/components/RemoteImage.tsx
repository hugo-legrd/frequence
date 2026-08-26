import { useRef, useState, useEffect, useMemo } from 'react';
import { Animated, Image, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme/ThemeContext';
import { ThemeColors } from '../../lib/theme/tokens';

type Props = { 
  uri: string | null;
  size: number;
  borderRadius: number;
  style?: ViewStyle;
};

export default function RemoteImage({ uri, size, borderRadius, style }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (loaded || failed) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [loaded, failed]);

  const baseStyle = { width: size, height: size, borderRadius };
  if (!uri || failed) {
    return <View style={[styles.placeholder, baseStyle, style]}/>
  }

  return (
    <View style={[baseStyle,{ overflow: 'hidden' }, style]}>
      {!loaded && (
        <Animated.View style={[styles.placeholder, baseStyle, {position: 'absolute', opacity }]} />
      )}
      <Image
        source={{ uri }}
        style={[baseStyle, { position: 'absolute' }]}
        resizeMode="cover"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) { 
  return StyleSheet.create({
    placeholder: { backgroundColor: colors.divider}
})
};