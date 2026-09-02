import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/services/supabase';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRandomEvent } from '../../hooks/events/useRandomEvent';
import { useHomeFriendsPick } from '../../hooks/social/useHomeFriendsPick';
import { useLatestEvents } from '../../hooks/events/useLatestEvents';
import RemoteImage from '../../components/RemoteImage';
import { useTheme } from '../../../lib/theme/ThemeContext';
import type { ThemeColors } from '../../../lib/theme/tokens';
import { useMyProfile } from '../../hooks/profile/useMyProfile';


const SEARCH_ROUTE = '/(tabs)/screens/amis/search';

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

const FILTERS = ['Près de moi', 'Ce soir', 'Gratuit'] as const;

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

  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['Près de moi']));
  const { event: randomEvent, loading: eventLoading } = useRandomEvent();
  const { pick: friendsPick, loading: friendsLoading } = useHomeFriendsPick();
  const { events: latestsEvents, loading: latestLoading } = useLatestEvents();
  const { profile } = useMyProfile();
  const userInitial = profile?.display_name?.charAt(0).toUpperCase() ?? '';
  
  function toggleFilter(filter: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    })
  }

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
          {FILTERS.map(filter => {
            const active = activeFilters.has(filter);
            return (
              <Pressable
                key={filter}
                style={[styles.filter, active && styles.filterActive]}
                onPress={() => toggleFilter(filter)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* Recommended - hero treatment */}
        {eventLoading && (
          <View style={styles.sectionLoading}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}

        {!eventLoading && randomEvent && (
          <Pressable
            style={styles.heroCard}
            onPress={() => router.push(`/(tabs)/screens/event/${randomEvent.event_id}`)}
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
              onPress={() => router.push(`/(tabs)/screens/event/${friendsPick.event_id}`)}
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
                  onPress={() => router.push(`/(tabs)/screens/event/${item.id}`)}
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
      marginBottom: 8,
      borderRadius: 22,
      overflow: 'hidden',
      aspectRatio: 4 / 5,
      backgroundColor: colors.surface,
    },
    heroImage: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeHolderText: {
      fontSize: 14,
      fontStyle: 'italic',
      color: colors.textMuted,
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
    }
  })
} 