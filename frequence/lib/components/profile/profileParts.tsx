import { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import RemoteImage from '../RemoteImage';

import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/tokens';
import { muted } from '../../theme/tokens';
import type { MyEventRow } from '../../types/profile';

export type GenreStat = { genre: string; label: string; count: number; base: string; tint: string };

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
  'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export const monthYear = (iso: string) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const dayMonth = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export function deriveGenreStats(pastEvents: MyEventRow[], colors: ThemeColors): GenreStat[] {
  const counts = new Map<string, number>();
  for (const event of pastEvents) {
    for (const genre of event.genres ?? []) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([genre, count], i) => {
      const swatch = colors.genrePalette[i % colors.genrePalette.length];
      return { genre, label: genre, count, base: swatch.base, tint: swatch.tint };
    });
}

export function groupPastEventsByYear(events: MyEventRow[]) {
  const groups: Record<string, MyEventRow[]> = {};
  for (const event of events) {
    if (!event.starts_at) continue;
    const year = new Date(event.starts_at).getFullYear().toString();
    if (!groups[year]) groups[year] = [];
    groups[year].push(event);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, items]) => ({
      year,
      items: items.sort((a, b) => +new Date(b.starts_at!) - +new Date(a.starts_at!)),
    }));
}

export function useProfileStyles() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return useMemo(() => createProfileStyles(colors, insets.top), [colors, insets.top]);
}

export function SectionHeader({
  label, action, onAction,
}: { label: string; action?: string; onAction?: () => void }) {
  const styles = useProfileStyles();
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionRule} />
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function ListeningProfile({ stats, emptyText }: { stats: GenreStat[]; emptyText?: string }) {
  const { colors } = useTheme();
  const styles = useProfileStyles();
  const [expanded, setExpanded] = useState(false);
  const MAX = 6;

  if (stats.length === 0) {
    return (
      <Text style={styles.genresEmptyText}>
        {emptyText ?? 'Pas encore assez de concerts pour dresser ce profil'}
      </Text>
    );
  }

  const shown = expanded ? stats : stats.slice(0, MAX);
  const hidden = stats.slice(MAX);
  const hiddenTotal = hidden.reduce((sum, s) => sum + s.count, 0);

  return (
    <View>
      <View style={styles.bar}>
        {shown.map(s => (
          <View key={s.genre} style={{ flex: s.count, backgroundColor: s.base }} />
        ))}
        {!expanded && hidden.length > 0 && (
          <View style={{ flex: hiddenTotal, backgroundColor: colors.divider }} />
        )}
      </View>
      <View style={styles.chipRow}>
        {shown.map(s => (
          <View key={s.genre} style={[styles.chip, { backgroundColor: s.tint }]}>
            <View style={[styles.chipDot, { backgroundColor: s.base }]} />
            <Text style={styles.chipLabel}>{s.label}</Text>
            <Text style={styles.chipCount}>{s.count}</Text>
          </View>
        ))}
      </View>
      {stats.length > MAX && (
        <Pressable onPress={() => setExpanded(v => !v)} hitSlop={6} style={styles.moreInline}>
          <Text style={styles.moreInlineText}>
            {expanded ? 'Voir moins' : `+ ${hidden.length} autres genres`}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function EventListRow({ item, badge }: { item: MyEventRow; badge?: string }) {
  const styles = useProfileStyles();
  return (
    <Pressable
      style={styles.eventRow}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/(tabs)/screens/event/${item.event_id}`);
      }}
    >
      <RemoteImage uri={item.image_url} size={48} borderRadius={8} />
      <View style={styles.eventContent}>
        <Text style={styles.eventArtist} numberOfLines={1}>
          {item.artist_name ?? item.event_name}
        </Text>
        <Text style={styles.eventMeta} numberOfLines={1}>
          {item.venue_name}{item.venue_name && item.starts_at ? ' · ' : ''}{dayMonth(item.starts_at)}
        </Text>
      </View>
      {badge && (
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

/** Grille de concerts groupés par année, avec repli au-delà de 'initialCount'. */
export function PastEventGrid({
  events, genreStats, cell, expanded, onToggle,
}: {
  events: MyEventRow[];
  genreStats: GenreStat[];
  cell: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  const styles = useProfileStyles();

  const INITIAL = 6;
  const shown = expanded ? events : events.slice(0, INITIAL);
  const remaining = events.length - shown.length;
  const years = useMemo(() => groupPastEventsByYear(shown), [shown]);

  return (
    <>
      {years.map(({ year, items }) => (
        <View key={year} style={styles.yearBlock}>
          <View style={styles.yearRow}>
            <View style={styles.yearSpine} />
            <Text style={styles.yearLabel}>{year}</Text>
          </View>
          <View style={styles.grid}>
            {items.map(c => {
              const genre = c.genres?.[0];
              const tint = genreStats.find(s => s.genre === genre)?.tint;
              return (
                <Pressable
                  key={c.event_id}
                  style={{ width: cell }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/(tabs)/screens/event/${c.event_id}`);
                  }}
                >
                  {c.image_url ? (
                    <RemoteImage uri={c.image_url} size={cell} borderRadius={8} />
                  ) : (
                    <View style={[styles.art, { width: cell, height: cell, backgroundColor: tint ?? colors.surface }]}>
                      <Text style={styles.placeholder}>VISUEL{'\n'}ÉVÉNEMENT</Text>
                    </View>
                  )}
                  <Text style={styles.artTitle} numberOfLines={2}>
                    {c.artist_name ?? c.event_name}
                  </Text>
                  <Text style={styles.artMeta} numberOfLines={1}>
                    {dayMonth(c.starts_at)}{c.venue_name ? ` · ${c.venue_name}` : ''}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      ))}

      {events.length > INITIAL && (
        <Pressable style={styles.moreBtn} onPress={onToggle} hitSlop={6}>
          <Text style={styles.moreBtnText}>
            {expanded
              ? 'Voir moins'
              : `Voir ${remaining} concert${remaining > 1 ? 's' : ''} de plus`
            }
          </Text>
        </Pressable>
      )}
    </>
  );
}

export function createProfileStyles(colors: ThemeColors, insetTop: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
    empty: { color: colors.textMuted, fontSize: 14 },
    scrollContent: { paddingBottom: 34 },

    band: { height: 96 + insetTop, width: '100%' },

    identity: { paddingHorizontal: 20, marginTop: -30, zIndex: 1, elevation: 1 },
    identityTop: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
    avatar: {
      width: 76, height: 76, borderRadius: 38,
      backgroundColor: colors.surface,
      borderWidth: 3, borderColor: colors.bg,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarLetter: { fontSize: 30, fontWeight: '600', color: colors.accent },
    avatarRing: { borderWidth: 3, borderColor: colors.bg, borderRadius: 41 },

    identityActions: { flexDirection: 'row', gap: 8, paddingBottom: 6 },
    editBtn: {
      height: 34, paddingHorizontal: 14, borderRadius: 17,
      borderWidth: 1, borderColor: colors.divider,
      alignItems: 'center', justifyContent: 'center',
    },
    editLabel: { fontSize: 12.5, fontWeight: '600', color: colors.text },
    iconBtn: {
      width: 34, height: 34, borderRadius: 17,
      borderWidth: 1, borderColor: colors.divider,
      alignItems: 'center', justifyContent: 'center',
    },
    followBtn: {
      height: 34, paddingHorizontal: 18, borderRadius: 17,
      borderWidth: 1, borderColor: colors.accent,
      alignItems: 'center', justifyContent: 'center',
    },
    followBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    followLabel: { fontSize: 12.5, fontWeight: '600', color: colors.accent },
    followLabelActive: { color: colors.bg },

    name: { marginTop: 14, fontSize: 27, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
    handle: { marginTop: 2, fontSize: 13.5, color: muted(colors, 0.55) },
    meta: { marginTop: 3, fontSize: 13, color: muted(colors) },

    counts: { flexDirection: 'row', gap: 20, marginTop: 13 },
    countValue: { fontSize: 16, fontWeight: '600', color: colors.text },
    countLabel: { fontSize: 13, fontWeight: '400', color: muted(colors, 0.58) },

    mutuals: { marginTop: 12, fontSize: 12.5, lineHeight: 18, color: muted(colors, 0.6) },

    section: { paddingHorizontal: 20, paddingTop: 26 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionLabel: { fontSize: 10.5, fontWeight: '600', letterSpacing: 1.5, color: muted(colors, 0.5) },
    sectionRule: { flex: 1, height: 1, backgroundColor: colors.divider },
    sectionAction: { fontSize: 11.5, fontWeight: '600', color: colors.accent },

    bar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2, marginBottom: 11 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999,
    },
    chipDot: { width: 6, height: 6, borderRadius: 3 },
    chipLabel: { fontSize: 12.5, fontWeight: '600', color: colors.text },
    chipCount: { fontSize: 12.5, fontWeight: '500', color: muted(colors) },
    genresEmptyText: { fontSize: 12.5, color: muted(colors, 0.55) },

    bubbleRow: { gap: 12, paddingTop: 4, paddingRight: 20 },
    bubble: { width: 66, alignItems: 'center', gap: 6 },
    bubbleImage: {
      width: 60, height: 60, borderRadius: 30,
      alignItems: 'center', justifyContent: 'center',
    },
    bubbleAdd: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.divider },
    bubbleName: { fontSize: 11, fontWeight: '500', textAlign: 'center', lineHeight: 13, color: colors.text },

    eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    eventContent: { flex: 1 },
    eventArtist: { fontSize: 14.5, fontWeight: '600', color: colors.text },
    eventMeta: { fontSize: 12.5, color: muted(colors, 0.55), marginTop: 2 },
    badgePill: {
      borderWidth: 1, borderColor: colors.divider, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 5,
    },
    badgePillText: { color: colors.accent, fontSize: 11.5, fontWeight: '500' },

    yearBlock: { marginTop: 2 },
    yearRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
    yearSpine: { width: 3, height: 17, backgroundColor: colors.accent },
    yearLabel: { fontSize: 19, fontWeight: '600', letterSpacing: -0.2, color: colors.text },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
    art: { borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    artTitle: { marginTop: 7, fontSize: 12, fontWeight: '600', lineHeight: 15, color: colors.text },
    artMeta: { fontSize: 10.5, lineHeight: 13.5, color: muted(colors, 0.52) },

    moreBtn: {
      marginTop: 16, alignSelf: 'flex-start',
      borderWidth: 1, borderColor: colors.divider, borderRadius: 10,
      paddingHorizontal: 16, paddingVertical: 9,
    },
    moreBtnText: { fontSize: 12.5, fontWeight: '600', color: colors.accent },

    placeholder: { fontSize: 7.5, letterSpacing: 0.4, textAlign: 'center', color: muted(colors, 0.4) },

    emptyState: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 32 },
    emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
    emptySub: { color: muted(colors, 0.55), fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 16 },
    emptyBtn: {
      borderWidth: 1, borderColor: colors.accent, borderRadius: 10,
      paddingHorizontal: 20, paddingVertical: 10,
    },
    emptyBtnText: { color: colors.accent, fontSize: 14, fontWeight: '600' },

    lockedState: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 44, gap: 10 },
    lockedTitle: { fontSize: 15.5, fontWeight: '600', color: colors.text },
    lockedSub: { fontSize: 13, color: muted(colors, 0.55), textAlign: 'center', lineHeight: 19 },

    refreshBanner: { height: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    skeletonLine: { backgroundColor: colors.divider, borderRadius: 4 },
    hiddenShotContainer: { position: 'absolute', top: -9999, left: -9999, opacity: 0 },

    backFloat: {
      position: 'absolute', top: 56, left: 16, zIndex: 10,
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.panelTranslucent,
      borderWidth: 1, borderColor: colors.divider,
      alignItems: 'center', justifyContent: 'center',
    },
    backArrow: { color: colors.text, fontSize: 17 },
    moreInline: { marginTop: 10 },
    moreInlineText: { fontSize: 12, fontWeight: '600', color: colors.accent }
  });
}