import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useEvents } from '../../hooks/useEvents';

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
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={({ item}) => (
          <View style={styles.card}>
            <Text style={styles.eventName}>{item.name}</Text>
            <Text style={styles.eventMeta}>
              {item.artist && `${item.artist} · `}
              {item.venue?.name} · {item.venue?.city}
            </Text>
            {item.starts_at && (
              <Text style={styles.eventDate}>
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
    padding: 16,
    gap: 6,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e5e5e5',
  },
  eventMeta: {
    fontSize: 12,
    color: '#555555',
  },
  eventDate: {
    fontSize: 11,
    color: '#a78bfa',
  },
  separator: {
    height: 10,
  },
  error: {
    fontSize: 13,
    color: '#555555',
  },
  empty: {
    fontSize: 13,
    color: '#555555',
  },
});