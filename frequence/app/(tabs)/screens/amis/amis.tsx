import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { useFriendsActivity } from '../../../hooks/useFriendsActivity';
import type { FriendActivityRow } from '../../../../lib/types/activity';
import { useUnreadActivity } from '../../context/UnreadActivityContext';

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
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
  const groups: { label: string; items: FriendActivityRow[] }[] = [];
  for (const row of rows) {
    const label = getDayLabel(row.created_at);
    const existing = groups.find(g => g.label === label);
    if (existing) existing.items.push(row);
    else groups.push({ label, items: [row ]});
  }

  return groups;
}

function ActivityRow({ item }: { item: FriendActivityRow }) {
  const name = item.actor_display_name ?? 'Quelqu\'un'
  const initial = name.charAt(0).toUpperCase();
  const verb = item.status === 'interested' ? 'est interéssé par' : 'va à';
  const target = item.artist_name ?? item.event_name;

  function goToProfile() {
    router.push(`/(tabs)/screens/amis/${item.actor_id}`);
  }

  return (
    <View style={styles.row}>
      <Pressable onPress={goToProfile} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </Pressable>
      <View style={styles.rowContent}>
        <Text style={styles.title}>
          <Text style={styles.bold} onPress={goToProfile}>{name}</Text> {verb}{' '}
          <Text style={styles.bold}>{target}</Text>
        </Text>
        <Text style={styles.subtitle}>
          {item.venue_name}
          {item.venue_name ? ' · ' : ''}
          {timeAgo(item.created_at)}
        </Text>
      </View>
    </View>
  )
}

export default function FriendsScreen() {
  const { activity, loading, refetch } = useFriendsActivity();
  const [refreshing, setRefreshing] = useState(false);
  const groups = useMemo(() => groupByDay(activity), [activity]);
  const { markAsSeen } = useUnreadActivity();

  useEffect(() => {
    markAsSeen();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        new Promise(resolve => setTimeout(resolve, 600)), // délai artificiel minimum
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View style={styles.container}>
      {refreshing && (
        <View style={styles.customRefreshIndicator}>
          <ActivityIndicator color="#a78bfa" size="small" />
        </View> 
      )}
      <ScrollView 
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false} 
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#a78bfa"
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Activité</Text>
              <Text style={styles.headerSubtitle}>Paris · ce mois-ci</Text>
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

        {loading && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color='#a78bfa' />
          </View>
        )}

        {groups.map(group => (
          <View key={group.label}>
            <Text style={styles.sectionLabel}>{group.label}</Text>
            {group.items.map((item, i) => (
              <ActivityRow key={`${item.actor_id}-${item.event_id}-${i}`} item={item} />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#0f0f0f'
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '500',
    color: '#e5e5e5',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#555555',
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
    color: '#a78bfa'
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555555',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#a78bfa',
  },
  rowContent: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    color: '#e5e5e5',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: '#555555',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#a78bfa',
    marginTop: 6,
  },
  scrollContent: {
    paddingTop: 60,
    flexGrow: 1,
  },
  customRefreshIndicator: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
});