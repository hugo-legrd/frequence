import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/services/supabase';
import { makeStyles } from '../../lib/theme/makeStyles';
import { StepHeader, Accent } from '../components/StepHeader';
import GenreChip from '../components/GenreChip';
import { PrimaryButton } from '../components/auth/PrimaryButton';

const GENRES = [
  'Techno', 'House', 'Hardgroove', 'Uptempo',
  'Indie Rock', 'Jazz', 'Hip-Hop', 'Electro',
  'Ambient', 'Drum & Bass', 'Soul', 'Metal',
];

export default function GenresScreen(){
  const s = useStyles();
  const insets = useSafeAreaInsets();
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
    Haptics.selectionAsync();
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
    <View
      style={[
        s.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
      ]}
    >
      <StepHeader 
        step={1}
        total={2}
        title={<>Quels sont tes <Accent>genres</Accent> préférés ?</>}
        subtitle='Sélectionne au moins 1 genre pour personnaliser ton expérience.'
      />
      {/* Genres */}
      <ScrollView contentContainerStyle={s.genres} showsVerticalScrollIndicator={false}>
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
      <View style={s.bottom}>
        <Text style={s.counter}>
          {selected.length > 0
            ? <Text><Text style={s.counterAccent}>{selected.length}</Text> genre{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}</Text>
            : 'Sélectionne au moins 1 genre'
          }
        </Text>
        <PrimaryButton 
          label="Continuer"
          onPress={handleContinue}
          loading={loading}
          disabled={selected.length === 0}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 28 },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 24 },
  bottom: { marginTop: 24, gap: 12 },
  counter: { fontSize: 12, color: c.textMuted, textAlign: 'center' },
  counterAccent: { color: c.accent, fontWeight: '600' },
}));