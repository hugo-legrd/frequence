import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';   
import { router } from 'expo-router';
import { useMyEvents } from '../../../hooks/useMyEvents';
import RemoteImage from '../../../components/RemoteImage';

type Filter = 'upcoming' | 'past';

export default function MyConcertsScreen() {
  const { events, loading } = useMyEvents();
  const [filter, setFilter] = useState<Filter>('upcoming');

  const filtered = useMemo(
    () => events.filter(e => (filter === 'upcoming' ? !e.is_past : e.is_past)),
    [events, filter]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>Mes concerts</Text>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, filter === 'upcoming' && styles.tabActive]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[styles.tabText, filter === 'upcoming' && styles.tabTextActive]}>À venir</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, filter === 'past' && styles.tabActive]}
          onPress={() => setFilter('past')}
        >
          <Text style={[styles.tabText, filter === 'past' && styles.tabTextActive]}>Passés</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#a78bfa" style={{ marginTop: 40 }}/>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.event_id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/(tabs)/screens/event/${item.event_id}`)}
            >
              <RemoteImage uri={item.image_url} size={48} borderRadius={8} />
              <View style={{ flex: 1 }}>
                <Text style={styles.artist}>{item.artist_name ?? item.event_name}</Text>
                <Text style={styles.meta}>{item.venue_name}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {filter === 'upcoming' ? 'Aucun concert à venir' : 'Aucun concert passé'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#171717', justifyContent: 'center', alignItems: 'center',
  },
  backArrow: { color: '#e5e5e5', fontSize: 18 },
  title: { fontSize: 20, fontWeight: '600', color: '#e5e5e5' } ,
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8},
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#171717',
  },
  tabActive: { backgroundColor: 'rgba(167,139,250,0.15'},
  tabText: { color: '#555555', fontSize: 13, fontWeight: '500'},
  tabTextActive: { color: '#a78bfa' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12},
  imagePlaceholder: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#1e1e1e' },
  artist: { color: '#e5e5e5', fontSize: 15, fontWeight: '500' },
  meta: { color: '#555555', fontSize: 13, marginTop: 2 },
  empty: { color: '#555555', fontSize: 14, textAlign: 'center', marginTop: 40},
});