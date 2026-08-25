import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useState, useMemo } from 'react';
import { supabase } from '../../../lib/services/supabase';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRandomEvent } from '../../hooks/useRandomEvent';
import { useHomeFriendsPick } from '../../hooks/useHomeFriendsPick';
import { useLatestEvents } from '../../hooks/useLatestEvents';
import RemoteImage from '../../components/RemoteImage';
import { useTheme } from '../../../lib/theme/ThemeContext';

function SectionTitle({ title }: { title: string, color: string}) {
  return (
    <Text style={styles.sectionTitleBase, { color }}>
      {title}
    </Text>
  );
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

const FILTERS = ['Près de moi', 'Ce soir', 'Gratuit'] as const;

export default function HomeScreen() {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['Près de moi']));
  const { event: randomEvent, loading: eventLoading } = useRandomEvent();
  const { pick: friendsPick, loading: friendsLoading } = useHomeFriendsPick();
  const { events: latestsEvents, loading: latestLoading } = useLatestEvents();
  
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
          <Pressable style={styles.profileButton} onPress={() => router.push('/(tabs)/screens/moi')}>
            <Text style={styles.profileIcon}>•</Text>
          </Pressable>
        </View>

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

        {/* Recommended */}
        {eventLoading && (
          <View style={styles.sectionLoading}>
            <ActivityIndicator color="#a78bfa" />
          </View>
        )}

        {!eventLoading && randomEvent && (
          <>
            <SectionTitle title="RECOMMANDÉ POUR TOI" />
            <Pressable
              style={styles.recommendedCard}
              onPress={() => router.push(`/(tabs)/screens/event/${randomEvent.event_id}`)}
            >
              {randomEvent.image_url ? (
                <RemoteImage
                  uri={randomEvent.image_url}
                  size={0}
                  borderRadius={0}
                  style={styles.largeImagePlaceholder}
                />
              ) : (
                <View style={styles.largeImagePlaceholder}>
                  <Text style={styles.placeholderText}>[image artiste]</Text>
                </View>
              )}

              <View style={styles.recommendedContent}>
                <Text style={styles.artistName}>
                  {randomEvent.artist_name ?? randomEvent.event_name}
                </Text>
                <Text style={styles.eventMeta}>
                  {randomEvent.venue_name}
                  {randomEvent.venue_name ? ' · ' : ''}
                  {formatEventDateTime(randomEvent.starts_at)}
                </Text>
              </View>
            </Pressable>
          </>
        )}

        {/* Friends */}
        {!friendsLoading && friendsPick && (
          <>
            <SectionTitle title="AMIS INTÉRESSÉS" />
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
            <SectionTitle title="NOUVEAUTÉS" />
            <View style={styles.newEvents}>
              {latestsEvents.map(item => (
                <Pressable
                  key={item.id}
                  style={styles.smallCard}
                  onPress={() => router.push(`/(tabs)/screens/event/${item.id}`)}
                >
                  {item.image_url ? (
                    <RemoteImage
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    height: 88,
    paddingHorizontal: 20,
    paddingTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: 30,
    fontWeight: '600',
    color: '#e5e5e5',
    letterSpacing: -1,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
    color: '#a78bfa',
    marginTop: -8,
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
    borderColor: '#444444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterActive: {
    backgroundColor: '#e5e5e5',
    borderColor: '#e5e5e5',
  },
  filterText: {
    fontSize: 13,
    color: '#b5b5b5',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#0f0f0f',
  },
  divider: {
    height: 1,
    backgroundColor: '#242424',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#777777',
    letterSpacing: 0.3,
    marginTop: 20,
    marginBottom: 9,
    paddingHorizontal: 20,
  },
  sectionLoading: { paddingVertical: 30, alignItems: 'center' },
  recommendedCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#444444',
    overflow: 'hidden',
    backgroundColor: '#171717',
  },
  largeImagePlaceholder: {
    height: 145,
    width: '100%',
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#555555',
  },
  recommendedContent: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  artistName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e5e5',
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 14,
    color: '#777777',
  },
  friendCard: {
    marginHorizontal: 20,
    height: 78,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#444444',
    backgroundColor: '#171717',
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
    borderColor: '#171717',
    backgroundColor: '#444444',
  },
  avatarOne: {
    left: 0,
  },
  avatarTwo: {
    left: 22,
    backgroundColor: '#555555',
  },
  avatarInitial: { fontSize: 13, fontWeight: '600', color: '#e5e5e5' },
  friendInfo: {
    marginLeft: 8,
    flex: 1,
  },
  friendArtist: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e5e5',
    marginBottom: 3,
  },
  friendMeta: {
    fontSize: 12,
    color: '#777777',
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
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 16,
    width: '100%', 
    height: '100%'
  }
})