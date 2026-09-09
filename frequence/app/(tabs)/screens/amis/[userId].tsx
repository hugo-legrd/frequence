import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useMemo } from 'react';

import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

import { usePublicProfile } from '../../../hooks/profile/usePublicProfile';
import { useFollow } from '../../../hooks/social/useFollow';
import { useMutualFriends } from '../../../hooks/social/useMutualFriends';

import { useTheme } from '../../../../lib/theme/ThemeContext';
import type { ThemeColors } from '../../../../lib/theme/tokens';

import RemoteImage from '../../../components/RemoteImage';

export default function PublicProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { profile, loading, setProfile } = usePublicProfile(userId);
  const { follow, unfollow, loading: followLoading } = useFollow();
  const { mutuals, totalCount } = useMutualFriends(userId);

  async function toggleFollow() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!profile) return;
    const wasFollowing = profile.is_following;

    setProfile({
      ...profile,
      is_following: !wasFollowing,
      followers_count: profile.followers_count + (wasFollowing ? - 1 : 1),
    });

    const success = wasFollowing
      ? await unfollow(profile.id)
      : await follow(profile.id);
  

    if (!success) {
      setProfile({
        ...profile,
        is_following: wasFollowing,
        followers_count: profile.followers_count,
      });
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#a78bfa" />
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
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backArrow}>←</Text>
      </Pressable>

      <View style={styles.header}>
        {profile.avatar_url ? (
          <RemoteImage uri={profile.avatar_url} size={80} borderRadius={40} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.display_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{profile.display_name}</Text>
        {profile.handle && <Text style={styles.handle}>@{profile.handle}</Text>}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.followers_count}</Text>
            <Text style={styles.statLabel}>Abonnés</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.following_count}</Text>
            <Text style={styles.statLabel}>Abonnements</Text>
          </View>
        </View>

        <Pressable
          style={[styles.followBtn, profile.is_following && styles.followBtnActive]}
          onPress={toggleFollow}
          disabled={followLoading}
        >
          <Text style={[styles.followBtnText, profile.is_following && styles.followBtnTextActive]}>
            {profile.is_following ? 'Suivi' : 'Suivre'}
          </Text>
        </Pressable>
        {mutuals.length > 0 && (
            <Text style={styles.mutualsText}>
              Amis en commun: {mutuals.map(m => m.display_name).join(', ')}
              {totalCount > mutuals.length && ` +${totalCount - mutuals.length} autre${totalCount - mutuals.length > 1 ? 's' : ''}`}
            </Text>
        )}
        
        {profile.can_view ? (
          <View style={styles.contentSection}>
            <Text style={styles.sectionLabel}>{profile.events_count} concerts</Text>
          </View>
        ) : (
          <View style={styles.lockedState}>
            <Feather name="lock" size={22} color={colors.textMuted} />
            <Text style={styles.lockedTitle}>Ce compte est privé</Text>
            <Text style={styles.lockedSub}>
              Abonne toi à {profile.display_name} pour voir les concerts qui l'intéressent.
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg},
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center'},
  empty: { color: colors.textMuted, fontSize: 14},
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: { color: colors.text, fontSize: 18 },
  header: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '600', color: colors.accent},
  name: { fontSize: 20, fontWeight: '600', color: colors.text},
  statsRow: { flexDirection: 'row', gap: 32, marginTop: 16, marginBottom: 20 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '600', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2},
  followBtn: {
    borderWidth: 1, 
    borderColor: colors.accent, 
    borderRadius: 10, 
    paddingHorizontal: 24, 
    paddingVertical: 10, 
  },
  followBtnActive: { backgroundColor: colors.accent },
  followBtnText: { color: colors.accent, fontSize: 14, fontWeight: '600'},
  followBtnTextActive: { color: colors.bg },
  mutualsText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 24
  },
  contentSection: {
    width: "100%",
    marginTop: 28,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: 12,
  },
  handle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  lockedState: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40, gap: 8 },
  lockedTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  lockedSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
})
};