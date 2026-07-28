import { View, Text, FlatList, ActivityIndicator, StyleSheet, Image, Pressable } from 'react-native';
import { useEvents } from '../../hooks/useEvents';
import { router } from 'expo-router';
import { useState } from 'react';
import FilterBar, { Filters } from '../../components/FilterBar';

export default function ConcertsScreen() {
  const [filters, setFilters] = useState<Filters>({ date: 'all', genres: []});
  const { events, loading, loadingMore, error, hasMore, loadMore } = useEvents(filters);

  if (loading) {
    return(
      <View style={styles.center}>
        <ActivityIndicator color="#a78bfa" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={item => item.id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View>
            <View style={styles.screenHeader}>
              <Text style={styles.screenTitle}>Concerts</Text>
              <Text style={styles.screenLocation}>Paris · ce mois-ci</Text>
            </View>
            <FilterBar filters={filters} onChange={setFilters} />
          </View>
        }
        stickyHeaderIndices={[0]}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/(tabs)/screens/event/${item.id}`)}
          >
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url}}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder} />
            )}
            <View style={styles.cardContent}>
              <Text style={styles.eventName}>{item.name}</Text>
              {item.artist && (
                <Text style={styles.artist}>{item.artist.name}</Text>
              )}
              <Text style={styles.meta}>
                {item.venue?.name}
                {item.venue?.address ? `· ${item.venue.address}` : ''}
              </Text>
              {item.starts_at && (
                <Text style={styles.date}>
                  {new Date(item.starts_at).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                  })}
                </Text>
              )}
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !loading ? (
          <View style={styles.center}>
            <Text style={styles.empty}>Aucun événement trouvé</Text>
          </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <ActivityIndicator color="#a78bfa" />
            </View>
          ) : null
        } 
        contentContainerStyle={styles.list}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color='#a78bfa' />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  center: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    padding: 40,
    paddingTop: 60,
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingTop: 60,
  },
  card: {
    backgroundColor: '#171717',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 14,
    gap: 4,
  },
  image: {
    width: '100%',
    height: 180,
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#1e1e1e',
  },
  eventName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#e5e5e5',
  },
  artist: {
    fontSize: 14,
    color: '#a78bfa'
  },
  meta: {
    fontSize: 13,
    color: '#555555',
  },
  date: {
    fontSize: 12,
    color: '#3a3a3a',
    marginTop: 2,
  },
  separator: {
    height: 10,
  },
  empty: {
    fontSize: 13,
    color: '#555555',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15,15,15,0.6)',
  },
  screenHeader: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    backgroundColor: '#0f0f0f',
  },
  screenTitle: {
    fontSize: 36,
    fontWeight: '500',
    color: '#e5e5e5',
  },
  screenLocation: {
    fontSize: 14,
    color: '#e5e5e5',
  }
});