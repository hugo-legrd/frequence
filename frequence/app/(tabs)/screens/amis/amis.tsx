import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, SectionList, ActivityIndicator, Pressable, RefreshControl, Image } from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import { useFriendsActivity } from '../../../../lib/hooks/social/useFriendsActivity';

import type { FriendActivityRow } from '../../../../lib/types/activity';
import { useUnreadActivity } from '../../../../lib/context/UnreadActivityContext';
import { useTheme } from '../../../../lib/theme/ThemeContext';
import type { ThemeColors } from '../../../../lib/theme/tokens';

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} jour${days > 1 ? 's' : ''}`;
}

function getDayLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "AUJOURD'HUI";
  if (isSameDay(date, yesterday)) return "HIER";

  return date
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    .toUpperCase();
}

function groupByDay(rows: FriendActivityRow[]) {
  const groups: { title: string; data: FriendActivityRow[] }[] = [];
  for (const row of rows) {
    const title = getDayLabel(row.activity_at);
    const existing = groups.find(g => g.title === title);
    if (existing) existing.data.push(row);
    else groups.push({ title, data: [row ]});
  }

  return groups;
}

function activityKey(item: FriendActivityRow): string {
  return `${item.kind}-${item.actor_id}-${item.event_id ?? item.target_user_id}`;
}

function goToProfile(userId: string | null) {
  if (userId) router.push(`/(tabs)/screens/amis/${userId}`); 
}

function goToEvent(eventId: string | null) {
  if (eventId) router.push(`/(tabs)/screens/event/${eventId}`);
}

function ActivityRow({ item, currentUserId }: { item: FriendActivityRow; currentUserId: string | null }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const name = item.actor_name ?? 'Quelqu\'un'
  const initial = name.charAt(0).toUpperCase();
  const isFollow = item.kind === 'follow';

  let verb : string;
  let target : string | null;
  let onTargetPress: () => void;

  if (isFollow) {
    const followsMe = item.target_user_id === currentUserId;
    verb = followsMe ? 'vous suit' : 'suit';
    target = followsMe ? null : (item.target_name ?? item.target_handle);
    onTargetPress = () => goToProfile(item.target_user_id);
  } else {
    verb = item.status === 'going' ? 'va à' : "s'intéresse à";
    target = item.artist_name ?? item.event_name;
    onTargetPress = () => goToEvent(item.event_id);
  }

  const onRowPress = isFollow && !target ? () => goToProfile(item.actor_id) : onTargetPress;

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onRowPress}>
      <Pressable onPress={() => goToProfile(item.actor_id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        {item.actor_avatar_url ? (
          <Image source={{ uri: item.actor_avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
      </Pressable> 
      <View style={styles.rowContent}>
        <Text style={styles.title}>
          <Text style={styles.bold} onPress={() => goToProfile(item.actor_id)}>{name}</Text> {verb}
          {target ? (
            <>
              {' '}
              <Text style={styles.bold} onPress={onTargetPress}>{target}</Text>
            </>
          ) : null}
        </Text>
        <Text style={styles.subtitle}>
          {!isFollow && item.venue_name ? `${item.venue_name} · ` : ''}
          {timeAgo(item.activity_at)}
        </Text>
      </View> 
    </Pressable>
  );
}

export default function FriendsScreen() {
  const  { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { activity, loading, loadingMore, hasMore, error, 
    currentUserId, followingCount, refetch, loadMore 
  } = useFriendsActivity();
  const [refreshing, setRefreshing] = useState(false);
  const sections = useMemo(() => groupByDay(activity), [activity]);
  const { markAsSeen } = useUnreadActivity();

  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      markAsSeen();
      if (firstFocus.current) {
        firstFocus.current = false;
      } else {
        refetch();
      }
    }, [markAsSeen, refetch])
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        new Promise<void>(resolve => setTimeout(resolve, 600)), // délai artificiel minimum
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  const header = (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerTitle}>Activité</Text>
          <Text style={styles.headerSubtitle}>Ce que font vos abonnements</Text>
        </View>
        <Pressable
          style={styles.searchBtn}
          onPress={() => router.push('/(tabs)/screens/amis/search')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.searchIcon}>⌕</Text>
        </Pressable>
      </View>
    </View>
  )

  function renderEmpty() {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{error}</Text>
          <Pressable style={styles.emptyBtn} onPress={refetch}>
            <Text style={styles.emptyBtnText}>Réessayer</Text>
          </Pressable>
        </View>
      );
    }

    if (followingCount === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Vous ne suivez encore personne</Text>
          <Text style={styles.emptyText}>
            Suivez des amis pour voir les concerts qui les intéressent.
          </Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.push('/(tabs)/screens/amis/search')}>
            <Text style={styles.emptyBtnText}>Trouver des amis</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Rien de neuf pour l'instant</Text>
        <Text style={styles.emptyText}>
          L'activité de vos abonnements apparaîtra ici.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={activityKey}
        renderItem={({ item }) => <ActivityRow item={item} currentUserId={currentUserId} />}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionLabel}>{section.title}</Text>
        )}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : null
        }
        onEndReached={() => { if (hasMore) loadMore(); }}
        onEndReachedThreshold={0.5}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false} 
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent} 
          />
        }
      /> 
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.bg
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '500',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(167,139,250,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)'
  },
  searchIcon: {
    fontSize: 30,
    color: colors.accent,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: colors.bg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  rowPressed: {
    opacity: 0.6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
  rowContent: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 6,
  },
  scrollContent: {
    paddingTop: 60,
    flexGrow: 1,
  },
  centered: {
    paddingHorizontal: 32, 
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.bg
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  customRefreshIndicator: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
})
};