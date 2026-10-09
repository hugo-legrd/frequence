import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Animated, useWindowDimensions } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { RefreshControl } from 'react-native-gesture-handler';

import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../lib/theme/ThemeContext';
import { muted } from '../../../../lib/theme/tokens';

import RemoteImage from '../../../components/RemoteImage';
import ProfileShareCard from '../../../components/ProfileShareCard';
import { SectionHeader, ListeningProfile, EventListRow, FadeInSection,
  PastEventGrid, deriveGenreStats, monthYear, useProfileStyles, } 
from '../../../components/profile/profileParts';

import { useShareProfile } from '../../../hooks/social/useShareProfile';
import { useMyArtists } from '../../../hooks/profile/useMyArtists';
import { useMyProfile } from '../../../hooks/profile/useMyProfile';
import { useMyEvents } from '../../../hooks/events/useMyEvents';


type ArtistWithGenre = ReturnType<typeof useMyArtists>['artists'][number] & {
  genre?: string | null;
};

/* ----- small parts ---------------*/

function ArtistBubble({ artist, tint} : { artist: ArtistWithGenre; tint?: string }) {
  const { colors } = useTheme();
  const styles = useProfileStyles();
  
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

function ProfileSkeleton() {
  const { colors } = useTheme();
  const styles = useProfileStyles();
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
  const styles = useProfileStyles();
  const { width} = useWindowDimensions();

  const { profile, loading: profileLoading, refetch: refetchProfile } = useMyProfile();
  const { events, loading: eventsLoading, refetch: refetchEvents } = useMyEvents();
  const { artists } = useMyArtists();
  const [refreshing, setRefreshing] = useState(false);
  const { shotRef, share } = useShareProfile();

  const [expanded, setExpanded] = useState(false);

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
                onAction={() => router.push('/(tabs)/screens/moi/artists')}
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
                <PastEventGrid
                  events={pastEvents}
                  genreStats={genreStats}
                  cell={cell}
                  expanded={expanded}
                  onToggle={() => setExpanded(v => !v)}
                />
              </View>
            </FadeInSection>
          )}
      </ScrollView>
    </View>
  );
}