import { View, Text, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { useMemo, useState } from 'react';

import * as Haptics from 'expo-haptics';

import { useGenres } from '../hooks/events/useGenres';

import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/tokens';
import { Feather } from '@expo/vector-icons';

const DATE_FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'today', label: "Aujourd'hui" },
  { key: 'weekend', label: 'Ce week-end' },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
];

export type Filters = {
  date: string;
  genres: string[];
}

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export default function FilterBar({ filters, onChange }: Readonly<Props>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const genres = useGenres();
  
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const activeCount = filters.genres.length;

  function toggleGenre(genre: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange({ ...filters, 
      genres: filters.genres.includes(genre)
        ? filters.genres.filter(g => g !== genre)
        : [...filters.genres, genre],
    });
  }

  return (
    <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <Pressable
            style={[styles.genreBtn, activeCount > 0 && styles.genreBtnActive]}
            onPress={() => setSheetOpen(true)}
          >
            <Feather name="sliders" size={13} color={activeCount > 0 ? colors.bg : colors.text} />
              <Text style={[styles.genreBtnText, activeCount > 0 && styles.genreBtnTextActive]}>
                {activeCount > 0 ? `${activeCount} genre${activeCount > 1 ? 's' : ''}` : 'Genres'}
              </Text>
          </Pressable>

          <View style={styles.separator} />

          {DATE_FILTERS.map(f => (
            <Pressable
              key={f.key}
              style={[styles.pill, filters.date === f.key && styles.pillActive]}
              onPress={() => onChange({ ...filters, date: f.key })}
            >
              <Text style={[styles.pillText, filters.date === f.key && styles.pillTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {activeCount > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {filters.genres.map(genre => (
              <Pressable key={genre} style={styles.chip} onPress={() => toggleGenre(genre)}>
                <Text style={styles.chipText}>{genre}</Text>
                <Feather name="x" size={12} color={colors.accent} />
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
          <Pressable style={styles.overlay} onPress={() => setSheetOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <View style={styles.handle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Filtrer par genre</Text>
                {activeCount > 0 && (
                  <Pressable onPress={() => onChange({ ...filters, genres: [] })} hitSlop={8}>
                    <Text style={styles.reset}>Tout effacer</Text>
                  </Pressable>
                )}
              </View>

              <ScrollView>
                {genres.map(g => {
                  const selected = filters.genres.includes(g.name);
                  return (
                    <Pressable
                      key={g.name}
                      style={[styles.pill,styles.pillInSheet, selected && styles.pillActive]}
                      onPress={() => toggleGenre(g.name)}
                    >
                      <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                        {g.name}
                      </Text>
                      <Text style={[styles.count, selected && styles.countActive]}>
                        {g.event_count}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Pressable style={styles.done} onPress={() => setSheetOpen(false)}>
                <Text style={styles.doneText}>Voir les concerts</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { paddingBottom: 12, backgroundColor: colors.bg, gap: 8 },
    row: { paddingHorizontal: 16, alignItems: 'center' },
    separator: { width: 1, height: 20, backgroundColor: colors.divider, marginHorizontal: 10 },

    genreBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingVertical: 9, paddingHorizontal: 14,
      borderRadius: 100, borderWidth: 1, borderColor: colors.text,
      marginRight: 8,
    },
    genreBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    genreBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },
    genreBtnTextActive: { color: colors.bg },

    pill: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingVertical: 9, paddingHorizontal: 14,
      borderRadius: 100, borderWidth: 1,
      borderColor: colors.divider, backgroundColor: colors.surface,
      marginRight: 8,
    },
    pillInSheet: { marginBottom: 8 },
    pillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    pillText: { fontSize: 13, color: colors.textMuted },
    pillTextActive: { color: colors.bg, fontWeight: '500' },
    count: { fontSize: 11, color: colors.textMuted, opacity: 0.6 },
    countActive: { color: colors.bg, opacity: 0.7 },

    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingVertical: 6, paddingHorizontal: 11,
      borderRadius: 100, backgroundColor: colors.accentSoftBg,
      marginRight: 8,
    },
    chipText: { fontSize: 12, fontWeight: '500', color: colors.accent },

    overlay: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28,
      maxHeight: '70%',
    },
    handle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: colors.divider, alignSelf: 'center', marginBottom: 16,
    },
    sheetHeader: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 16,
    },
    sheetTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
    reset: { fontSize: 13, color: colors.accent },
    grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, paddingBottom: 16 },
    done: {
      backgroundColor: colors.accent, borderRadius: 12,
      paddingVertical: 14, alignItems: 'center', marginTop: 8,
    },
    doneText: { fontSize: 14, fontWeight: '600', color: colors.bg },
  });
}