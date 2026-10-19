import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';

import { useState, useMemo } from 'react';

import { Ionicons } from '@expo/vector-icons';

import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useRandomEvent } from '../../../lib/hooks/events/useRandomEvent';
import { useHomeFriendsPick } from '../../../lib/hooks/social/useHomeFriendsPick';
import { useLatestEvents } from '../../../lib/hooks/events/useLatestEvents';
import { useEvents } from '../../../lib/hooks/events/useEvents';

import RemoteImage from '../../../lib/components/RemoteImage';

import { useTheme } from '../../../lib/theme/ThemeContext';
import type { ThemeColors } from '../../../lib/theme/tokens';

import { useMyProfile } from '../../../lib/hooks/profile/useMyProfile';


const SEARCH_ROUTE = '/search';

function SectionTitle({ title, color }: { title: string, color: string}) {
  return (
    <Text style={[styles_sectionTitleBase, { color }]}>
      {title}
    </Text>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Bonne nuit.';
  if (hour < 18) return 'Bonjour.';
  return 'Bonsoir.'
}

function formatFriendsLabel(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  const extra = names.length - 1;
  return `${names[0]} + ${extra} ami${extra > 1 ? 's' : ''}`;
}

function formatEventDateTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', ' ·');
}

const MAX_HERO_GENRES = 2;

function formatHeroMeta(venueName: string | null, startsAt: string | null, genreNames: string[] | null): string {
  const parts = [venueName, formatEventDateTime(startsAt)].filter(Boolean);
  if (genreNames && genreNames.length > 0){
    parts.push(genreNames.slice(0, MAX_HERO_GENRES).join(', '));
  }
  return parts.join(' · ');
}

const WHEN_FILTERS = [
  { key: 'today', label: 'Ce soir', title: 'CE SOIR', empty: "Rien de prévu ce soir pour l'instant." },
  { key: 'weekend', label: 'Ce week-end', title: 'CE WEEK-END', empty: "Rien de prévu ce week-end pour l'instant." },
] as const;

type WhenKey = typeof WHEN_FILTERS[number]['key'];

function formatWhenMeta(startsAt: string | null, venueName: string | undefined, when: WhenKey): string {
  if (!startsAt) return venueName ?? '';
  const d = new Date(startsAt);
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const day = d.toLocaleDateString('fr-FR', { weekday: 'short' });
  const label = when === 'weekend' ? `${day.charAt(0).toUpperCase()}${day.slice(1)} ${time}` : time;
  return venueName ? `${label} · ${venueName}` : label;
}

const styles_sectionTitleBase = {
  fontSize: 12,
  fontWeight: '600' as const,
  letterSpacing: 0.3,
  marginTop: 20,
  marginBottom: 9,
  paddingHorizontal: 20,
};

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [when, setWhen] = useState<WhenKey>('today');
  const { events: whenEvents, loading: whenLoading } = useEvents({ date: when, genres: [] });
  const activeWhen = WHEN_FILTERS.find(f => f.key === when)!;
  const { event: randomEvent, loading: eventLoading } = useRandomEvent();
  const { pick: friendsPick, loading: friendsLoading } = useHomeFriendsPick();
  const { events: latestsEvents, loading: latestLoading } = useLatestEvents();
  const { profile } = useMyProfile();
  const userInitial = profile?.display_name?.charAt(0).toUpperCase() ?? '';
  
  const { width: screenWidth } = useWindowDimensions();
  const heroWidth = screenWidth - 40;


  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>fréquence.</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.iconButton}
              onPress={() => router.push(SEARCH_ROUTE as never)}
              hitSlop={8}
            >
              <Ionicons name="search" size={18} color={colors.text} />
            </Pressable>
            <Pressable style={styles.profileButton} onPress={() => router.push('/(tabs)/screens/moi')}>
              <Text style={styles.profileIcon}>{userInitial}</Text>
            </Pressable>
          </View>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>{getGreeting()}{'\n'}Voici votre nuit.</Text>

        {/* Filters */}
        <View style={styles.filters}>
          {WHEN_FILTERS.map(f => {
            const active = when === f.key;
            return (
              <Pressable
                key={f.key}
                style={[styles.filter, active && styles.filterActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setWhen(f.key)
                }}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* Ce soir / Ce week end */}
        <View style={styles.whenHeader}>
          <SectionTitle title={activeWhen.title} color={colors.textMuted} />
          <Pressable
            hitSlop={8}
            onPress={() => router.push({ pathname: '/(tabs)/screens/concerts', params: { date: when } })}
          >
            <Text style={styles.seeAll}>Tout voir</Text>
          </Pressable>
        </View>

        {whenLoading ? (
          <View style={styles.sectionLoading}>
            <ActivityIndicator color={colors.accent}/>
          </View>
          ) : whenEvents.length === 0 ? (
            <Text style={styles.whenEmpty}>{activeWhen.empty}</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.whenList}>
              {whenEvents.map(item => (
                <Pressable
                  key={item.id}
                  style={styles.whenCard}
                  onPress={() => router.push(`/event/${item.id}`)}
                >
                  {item.image_url ? (
                    <RemoteImage key={item.image_url} uri={item.image_url} size={0} borderRadius={14} style={styles.whenImage} />
                  ) : (
                    <View style={styles.whenImage} />
                  )}
                  {item.sold_out && (
                    <View style={styles.soldOutBadge}>
                      <Text style={styles.soldOutText}>COMPLET</Text>
                    </View>
                  )}
                  <Text style={styles.whenName} numberOfLines={1}>{item.artist?.name ?? item.name}</Text>
                  <Text style={styles.whenMeta} numberOfLines={1}>
                    {formatWhenMeta(item.starts_at, item.venue?.name, when)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

        {/* Recommended - hero treatment */}
        {eventLoading && (
          <View style={styles.sectionLoading}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}

        {!eventLoading && randomEvent && (
          <Pressable
            style={[styles.heroCard, { width: heroWidth, height: heroWidth * 5 / 4}]}
            onPress={() => router.push(`/event/${randomEvent.event_id}`)}
          >
            {randomEvent.image_url ? (
              <RemoteImage
                key={randomEvent.image_url}
                uri={randomEvent.image_url}
                size={0}
                borderRadius={0}
                style={styles.heroImage}
              />
            ) : (
              <View style={styles.heroImage}>
                <Text style={styles.placeholderText}>[image artiste]</Text>
              </View>
            )}

            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {randomEvent.artist_name ?? randomEvent.event_name}
              </Text>
              <Text style={styles.heroMeta}>
                {formatHeroMeta(randomEvent.venue_name, randomEvent.starts_at, randomEvent.genre_names)}
              </Text>
            </View>
          </Pressable>
        )}

        {/* Friends */}
        {!friendsLoading && friendsPick && (
          <>
            <SectionTitle title="AMIS INTÉRESSÉS" color={colors.textMuted} />
            <Pressable
              style={styles.friendCard}
              onPress={() => router.push(`/event/${friendsPick.event_id}`)}
            >
              <View style={styles.avatarGroup}>
                <View style={[styles.avatar, styles.avatarOne]}>
                  <Text style={styles.avatarInitial}>
                    {friendsPick.friend_names[0]?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                {friendsPick.friend_names[1] && (
                  <View style={[styles.avatar, styles.avatarTwo]}>
                    <Text style={styles.avatarInitial}>
                      {friendsPick.friend_names[1].charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.friendInfo}>
                <Text style={styles.friendArtist}>
                  {friendsPick.artist_name ?? friendsPick.event_name}
                </Text>
                <Text style={styles.friendMeta}>
                  {formatFriendsLabel(friendsPick.friend_names)}
                  {friendsPick.venue_name ? ` · ${friendsPick.venue_name}` : ''}
                </Text>
              </View>
            </Pressable>
          </>
        )}

        {/* New releases */}
        {!latestLoading && latestsEvents.length > 0 && (
          <>
            <SectionTitle title="NOUVEAUTÉS" color={colors.textMuted} />
            <View style={styles.newEvents}>
              {latestsEvents.map(item => (
                <Pressable
                  key={item.id}
                  style={styles.smallCard}
                  onPress={() => router.push(`/event/${item.id}`)}
                >
                  {item.image_url ? (
                    <RemoteImage
                      key={item.image_url}
                      uri={item.image_url}
                      size={0}
                      borderRadius={16}
                      style={styles.smallImagePlaceholder}
                    />
                  ) : (
                    <View style={styles.smallImagePlaceholder} />
                  )}
                </Pressable>
              ))}
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingBottom: 24,
    },
    header: {
      height: 88,
      paddingHorizontal: 20,
      paddingTop: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    logo: {
      fontSize: 30,
      fontWeight: '600',
      color: colors.text,
      letterSpacing: -1,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileIcon: {
      fontSize: 20,
      color: colors.accent,
      marginTop: 0,
    },
    greeting: {
      fontSize: 26,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 32,
      paddingHorizontal: 20,
      marginTop: 6,
      marginBottom: 18,
    },
    filters: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 10,
      marginBottom: 16,
    },
    filter: {
      height: 34,
      paddingHorizontal: 15,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.divider,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    filterText: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '500',
    },
    filterTextActive: {
      color: colors.bg,
    },
    heroCard: {
      marginHorizontal: 20,
      marginTop: 24,
      marginBottom: 8,
      borderRadius: 22,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    heroImage: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 18,
      paddingTop: 40,
      paddingBottom: 18,
      backgroundColor: `${colors.bg}E6`,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    heroMeta: {
      fontSize: 13,
      color: colors.textMuted,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginBottom: 4,
    },
    sectionLoading: { paddingVertical: 30, alignItems: 'center' },
    placeholderText: {
      fontSize: 14,
      fontStyle: 'italic',
      color: colors.textMuted,
    },
    friendCard: {
      marginHorizontal: 20,
      height: 78,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
    },
    avatarGroup: {
      width: 60,
      height: 48,
      position: 'relative',
      justifyContent: 'center',
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      position: 'absolute',
      borderWidth: 2,
      borderColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarOne: {
      left: 0,
      backgroundColor: colors.accentRamp[600],
    },
    avatarTwo: {
      left: 22,
      backgroundColor: colors.accentRamp[700],
    },
    avatarInitial: { fontSize: 13, fontWeight: '600', color: colors.accentRamp[100] },
    friendInfo: {
      marginLeft: 8,
      flex: 1,
    },
    friendArtist: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 3,
    },
    friendMeta: {
      fontSize: 12,
      color: colors.textMuted,
    },
    newEvents: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
    },
    smallCard: {
      flex: 1,
      height: 130,
      borderRadius: 16,
      overflow: 'hidden',
    },
    smallImagePlaceholder: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 16,
      width: '100%', 
      height: '100%'
    },
    whenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    seeAll: { fontSize: 12, fontWeight: '600', color: colors.accent, paddingHorizontal: 20, marginTop: 20, marginBottom: 9 },
    whenList: { paddingHorizontal: 20, gap: 10 },
    whenCard: { width: 120 },
    whenImage: { width: 120, height: 120, borderRadius: 12, backgroundColor: colors.surface, marginBottom: 6 },
    whenName: { fontSize: 13, fontWeight: '600', color: colors.text} ,
    whenMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    whenEmpty: { fontSize: 13, color: colors.textMuted, paddingHorizontal: 20 },
    soldOutBadge: { position: 'absolute', top: 8, left: 8, paddingVertical: 3, paddingHorizontal: 9, borderRadius: 100, backgroundColor: colors.bg },
    soldOutText: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.text },
  })
} 