import { useState } from 'react';
import { 
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/services/supabase';

const RADIUS_OPTIONS = [
  { value: 1, label: '1 km', description: 'Mon quartier' },
  { value: 5, label: '5 km', description: 'Autour de moi' },
  { value: 10, label: '10 km', description: 'Paris + petite couronne' },
  { value: 20, label: '20 km', description: 'Grand Paris'},
];

export default function RadiusScreen() {
  const [index, setIndex] = useState(1); // 5 km par défaut
  const [loading, setLoading] = useState(false);
  const { userId } = useLocalSearchParams<{ userId: string}>();

  const current = RADIUS_OPTIONS[index];

  async function handleContinue() {
    setLoading(true);
    try {
      await AsyncStorage.setItem('search_radius', String(current.value));

      if (userId) {
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
    <View style={styles.container}>
      {/* Barre de progression */}
      <View style={styles.progress}>
        <View style={[styles.bar, styles.barActive]} />
        <View style={[styles.bar, styles.barActive]} />
        <View style={styles.bar} />
      </View>

      {/* Header */}
      <View style={styles.top}>
        <Text style={styles.step}>Étape 2 / 3</Text>
        <Text style={styles.title}>
            À quelle <Text style={styles.titleAccent}>distance</Text> chercher ?
        </Text>
        <Text style={styles.subtitle}>
          On trouvera les concerts et disquaires dans ce rayon autour de toi.
        </Text>
      </View>

      {/* Affichage du rayon */}
      <View style={styles.middle}>
        <View style={styles.radiusDisplay}>
          <Text style={styles.radiusNumber}>
            {current.value}<Text style={styles.radiusUnit}> km</Text>
          </Text>
          <Text style={styles.radiusDescription}>{current.description}</Text>
        </View>

        {/* Slider */}
        <View style={styles.sliderContainer}>
          <Slider 
            style={styles.slider}
            minimumValue={0}
            maximumValue={3}
            step={1}
            value={index}
            onValueChange={(v: number) => setIndex(Math.round(v))}
            minimumTrackTintColor="#a78bfa"
            maximumTrackTintColor="#1e1e1e"
            thumbTintColor="#a78bfa"
          />
          <View style={styles.sliderLabels}>
            {RADIUS_OPTIONS.map((opt, i) => (
              <Text 
                key={opt.value}
                style={[styles.sliderLabel, i === index && styles.sliderLabelActive]}
              >
                {opt.label}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.bottom}>
        <Pressable
          style={styles.btnPrimary}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#0f0f0f" />
            : <Text style={styles.btnText}>Continuer</Text>  
          }
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.btnBack}>← Retour</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 48,
  },
  progress: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 48,
  },
  bar: {
    flex: 1,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#1e1e1e',
  },
  barActive: {
    backgroundColor: '#a78bfa',
  },
  top: {
    marginBottom: 48,
  },
  step: {
    fontSize: 11,
    color: '#3a3a3a',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    color: '#e5e5e5',
    letterSpacing: -0.5,
    lineHeight: 32
  },
  titleAccent: {
    color: '#a78bfa',
  },
  subtitle: {
    fontSize: 13,
    color: '#555555',
    marginTop: 8,
    lineHeight: 20,
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
    gap: 48,
  },
  radiusDisplay: {
    alignItems: 'center',
    gap: 8,
  },
  radiusNumber: {
    fontSize: 80,
    fontWeight: '300',
    color: '#e5e5e5',
    letterSpacing: -3,
    lineHeight: 88,
  },
  radiusUnit: {
    fontSize: 32,
    color: '#555555',
  },
  radiusDescription: {
    fontSize: 13,
    color: '#555555',
  },
  sliderContainer: {
    gap: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 11,
    color: '#3a3a3a',
  },
  sliderLabelActive: {
    color: '#a78bfa',
  },
  bottom: {
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: '#a78bfa',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f0f0f',
  },
  btnBack: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
  },
});