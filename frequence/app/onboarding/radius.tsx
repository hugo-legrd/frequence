import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/services/supabase';
import { useTheme } from '../../lib/theme/ThemeContext';
import { makeStyles } from '../../lib/theme/makeStyles';
import { StepHeader, Accent } from '../components/StepHeader';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import Animated, { FadeIn } from 'react-native-reanimated';

const RADIUS_OPTIONS = [
  { value: 1, label: '1 km', description: 'Mon quartier' },
  { value: 5, label: '5 km', description: 'Autour de moi' },
  { value: 10, label: '10 km', description: 'Paris + petite couronne' },
  { value: 20, label: '20 km', description: 'Grand Paris'},
];

export default function RadiusScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(1); // 5 km par défaut
  const [loading, setLoading] = useState(false);
  const { userId, genreIds } = useLocalSearchParams<{ 
    userId: string,
    genreIds: string,
  }>();

  const current = RADIUS_OPTIONS[index];

  function handleSlide(value: number) {
    const next = Math.round(value);
    if (next === index) return;
    Haptics.selectionAsync();
    setIndex(next);
  }

  async function handleContinue() {
    setLoading(true);
    try {
      await AsyncStorage.setItem('search_radius', String(current.value));

      if (userId) {
        await supabase
          .from('user_genres')
          .delete()
          .eq('user_id', userId);

        const parsedIds: string[] = JSON.parse(genreIds ?? '[]');
        if (parsedIds.length > 0) {
          const rows = parsedIds.map(genre_id => ({ user_id: userId, genre_id }));
          const { error } = await supabase.from('user_genres').insert(rows);
          if (error) throw error;
        }

        await AsyncStorage.setItem(`onboarding_done_${userId}`, 'true');
      }

      router.replace('/(tabs)/screens/home');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={[
        s.container,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
      ]}
    >
      {/* Affichage du rayon */}
      <View style={s.middle}>
        <View style={s.radiusDisplay}>
          <Text style={s.radiusNumber}>
            {current.value}<Text style={s.radiusUnit}> km</Text>
          </Text>
          <Animated.Text key={current.value} entering={FadeIn.duration(200)} style={s.radiusDescription}>
            {current.description}
          </Animated.Text>
        </View>

        {/* Slider */}
        <View style={s.sliderContainer}>
          <Slider 
            style={s.slider}
            minimumValue={0}
            maximumValue={3}
            step={1}
            value={index}
            onValueChange={handleSlide}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.divider}
            thumbTintColor={colors.accent}
            accessibilityLabel={`Rayon de recherche: ${current.label}`}
          />
          <View style={s.sliderLabels}>
            {RADIUS_OPTIONS.map((opt, i) => (
              <Pressable
                key={opt.value}
                hitSlop={10}
                onPress={() => handleSlide(i)}
                accessibilityRole="button"
              >
                <Text style={[s.sliderLabel, i === index && s.sliderLabelActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={s.bottom}>
        <PrimaryButton label="Continuer" onPress={handleContinue} loading={loading} />
        <Pressable
          style={s.btnBack}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Text style={s.btnBack}>← Retour</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 28 },
  middle: { flex: 1, justifyContent: 'center', gap: 48 },
  radiusDisplay: { alignItems: 'center', gap: 8 },
  radiusNumber: {
    fontSize: 80,
    fontWeight: '300',
    color: c.text,
    letterSpacing: -3,
    lineHeight: 88,
  },
  radiusUnit: { fontSize: 32, color: c.textMuted },
  radiusDescription: { fontSize: 13, color: c.textMuted },
  sliderContainer: { gap: 16 },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontSize: 11, color: c.textMuted },
  sliderLabelActive: { color: c.accent, fontWeight: '600' },
  bottom: { gap: 12 },
  btnBack: { alignItems: 'center', marginTop: 8, paddingVertical: 4 },
}));