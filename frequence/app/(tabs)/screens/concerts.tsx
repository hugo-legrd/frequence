import { View, Text, FlatList, ActivityIndicator, StyleSheet, Image, Pressable } from 'react-native';
import { useEvents } from '../../hooks/useEvents';
import { router } from 'expo-router';

export default function ConcertsScreen() {
  const { events, loading, error } = useEvents();

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
        renderItem={({ item}) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/(tabs)/screens/event/${item.id}`)}
          >
            {item.image_url && (
              <Image
                source={{ uri: item.image_url}}
                style={styles.image}
                resizeMode="cover"
              />
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
          <View style={styles.center}>
            <Text style={styles.empty}>Aucun événement trouvé</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
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
  eventName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e5e5e5',
  },
  artist: {
    fontSize: 13,
    color: '#a78bfa'
  },
  meta: {
    fontSize: 12,
    color: '#555555',
  },
  date: {
    fontSize: 11,
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
});