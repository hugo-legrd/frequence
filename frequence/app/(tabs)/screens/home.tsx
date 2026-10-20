import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';

import { useState, useMemo, useCallback, useRef } from 'react';

import { Ionicons } from '@expo/vector-icons';

import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useNightPick, type NightEvent } from '../../../lib/hooks/events/useNightPick';
import { useMyProfile } from '../../../lib/hooks/profile/useMyProfile';

import RemoteImage from '../../../lib/components/RemoteImage';
import { getCategoryLabel } from '../../../lib/utils/eventCategory';

import { useTheme } from '../../../lib/theme/ThemeContext';
import type { ThemeColors } from '../../../lib/theme/tokens';

const WHEN = {
  today: {
    label: 'Ce soir',
    greeting: 'Voici ta nuit.',
    pick: 'LE PICK DE LA NUIT',
    others: 'AUSSI CE SOIR',
    friends: 'ce soir',
    empty: "Rien de prévu ce soir pour l'instant.",
  },
  weekend: {
    label: 'Ce week-end',
    greeting: 'Voici ton week-end.',
    pick: 'LE PICK DU WEEK-END',
    others: 'AUSSI CE WEEK-END',
    friends: 'ce week-end',
    empty: "Rien de prévu ce week-end pour l'instant.",
  },
} as const;

type WhenKey = keyof typeof WHEN;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Bonne nuit.';
  if (hour < 18) return 'Bonjour.';
  return 'Bonsoir.'
}

function formatFriendsLabel(names: string[], total: number): string {
  if (names.length === 0 || total === 0) return '';
  if (total === 1) return names[0];
  const extra = total - 1;
  return `${names[0]} + ${extra} ami${extra > 1 ? 's' : ''}`;
}

function formatWhen(iso: string | null, when: WhenKey): string {
  if (!iso) return '';
  const d = new Date(iso);
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (when === 'today') return time;
  const day = d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} ${time}`;
}

function formatMeta(event: NightEvent, when: WhenKey): string {
  return [event.venue_name, formatWhen(event.starts_at, when)].filter(Boolean).join(' · ');
}

function openEvent(id: string) {
  router.push(`/event/${id}`);
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [when, setWhen] = useState<WhenKey>('today');
  const { night, loading, refetch } = useNightPick(when);
  const { profile } = useMyProfile();
  const [refreshing, setRefreshing] = useState(false);

  const userInitial = profile?.display_name?.charAt(0).toUpperCase() ?? '';
  const copy = WHEN[when];
  const pick = night?.pick ?? null;
  const others = night?.others ?? [];
  const friendsOut = night?.friends_out ?? 0;
  const pickFriendNames = (night?.pick_friends ?? []).map(f => f.name);

  // On recharge en revenant sur l'onglet (un ami a pu marquer une soirée entre-temps)
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false; // Le hook fait déjà le chargement inital
        return;
      }
      refetch();
    }, [refetch])
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), new Promise(resolve => setTimeout(resolve, 600))]);
    } finally {
      setRefreshing(false);
    }
  }

  function selectWhen(key: WhenKey) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWhen(key);
  }
  
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>fréquence.</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.iconButton}
              onPress={() => router.push('/search')}
              hitSlop={8}
              accessibilityLabel="Rechercher"
            >
              <Ionicons name="search" size={18} color={colors.text} />
            </Pressable>
            <Pressable 
              style={styles.profileButton} 
              onPress={() => router.push('/(tabs)/screens/moi')}
              accessibilityLabel="Mon profil"  
            >
              <Text style={styles.profileIcon}>{userInitial}</Text>
            </Pressable>
          </View>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>{getGreeting()}{'\n'}{copy.greeting}</Text>

        {/* Filters */}
        <View style={styles.filters}>
          {(Object.keys(WHEN) as WhenKey[]).map(key => {
            const active = when === key;
            return (
              <Pressable
                key={key}
                style={[styles.filter, active && styles.filterActive]}
                onPress={() => selectWhen(key)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {WHEN[key].label}
                </Text>
              </Pressable>
            );
          })}
        </View>


        {loading ? (
          <View style={styles.sectionLoading}>
              <ActivityIndicator color={colors.accent} />
          </View>
        ) : !pick ? (
          /* Aucune soirée sur la période*/
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{copy.empty}</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/(tabs)/screens/concerts')}>
              <Text style={styles.emptyBtnText}>Voir tous les concerts</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Le pick */}
            <Text style={styles.sectionLabel}>{copy.pick}</Text>
            <Pressable
              style={({ pressed }) => [styles.pickCard, pressed && styles.pressed]}
              onPress={() => openEvent(pick.id)}
            >
              {pick.image_url ? (
                <RemoteImage
                  key={pick.image_url}
                  uri={pick.image_url}
                  size={0}
                  borderRadius={0}
                  style={styles.pickImage}
                />  
              ) : (
                <View style={styles.pickImage} />
              )}
              {pick.sold_out && (
                <View style={styles.soldOutBadgeOverlay}>
                  <Text style={styles.soldOutTextOverlay}>COMPLET</Text>
                </View>
              )}
              <View style={styles.pickBody}>
                <Text style={styles.pickEyebrow}>{getCategoryLabel(pick.category).toUpperCase()}</Text>
                <Text style={styles.pickTitle} numberOfLines={2}>
                  {pick.artist_name ?? pick.name}
                </Text>
                <Text style={styles.pickMeta}>{formatMeta(pick, when)}</Text>
                {pick.friends_count > 0 && (
                  <View style={styles.pickFriends}>
                    <View style={styles.avatarStack}>
                      {pickFriendNames.slice(0, 2).map((name, i) => (
                        <View
                          key={`${name}-${i}`}
                          style={[
                            styles.miniAvatar,
                            { backgroundColor: i === 0 ? colors.accentRamp[600] : colors.accentRamp[700]},
                            i > 0 && { marginLeft: -8 }
                          ]}
                        >
                          <Text style={styles.miniAvatarText}>{name.charAt(0).toUpperCase()}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.pickFriendsText}>
                      {formatFriendsLabel(pickFriendNames, pick.friends_count)}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>

            {/* Les autres soirées */}
            {others.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionLabel, styles.sectionLabelInline]}>{copy.others}</Text>
                  <Pressable
                    hitSlop={8}
                    onPress={() => router.push({ pathname: '/(tabs)/screens/concerts', params: { date: when } })}
                  >
                    <Text style={styles.seeAll}>Tout voir</Text>
                  </Pressable>
                </View>
                <View style={styles.list}>
                  {others.map((event, i) => (
                    <Pressable
                      key={event.id}
                      style={({ pressed }) => [
                        styles.row,
                        i < others.length - 1 && styles.rowDivider,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => openEvent(event.id)}
                    >
                      {event.image_url ? (
                        <RemoteImage uri={event.image_url} size={52} borderRadius={10} />
                      ) : (
                        <View style={styles.rowThumb} />
                      )}
                      <View style={styles.rowContent}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {event.artist_name ?? event.name}
                        </Text>
                        <Text style={styles.rowMeta} numberOfLines={1}>{formatMeta(event, when)}</Text>
                      </View>
                      {event.sold_out && (
                        <View style={styles.soldOutBadge}>
                          <Text style={styles.soldOutText}>COMPLET</Text>
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              </>
            )}


            {/* Les amis qui sortent */}
            {friendsOut > 0 && (
            <Pressable
              style={({ pressed }) => [styles.friendsCard, pressed && styles.pressed]}
              onPress={() => router.push('/(tabs)/screens/amis')}
            >
              <Ionicons name="people" size={20} color={colors.accent} />
              <View style={styles.rowContent}>
                <Text style={styles.friendsTitle}>
                  {friendsOut} ami{friendsOut > 1 ? 's sortent' : ' sort'} {copy.friends}
                </Text>
                <Text style={styles.rowMeta}>Voir où ils vont</Text> 
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 32 },
    pressed: { opacity: 0.7 },
 
    header: {
      height: 88,
      paddingHorizontal: 20,
      paddingTop: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logo: { fontSize: 30, fontWeight: '600', color: colors.text, letterSpacing: -1 },
    iconButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    profileButton: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
    },
    profileIcon: { fontSize: 20, color: colors.accent },
 
    greeting: {
      fontSize: 26, fontWeight: '600', color: colors.text, lineHeight: 32,
      paddingHorizontal: 20, marginTop: 6, marginBottom: 18,
    },
 
    filters: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 8 },
    filter: {
      height: 34, paddingHorizontal: 15, borderRadius: 18,
      borderWidth: 1, borderColor: colors.divider, justifyContent: 'center', alignItems: 'center',
    },
    filterActive: { backgroundColor: colors.text, borderColor: colors.text },
    filterText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
    filterTextActive: { color: colors.bg },
 
    sectionLoading: { paddingVertical: 60, alignItems: 'center' },
    sectionLabel: {
      fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: colors.textMuted,
      paddingHorizontal: 20, marginTop: 24, marginBottom: 10,
    },
    sectionHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingRight: 20, marginTop: 26, marginBottom: 4,
    },
    sectionLabelInline: { marginTop: 0, marginBottom: 0 },
    seeAll: { fontSize: 12, fontWeight: '600', color: colors.accent },
 
    pickCard: {
      marginHorizontal: 20, borderRadius: 20, overflow: 'hidden',
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider,
    },
    pickImage: { width: '100%', height: 200, backgroundColor: colors.divider },
    pickBody: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, gap: 4 },
    pickEyebrow: { fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: colors.accent },
    pickTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5, color: colors.text },
    pickMeta: { fontSize: 13, color: colors.textMuted },
    pickFriends: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    avatarStack: { flexDirection: 'row' },
    miniAvatar: {
      width: 24, height: 24, borderRadius: 12,
      borderWidth: 2, borderColor: colors.surface,
      justifyContent: 'center', alignItems: 'center',
    },
    miniAvatarText: { fontSize: 10, fontWeight: '600', color: colors.accentRamp[100] },
    pickFriendsText: { fontSize: 12, fontWeight: '500', color: colors.accent },
 
    list: { paddingHorizontal: 20 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
    rowThumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: colors.surface },
    rowContent: { flex: 1, gap: 3 },
    rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    rowMeta: { fontSize: 12, color: colors.textMuted },
 
    soldOutBadge: {
      paddingVertical: 3, paddingHorizontal: 8, borderRadius: 100, backgroundColor: colors.text,
    },
    soldOutText: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.bg },
    soldOutBadgeOverlay: {
      position: 'absolute', top: 12, left: 12,
      paddingVertical: 3, paddingHorizontal: 9, borderRadius: 100, backgroundColor: colors.bg,
    },
    soldOutTextOverlay: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.text },
 
    friendsCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      marginHorizontal: 20, marginTop: 22, padding: 14,
      borderRadius: 16, backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.divider,
    },
    friendsTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
 
    empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32, gap: 14 },
    emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
    emptyBtn: {
      borderWidth: 1, borderColor: colors.accent, borderRadius: 10,
      paddingHorizontal: 18, paddingVertical: 10,
    },
    emptyBtnText: { fontSize: 13.5, fontWeight: '600', color: colors.accent },
  });
}