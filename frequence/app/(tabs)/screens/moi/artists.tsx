import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useMyArtists } from '../../../hooks/useMyArtists';
import RemoteImage from '../../../components/RemoteImage';

export default function MyArtistsScreen() {
  const { artists, loading } = useMyArtists();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>Mes artistes</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#a78bfa" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={artists}
          keyExtractor={item => item.artist_id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <RemoteImage uri={item.image_url} size={48} borderRadius={24} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.artist_name}</Text>
                <Text style={styles.meta}>
                  {item.events_count} évenement{item.events_count > 1 ? 's' : ''}
                </Text> 
              </View>  
            </View>
          )}  
          ListEmptyComponent={<Text style={styles.empty}>Aucun artiste suivi pour l'instant</Text>}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#171717', justifyContent: 'center', alignItems: 'center',
  },
  backArrow: { color: '#e5e5e5', fontSize: 18 },
  title: { fontSize: 20, fontWeight: '600', color: '#e5e5e5' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12},
  imagePlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1e1e1e'},
  name: { color: '#e5e5e5', fontSize: 15, fontWeight: '500' },
  meta: { color: '#555555', fontSize: 13, marginTop: 2 },
  empty: { color: '#555555', fontSize: 14, textAlign: 'center', marginTop: 40},
});