import { View, Text, Pressable, ScrollView, ActivityIndicator, useWindowDimensions, Alert } from 'react-native';
import { useMemo, useState } from 'react';

import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { usePublicProfile } from '../../lib/hooks/profile/usePublicProfile';
import { useFollow } from '../../lib/hooks/social/useFollow';
import { useMutualFriends } from '../../lib/hooks/social/useMutualFriends';
import { useUserEvents } from '../../lib/hooks/events/useUserEvents';

import { useTheme } from '../../lib/theme/ThemeContext';

import RemoteImage from '../../lib/components/RemoteImage';
import { SectionHeader, ListeningProfile, EventListRow, 
  FadeInSection, PastEventGrid, deriveGenreStats, useProfileStyles } 
from '../../lib/components/profile/profileParts';

export default function PublicProfileScreen() {
  const { colors } = useTheme();
  const styles = useProfileStyles();
  const { width } = useWindowDimensions();

  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { profile, loading, setProfile } = usePublicProfile(userId);
  const { follow, unfollow, cancelRequest, loading: followLoading } = useFollow();
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
    
    const before = profile;
    const isPrivate = profile.profile_visibility === 'followers';

    // Demande en cours : on l'annule
    if (profile.has_requested) {
      setProfile({ ...profile, has_requested: false });
      const ok = await cancelRequest(profile.id);
      if (!ok) setProfile(before);
      return;
    }

    // Déjà abonné: on se désabonne (avec confirmation si le compte est privé)
    if (profile.is_following) {
      const doUnfollow = async () => {
        setProfile({
          ...before,
          is_following: false,
          followers_count: before.followers_count - 1,
          can_view: !isPrivate,
        });
        const ok = await unfollow(before.id);
        if (!ok) setProfile(before);
      };

      if (isPrivate) {
        Alert.alert(
          `Ne plus suivre ${profile.display_name} ?`,
          'Ce compte est privé: il faudra refaire une demande pour voir ses concerts.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Ne plus suivre', style: 'destructive', onPress: doUnfollow },
          ],
        );
      } else {
        await doUnfollow();
      }
      return;
    }

    // Pas abonné: abonnement direct si public, demande si privé
    setProfile(isPrivate
      ? { ...profile, has_requested: true }
      : { ...profile, is_following: true, followers_count: profile.followers_count + 1, can_view: true });
    
      const result = await follow(profile.id);
      if (!result) {
        setProfile(before);
        return;
      }

      // Le serveur a le dernier mot (si le compte a changé de visibilité entre-temps)
      if (result === 'following' && isPrivate) {
        setProfile({ ...before, is_following: true, followers_count: before.followers_count + 1, can_view: true });
      } else if (result === 'requested' && !isPrivate) {
        setProfile({ ...before, has_requested: true });
      }
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/screens/home');
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
                  style={[styles.followBtn, (profile.is_following || profile.has_requested) && styles.followBtnActive]}
                  onPress={toggleFollow}
                  disabled={followLoading}
                  hitSlop={6}
                >
                  <Text style={[styles.followLabel, (profile.is_following || profile.has_requested) && styles.followLabelActive]}>
                    {profile.is_following ? 'Suivi' : profile.has_requested ? 'Demandé' : 'Suivre'}
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
                  pathname: '/user/followers',
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
                  pathname: '/user/following',
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
                {profile.has_requested
                  ? `Demande envoyée. Tu verras ses concerts dès que ${profile.display_name} l'aura acceptée.`
                  : `Envoie une demande à ${profile.display_name} pour voir les concerts qui l'intéressent.`}
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