import { useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, Animated } from 'react-native';
import { router } from 'expo-router';
import { useMyProfile } from '../../../hooks/useMyProfile';
import { useMyEvents } from '../../../hooks/useMyEvents';
import * as Haptics from 'expo-haptics';
import { RefreshControl } from 'react-native-gesture-handler';
import { MyEventRow } from '../../../../lib/types/profile';


function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric'});
}

function formatEventDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });
}

function ProfileSkeleton() {
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
      <View style={styles.profileHeader}>
        <Animated.View style={[styles.avatar, styles.skeletonBlock, {opacity} ]}/>
        <View style={styles.profileInfo}>
          <Animated.View style={[styles.skeletonLine, { width: '60%', height: 20, opacity}]}/>
          <Animated.View style={[styles.skeletonLine, { width: '80%', height: 13, marginTop: 8, opacity }]}/>
        </View>
      </View>

      <View style={styles.statsRow}>
        {[1, 2, 3].map(i => (
          <View key={i} style={styles.statBlock}>
            <Animated.View style={[styles.skeletonLine, { width: 30, height: 18, opacity}]} />
            <Animated.View style={[styles.skeletonLine, { width: 50, height: 12, marginTop: 4, opacity}]} />
          </View>
        ))}
      </View>
    </View>
  )
}

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true}),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }]}}>
      {children}
    </Animated.View>
  )
}

function EventImage({ uri }: { uri: string | null }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false)
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (loaded) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true}),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [loaded]);

  if (!uri) {
    return <View style={styles.eventImagePlaceholder} />;
  }

  if (failed) return <View style={styles.eventImagePlaceholder} />

  return (
    <View style={styles.eventImageContainer}>
      {!loaded && (
        <Animated.View style={[styles.eventImagePlaceholder, styles.eventImageSkeleton, { opacity }]} />
      )}
      <Image 
        source={{ uri }}
        style={[styles.eventImagePlaceholder, { position: 'absolute'}]}
        resizeMode="cover"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </View>
  );
}

function EventRow({ item, badge }: { item: MyEventRow; badge?: string }) {
  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(tabs)/screens/event/${item.event_id}`);
  }
  return (
    <Pressable
      style={styles.eventRow}
      onPress={handlePress}
    >
      <EventImage uri={item.image_url} />
      <View style={styles.eventContent}>
        <Text style={styles.eventArtist}>{item.artist_name ?? item.event_name}</Text>
        <Text style={styles.eventMeta}>
          {item.venue_name}
          {item.venue_name && item.starts_at ? ' · ' : ''}
          {formatEventDate(item.starts_at)}
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

export default function ProfileScreen() {
  const { profile, loading: profileLoading, refetch: refetchProfile } = useMyProfile();
  const { events, loading: eventsLoading, refetch: refetchEvents } = useMyEvents();
  const [refreshing, setRefreshing] = useState(false);

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
      {refreshing && (
        <View style={styles.refreshBanner}>
          <ActivityIndicator color="#a78bfa" size="small" />
        </View>
      )}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="transparent" />
        }
      >
        {/* Header */}
        <FadeInSection delay={0}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{profile.display_name}</Text>
              <Text style={styles.location}>
                Paris · Membre depuis {formatMemberSince(profile.member_since)}
              </Text>
            </View>
            <Pressable style={styles.editBtn} disabled>
              <Text style={styles.editBtnText}>Modifier</Text>
            </Pressable>
          </View>
        </FadeInSection>

        {/* Stats */}
        <FadeInSection delay={80}>
          <View style={styles.statsRow}>
            <Pressable style={styles.statBlock}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/screens/moi/concerts');
              }}>
                <Text style={styles.statValue}>{profile.concerts_count}</Text>
                <Text style={styles.statLabel}>Concerts</Text>
            </Pressable>
            <View style={styles.statDivider} />
            <Pressable style={styles.statBlock}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/screens/moi/artists')
              }}
            >
              <Text style={styles.statValue}>{profile.artists_count}</Text>
              <Text style={styles.statLabel}>Artistes</Text>
            </Pressable> 
            <View style={styles.statDivider} />
            <Pressable style={styles.statBlock}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/screens/amis')
              }}
            >
              <Text style={styles.statValue}>{profile.friends_count}</Text>
              <Text style={styles.statLabel}>Amis</Text>
            </Pressable>
          </View>
        </FadeInSection>

        {/* Genres */}
        <FadeInSection delay={160}>
          {profile.genres && profile.genres.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>MES GENRES</Text>
              <View style={styles.genresRow}>
                {profile.genres.map(genre => (
                  <View key={genre.id} style={styles.genrePill}>
                    <Text style={styles.genrePillText}>{genre.name}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>MES GENRES</Text>
              <Text style={styles.genresEmptyText}>Aucun genre sélectionné</Text>
            </>
          )}
        </FadeInSection>

        {/* J'y vais */}
        <FadeInSection delay={240}>
          {eventsLoading && (
            <View style={{ padding: 40, alignItems: 'center'}}>
              <ActivityIndicator color="#a78bfa" />
            </View>
          )}

          {/* Empty State */}
          {!eventsLoading && goingEvents.length === 0 && pastEvents.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aucun concert pour l'instant</Text>
              <Text style={styles.emptySub}>Explore les événements pour commencer ta collection</Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push('(tabs)/screens/concerts')}
              >
                <Text style={styles.emptyBtnText}>Explorer les concerts</Text>
              </Pressable>
            </View>
          )}

          {!eventsLoading && goingEvents.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>J'Y VAIS</Text>
              {goingEvents.map(item => (
                <EventRow 
                  key={item.event_id}
                  item={item}
                  badge={item.status === 'going' ? "J'y vais" : "Intéressé"}
                />
              ))}
            </>
          )}

          {/* Concerts Passés */}
          {!eventsLoading && pastEvents.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>CONCERTS PASSÉS</Text>
              {pastEvents.map(item => (
                <EventRow key={item.event_id} item={item} />
              ))}
            </>
          )}
        </FadeInSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#555555', fontSize: 14 },
  scrollContent: { paddingTop: 60, paddingBottom: 40 },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    gap: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(167,139,250,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '600', color: '#a78bfa' },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '600', color: '#e5e5e5' },
  location: { fontSize: 13, color: '#555555', marginTop: 4 },
  editBtn: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 6,
  },
  editBtnText: { color: '#555555', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    marginHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1e1e1e',
    paddingVertical: 16,
  },
  statBlock: { flex: 1, alignItems: 'center'},
  statDivider: { width: 1, backgroundColor: '#1e1e1e'},
  statValue: { fontSize: 18, fontWeight: '600', color: '#e5e5e5'},
  statLabel: { fontSize: 12, color: '#555555', marginTop: 4 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555555',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
  },
  genrePill: {
    backgroundColor: '#171717',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  genrePillText: { color: '#e5e5e5', fontSize: 13, fontWeight: '500' },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  }, 
  eventImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
  },
  eventImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1e1e1e',
  },
  eventImageSkeleton: {
    position: 'absolute',
  },
  eventContent: { flex: 1 },
  eventArtist: { fontSize: 15, fontWeight: '500', color: '#e5e5e5' },
  eventMeta: { fontSize: 13, color: '#555555', marginTop: 2 },
  badgePill: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgePillText: { color: '#a78bfa', fontSize: 12, fontWeight: '500' },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
  },
  emptyTitle: { color: '#e5e5e5', fontSize: 16, fontWeight: '600'},
  emptySub: {
    color: '#555555',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  emptyBtn: {
    borderWidth: 1,
    borderColor: '#a78bfa',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyBtnText: { color: '#a78bfa', fontSize: 14, fontWeight: '600' },
  genresEmptyText: {
    color: '#555555',
    fontSize: 13,
    paddingHorizontal: 16,
  },
  refreshBanner: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f'
  },
  skeletonBlock: { backgroundColor:  "#1e1e1e" },
  skeletonLine: {
    backgroundColor: '#1e1e1e',
    borderRadius: 4,
  } 
});