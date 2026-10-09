import { View, Text, Pressable, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useMemo, useState } from 'react';

import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { usePublicProfile } from '../../../hooks/profile/usePublicProfile';
import { useFollow } from '../../../hooks/social/useFollow';
import { useMutualFriends } from '../../../hooks/social/useMutualFriends';
import { useUserEvents } from '../../../hooks/events/useUserEvents';

import { useTheme } from '../../../../lib/theme/ThemeContext';

import RemoteImage from '../../../components/RemoteImage';
import { SectionHeader, ListeningProfile, EventListRow, 
  FadeInSection, PastEventGrid, deriveGenreStats, useProfileStyles } 
from '../../../components/profile/profileParts';

export default function PublicProfileScreen() {
  const { colors } = useTheme();
  const styles = useProfileStyles();
  const { width } = useWindowDimensions();

  const { userId, from } = useLocalSearchParams<{ userId: string, from?: string }>();
  const { profile, loading, setProfile } = usePublicProfile(userId);
  const { follow, unfollow, loading: followLoading } = useFollow();
  const { mutuals, totalCount } = useMutualFriends(userId);
  const { events, loading: eventsLoading } = useUserEvents(userId, !!profile?.can_view);

  const [expanded, setExpanded] = useState(false);

  const goingEvents = useMemo(() => events.filter(e => !e.is_past), [events]);
  const pastEvents = useMemo(() => events.filter(e => e.is_past), [events]);
  const genreStats = useMemo(() => deriveGenreStats(pastEvents, colors), [pastEvents, colors]);

  const cell = (width - 40 - 18) / 3;

  async function toggleFollow() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!profile) return;
    const wasFollowing = profile.is_following;
    const nowFollowing = !wasFollowing;

    setProfile({
      ...profile,
      is_following: nowFollowing,
      followers_count: profile.followers_count + (wasFollowing ? - 1 : 1),
      can_view: profile.profile_visibility === 'public' || nowFollowing,
    });

    const ok = wasFollowing ? await unfollow(profile.id) : await follow(profile.id);
    if (!ok) {
      setProfile({ 
        ...profile, 
        is_following: wasFollowing, 
        followers_count: profile.followers_count,
        can_view: profile.can_view,
      });
    }
  }

  function goBack() {
    if (from) router.navigate(from as any);
    else router.back();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Profil introuvable</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.backFloat} onPress={goBack} hitSlop={8}>
        <Text style={styles.backArrow}>←</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient 
          colors={colors.headerBand}
          locations={[0, 0.6, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.band}
        />

        <FadeInSection delay={0}>
          <View style={styles.identity}>
            <View style={styles.identityTop}>
              {profile.avatar_url ? (
                <View style={styles.avatarRing}>
                  <RemoteImage uri={profile.avatar_url} size={76} borderRadius={38} />
                </View>
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>
                    {profile.display_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.identityActions}>
                <Pressable
                  style={[styles.followBtn, profile.is_following && styles.followBtnActive]}
                  onPress={toggleFollow}
                  disabled={followLoading}
                  hitSlop={6}
                >
                  <Text style={[styles.followLabel, profile.is_following && styles.followLabelActive]}>
                    {profile.is_following ? 'Suivi' : 'Suivre'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.name}>{profile.display_name}</Text>
            {profile.handle && <Text style={styles.handle}>@{profile.handle}</Text>}

            <View style={styles.counts}>
              <Pressable
                hitSlop={8}
                onPress={() => router.push({
                  pathname: '/(tabs)/screens/amis/followers',
                  params: { userId: profile.id, name: profile.display_name },
                })}
              >
                <Text style={styles.countValue}>
                  {profile.followers_count}
                  <Text style={styles.countLabel}> abonnés</Text>
                </Text>
              </Pressable>
              <Pressable
                hitSlop={8}
                onPress={() => router.push({
                  pathname: '/(tabs)/screens/amis/following',
                  params: { userId: profile.id, name: profile.display_name }, 
                })}
              >
                <Text style={styles.countValue}>
                  {profile.following_count}
                  <Text style={styles.countLabel}> abonnements</Text>
                </Text>
              </Pressable>
            </View>

            {mutuals.length > 0 && (
              <Text style={styles.mutuals}>
                {mutuals.map(m => m.display_name).join(', ')}
                {totalCount > mutuals.length
                  ? ` et ${totalCount - mutuals.length} autre${totalCount - mutuals.length > 1 ? 's' : ''}`
                  : ''}
                {' '}en commun
              </Text>
            )}
          </View>
        </FadeInSection>
        
        {!profile.can_view ? (
          <FadeInSection delay={80}>
            <View style={styles.lockedState}>
              <Feather name="lock" size={22} color={colors.textMuted} />
              <Text style={styles.lockedTitle}>Ce compte est privé</Text>
              <Text style={styles.lockedSub}>
                Abonne-toi à {profile.display_name} pour voir les concerts qui l'intéressent. 
              </Text>
            </View>
          </FadeInSection>
        ) : eventsLoading ? (
          <View style={{ padding: 40, alignItems: 'center'}}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : events.length === 0 ? (
          <FadeInSection delay={80}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aucun concert pour l'instant</Text>
              <Text style={styles.emptySub}>
                {profile.display_name} n'a pas encore marqué de concert.
              </Text>
            </View>
          </FadeInSection>
        ) : (
          <>
            <FadeInSection delay={80}>
              <View style={styles.section}>
                <SectionHeader label="SON PROFIL D'ÉCOUTE" />
                <ListeningProfile 
                  stats={genreStats}
                  emptyText={`Pas encore assez de concerts passés pour dresser ce profil`}
                />
              </View>
            </FadeInSection>

            {goingEvents.length > 0 && (
              <FadeInSection delay={140}>
                  <View style={styles.section}>
                    <SectionHeader label={`À VENIR · ${goingEvents.length}`} />
                    {goingEvents.map(item => (
                      <EventListRow
                        key={item.event_id}
                        item={item}
                        badge={item.status === 'going' ? "J'y vais" : 'Intéressé'}
                      />
                    ))}
                  </View>
              </FadeInSection>
            )}

            {pastEvents.length > 0 && (
              <FadeInSection delay={200}>
                <View style={styles.section}>
                  <SectionHeader label={`CONCERTS PASSÉS · ${pastEvents.length}`} />
                  <PastEventGrid
                    events={pastEvents}
                    genreStats={genreStats}
                    cell={cell}
                    expanded={expanded}
                    onToggle={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setExpanded(v => !v);
                    }}
                  />
                </View>
              </FadeInSection>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}