import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/services/supabase';
import GenreChip from '../components/GenreChip';

const GENRES = [
  'Techno', 'House', 'Hardgroove', 'Uptempo',
  'Indie Rock', 'Jazz', 'Hip-Hop', 'Electro',
  'Ambient', 'Drum & Bass', 'Soul', 'Metal',
];

export default function GenresScreen(){
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [genreMap, setGenreMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Récupérer les IDs des genres depuis Supabase
    supabase.from('genres').select('id, name').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(g => {map[g.name] = g.id; });
        setGenreMap(map);
      }
    });
  }, []);

  function toggle(genre: string) {
    setSelected(prev => 
      prev.includes(genre)
        ? prev.filter(g => g!== genre)
        : [...prev, genre]
    );
  }

  async function handleContinue() {
    if (selected.length === 0) return;
    setLoading(true);
  
    try {
      const { data: { session }} = await supabase.auth.getSession();

      await AsyncStorage.setItem('user_genres', JSON.stringify(selected));

      const genreIds = selected
        .filter(g => genreMap[g])
        .map(g => genreMap[g]);

      router.replace({
        pathname: '/onboarding/radius',
        params: { 
          userId: session?.user.id ?? '',
          genreIds: JSON.stringify(genreIds),
        }
      });
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
        <View style={styles.bar} />
        <View style={styles.bar} />
      </View>

      {/* Header */}
      <View style={styles.top}>
        <Text style={styles.step}>Étape 1 / 3</Text>
        <Text style={styles.title}>
          Quels sont tes{' '}
          <Text style={styles.titleAccent}>genres</Text>
          {' '}préférés ?
        </Text>
        <Text style={styles.subtitle}>
          Sélectionne au moins 1 genre pour personnaliser ton expérience.
        </Text>
      </View>

      {/* Genres */}
      <ScrollView contentContainerStyle={styles.genres} showsVerticalScrollIndicator={false}>
        {GENRES.map(genre => (
          <GenreChip
            key={genre}
            label={genre}
            active={selected.includes(genre)}
            onPress={() => toggle(genre)}
          />
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.bottom}>
        <Text style={styles.counter}>
          {selected.length > 0
            ? <Text><Text style={styles.counterAccent}>{selected.length}</Text> genre{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}</Text>
            : 'Sélectionne au moins 1 genre'
          }
        </Text>
        <Pressable
          style={[styles.btnPrimary, selected.length === 0 && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={selected.length === 0 || loading}
        >
          {loading
            ? <ActivityIndicator color="#0f0f0f" />
            : <Text style={styles.btnText}>Continuer</Text>
          }
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
    marginBottom: 32,
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
    lineHeight: 32,
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
  genres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    backgroundColor: '#171717',
  },
  pillActive: {
    backgroundColor: '#a78bfa',
    borderColor: '#a78bfa',
  },
  pillText: {
    fontSize: 13,
    color: '#555555',
  },
  pillTextActive: {
    color: '#0f0f0f',
    fontWeight: '500',
  },
  bottom: {
    marginTop: 32,
    gap: 12,
  },
  counter: {
    fontSize: 12,
    color: '#3a3a3a',
    textAlign: 'center',
  },
  counterAccent: {
    color: '#a78bfa',
  },
  btnPrimary: {
    backgroundColor: '#a78bfa',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f0f0f',
  },
});