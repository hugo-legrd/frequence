import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Animated, useWindowDimensions } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { RefreshControl } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { MyEventRow } from '../../../../lib/types/profile';
import { useTheme } from '../../../../lib/theme/ThemeContext';
import type { ThemeColors } from '../../../../lib/theme/tokens';
import { muted } from '../../../../lib/theme/tokens';

import RemoteImage from '../../../components/RemoteImage';
import ProfileShareCard from '../../../components/ProfileShareCard';

import { useShareProfile } from '../../../hooks/social/useShareProfile';
import { useMyArtists } from '../../../hooks/profile/useMyArtists';
import { useMyProfile } from '../../../hooks/profile/useMyProfile';
import { useMyEvents } from '../../../hooks/events/useMyEvents';


type ArtistWithGenre = ReturnType<typeof useMyArtists>['artists'][number] & {
  genre?: string | null;
};

type GenreStat = { genre: string; label: string; count: number; base: string; tint: string };

const GENRE_KEYS = ['club', 'festival', 'concert'] as const;

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
  'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

const monthYear = (iso: string) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
};

const dayMonth = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// `style` ressemble à ['gig:dream_pop', 'dj:techno'] — on garde tout ce qui
// suit le préfixe, et un événement peut compter dans plusieurs genres.
function genresFromStyle(style: string[] | null | undefined): string[] {
  return (style ?? [])
    .map(tag => (tag.includes(':') ? tag.split(':')[1] : tag))
    .filter(Boolean);
}
function humanizeGenre(genre: string) {
  return genre.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
}

function deriveGenreStats(pastEvents: MyEventRow[], colors: ThemeColors): GenreStat[] {
  const counts = new Map<string, number>();
  for (const event of pastEvents) {
    for (const genre of genresFromStyle(event.style)) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  } 
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([genre, count], i) => {
      const swatch = colors.genrePalette[i % colors.genrePalette.length];
      return { genre, label: humanizeGenre(genre), count, base: swatch.base, tint: swatch.tint };
  });
} 

function groupPastEventsByYear(events: MyEventRow[]) {
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

/* ----- small parts ---------------*/

function SectionHeader({
  label, action, onAction,
}: { label: string; action?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);
  
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
  )
}

function ListeningProfile({ stats}: { stats: GenreStat[] }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);

  if (stats.length === 0) {
    return <Text style={styles.genresEmptyText}>Pas encore assez de concerts pour dresser ce profil</Text>
  }

  return (
    <View>
      <View style={styles.bar}>
        {stats.map(s => (
          <View key={s.genre} style={{ flex: s.count, backgroundColor: s.base }} />
        ))}
      </View>
      <View style={styles.chipRow}>
        {stats.map(s => (
          <View key={s.genre} style={[styles.chip, { backgroundColor: s.tint }]}>
            <View style={[styles.chipDot, { backgroundColor: s.base }]} />
            <Text style={styles.chipLabel}>{s.label}</Text>
            <Text style={styles.chipCount}>{s.count}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function ArtistBubble({ artist, tint} : { artist: ArtistWithGenre; tint?: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);
  


  return (
    <Pressable
      style={styles.bubble}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // TODO : Artist Page
        //router.push(`/(tabs)/screens/artist/${artist.artist_id}`)
      }}
    >
      {artist.image_url ? (
        <RemoteImage uri={artist.image_url} size={60} borderRadius={30} />
      ) : (
        <View style={[styles.bubbleImage, { backgroundColor: tint ?? colors.surface }]}>
          <Text style={styles.placeholder}>PHOTO{'\n'}Artiste </Text>
        </View>
      )}
      <Text style={styles.bubbleName} numberOfLines={2}>{artist.artist_name}</Text>
    </Pressable>
  );
}

function EventListRow({ item, badge } : { item: MyEventRow; badge?: string }) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);
  

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
        <Text style={styles.eventArtist} numberOfLines={1}>{item.artist_name ?? item.event_name}</Text>
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

function FadeInSection({ children, delay=0}: {children: React.ReactNode; delay?: number}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>
}

function ProfileSkeleton() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true}),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={styles.scrollContent}>
      <View style={styles.band} />
      <View style={styles.identity}>
        <Animated.View style={[styles.avatar, { backgroundColor: colors.divider, opacity } ]}/>
        <Animated.View style={[styles.skeletonLine, { width: '50%', height: 22, marginTop: 14, opacity}]}/>
        <Animated.View style={[styles.skeletonLine, { width: '70%', height: 13, marginTop: 8, opacity }]}/>
      </View>
    </View>
  )
}

/*----- screen -------------------- */

export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);
  const { width} = useWindowDimensions();

  const { profile, loading: profileLoading, refetch: refetchProfile } = useMyProfile();
  const { events, loading: eventsLoading, refetch: refetchEvents } = useMyEvents();
  const { artists } = useMyArtists();
  const [refreshing, setRefreshing] = useState(false);
  const { shotRef, share } = useShareProfile();

  useFocusEffect(
    useCallback(() => {
      refetchProfile();
      refetchEvents();
    }, [])
  );

  async function onRefresh() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await Promise.all([
        refetchProfile(),
        refetchEvents(),
        new Promise(resolve => setTimeout(resolve, 600)),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  const goingEvents = useMemo(
    () => events.filter(e => !e.is_past),
    [events]
  );
  const pastEvents = useMemo(
    () => events.filter(e => e.is_past),
    [events]
  );
  const genreStats = useMemo(() => deriveGenreStats(pastEvents, colors), [pastEvents, colors]);
  const years = useMemo(() => groupPastEventsByYear(pastEvents), [pastEvents]);
  const topArtist = artists[0]?.artist_name;

  const cell = (width - 40 - 18) / 3;

  if (profileLoading) {
    return (
      <View style={styles.container}>
        <ProfileSkeleton />
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Profil introuvable</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.hiddenShotContainer} pointerEvents='none'>
        <ViewShot 
          ref={shotRef} options={{ format: 'png', quality: 1}}>
            <ProfileShareCard 
              displayName={profile.display_name}
              concertsCount={pastEvents.length}
              artistsCount={artists.length}
              topArtist={topArtist}
              year={new Date().getFullYear()}
            />
          </ViewShot>
      </View>
      {refreshing && (
        <View style={styles.refreshBanner}>
          <ActivityIndicator color={colors.accent} size="small" />
        </View>
      )}
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="transparent" />
        }
      >
        {/* Header */}
        <LinearGradient 
          colors={colors.headerBand}
          locations={[0, 0.6, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{x: 0.85, y:1 }}
          style={styles.band}
        />

        <FadeInSection delay={0}>
          <View style={styles.identity}>
            <View style={styles.identityTop}>
              {profile.avatar_url ? (
                <RemoteImage uri={profile.avatar_url} size={76} borderRadius={38} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>{profile.display_name.charAt(0).toUpperCase()}</Text>
                </View>
              )}

              <View style={styles.identityActions}>
                <Pressable
                  style={styles.editBtn}
                  onPress={() => router.push('/(tabs)/screens/moi/modifier')}
                  hitSlop={6}
                >
                  <Text style={styles.editLabel}>Modifier</Text>
                </Pressable>
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    share();
                  }}
                  hitSlop={6}
                  accessibilityLabel='Partager mon profil'
                >
                  <Feather name="share" size={15} color={colors.text} />
                </Pressable>
              </View>
            </View>
          
              <Text style={styles.name}>{profile.display_name}</Text>
              <Text style={styles.meta}>
                {profile.city ? `${profile.city} · ` : ''}depuis {monthYear(profile.member_since)}
              </Text>

            <View style={styles.counts}>
              <Pressable onPress={() => router.push('/(tabs)/screens/moi/followers')} hitSlop={8}>
                  <Text style={styles.countValue}>
                    {profile.follower_count}
                    <Text style={styles.countLabel}> abonnés</Text>
                  </Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(tabs)/screens/moi/following')} hitSlop={8}>
                <Text style={styles.countValue}>
                  {profile.following_count}
                  <Text style={styles.countLabel}> abonnements</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </FadeInSection>

        {/* Stats */}
        <FadeInSection delay={80}>
          <View style={styles.section}>
            <SectionHeader label="SON PROFIL D'ÉCOUTE"/>
            <ListeningProfile stats={genreStats} />
          </View>
        </FadeInSection>

        {/* Genres */}
        <FadeInSection delay={140}>
          <View style={styles.section}>
              <SectionHeader 
                label={`ARTISTES SUIVIS · ${artists.length}`}
                action='Voir'
                onAction={() => router.push('/(tabs)/screens/moi/artistes')}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bubbleRow}
              >
                {artists.map(a => (
                  <ArtistBubble 
                    key={a.artist_id} 
                    artist={a} 
                    // tint={genreStats.find(s => s.genre === a.genre)?.tint}
                    />
                  ))}
                <Pressable style={styles.bubble} onPress={() => router.push('/(tabs)/screens/explorer')}>
                  <View style={[styles.bubbleImage, styles.bubbleAdd]}>
                    <Feather name="plus" size={18} color={muted(colors, 0.45)} />
                  </View>
                  <Text style={[styles.bubbleName, {color: muted(colors, 0.5) }]}>Suivre</Text>
                </Pressable>
              </ScrollView>
          </View>
        </FadeInSection>

        {eventsLoading && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.accent}/>
          </View>
        )}

        {/* Empty State */}
        {!eventsLoading && goingEvents.length === 0 && pastEvents.length === 0 && (
          <FadeInSection delay={200}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aucun concert pour l'instant</Text>
              <Text style={styles.emptySub}>Explore les événements pour commencer ta collection</Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push('/(tabs)/screens/concerts')}
              >
                <Text style={styles.emptyBtnText}>Explorer les concerts</Text>
              </Pressable>
            </View>
          </FadeInSection>
        )}

        {!eventsLoading && goingEvents.length > 0 && (
            <FadeInSection delay={200}>
              <View style={styles.section}>
                <SectionHeader label={`À VENIR · ${goingEvents.length}`} />
                  {goingEvents.map(item => (
                  <EventListRow 
                    key={item.event_id}
                    item={item}
                    badge={item.status === 'going' ? "J'y vais" : "Intéressé"}
                  />
                ))}
            </View>
          </FadeInSection>
        )}

          {/* Concerts Passés */}
          {!eventsLoading && pastEvents.length > 0 && (
            <FadeInSection delay={260}>
              <View style={styles.section}>
                <SectionHeader label={`CONCERTS PASSÉS · ${pastEvents.length}`} />
                {years.map(({ year, items }) => (
                  <View key={year} style={styles.yearBlock}>
                    <View style={styles.yearRow}>
                      <View style={styles.yearSpine} />
                      <Text style={styles.yearLabel}>{year}</Text>
                    </View>

                    <View style={styles.grid}>
                      {items.map(c => {
                        const genre = genresFromStyle(c.style)[0];
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
                              <View
                                style={[styles.art, {width: cell, height: cell, backgroundColor: tint ?? colors.surface }]}
                              >
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
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </FadeInSection>
          )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors, insetTop: number) {
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

    name: { marginTop: 14, fontSize: 27, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
    meta: { marginTop: 3, fontSize: 13, color: muted(colors) },
 
    counts: { flexDirection: 'row', gap: 20, marginTop: 13 },
    countValue: { fontSize: 16, fontWeight: '600', color: colors.text },
    countLabel: { fontSize: 13, fontWeight: '400', color: muted(colors, 0.58) },
 
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
 
    placeholder: { fontSize: 7.5, letterSpacing: 0.4, textAlign: 'center', color: muted(colors, 0.4) },
 
    emptyState: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 32 },
    emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
    emptySub: { color: muted(colors, 0.55), fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 16 },
    emptyBtn: {
      borderWidth: 1, borderColor: colors.accent, borderRadius: 10,
      paddingHorizontal: 20, paddingVertical: 10,
    },
    emptyBtnText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
 
    refreshBanner: { height: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    skeletonLine: { backgroundColor: colors.divider, borderRadius: 4 },
 
    hiddenShotContainer: { position: 'absolute', top: -9999, left: -9999, opacity: 0 },
  });
}