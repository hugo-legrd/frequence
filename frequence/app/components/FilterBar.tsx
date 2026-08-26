import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useTheme } from '../../lib/theme/ThemeContext';
import { ThemeColors } from '../../lib/theme/tokens';

const DATE_FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'today', label: "Aujourd'hui" },
  { key: 'weekend', label: 'Ce week-end' },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
];

const GENRES = [
  'Techno', 'House', 'Hardgroove', 'Uptempo',
  'Electro', 'Ambient', 'Jazz', 'Hip-Hop',
  'Drum & Bass', 'Soul', 'Indie Rock', 'Metal',
];

export type Filters = {
  date: string;
  genres: string[];
}

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export default function FilterBar({ filters, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  

  function toggleDate(key: string) {
    onChange({ ...filters, date: key });
  }

  function toggleGenre(genre: string) {
    const genres = filters.genres.includes(genre)
      ? filters.genres.filter(g => g !== genre)
      : [...filters.genres, genre];
    onChange({ ...filters, genres });
  }

  function resetGenres() {
    onChange({ ...filters, genres: [] });
  }

  return (
    <View style={styles.container}>
      {/* Filtre date */}
      <Text style={styles.label}>Date</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.row}
        contentContainerStyle={styles.rowContent}
      >
        {DATE_FILTERS.map(f => (
          <Pressable
            key={f.key}
            style={[styles.pill, filters.date === f.key && styles.pillActive]}
            onPress={() => toggleDate(f.key)}
          >
            <Text style={[styles.pillText, filters.date === f.key && styles.pillTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Filtre genre*/}
      <View style={styles.genreHeader}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Genre</Text>
          {filters.genres.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{filters.genres.length}</Text>
            </View>
          )}
        </View>
        {filters.genres.length > 0 && (
          <Pressable onPress={resetGenres}>
            <Text style={styles.reset}>Réinitialiser</Text>
          </Pressable>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.row}
        contentContainerStyle={styles.rowContent}
      >
        {GENRES.map(genre => (
          <Pressable
            key={genre}
            style={[styles.pill, filters.genres.includes(genre) && styles.pillActive]}
            onPress={() => toggleGenre(genre)}  
            >
              <Text style={[styles.pillText, filters.genres.includes(genre) && styles.pillTextActive]}>
                {genre}
              </Text>
            </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 10,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  genreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  badge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    color: colors.bg,
    fontWeight: '500',
  },
  reset: {
    fontSize: 11,
    color: colors.accent,
  },
  row: {
    flexGrow: 0,
  },
  rowContent: {
    gap: 8,
    paddingRight: 16,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pillText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  pillTextActive: {
    color: colors.bg,
    fontWeight: '500',
  },
})
};