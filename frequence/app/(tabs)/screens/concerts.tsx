import { View, Text, FlatList, ActivityIndicator, StyleSheet, Image, Pressable } from 'react-native';
import { useEvents } from '../../hooks/useEvents';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import FilterBar, { Filters } from '../../components/FilterBar';
import { useTheme } from '../../../lib/theme/ThemeContext';
import type { ThemeColors } from '../../../lib/theme/tokens';

export default function ConcertsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [filters, setFilters] = useState<Filters>({ date: 'all', genres: []});
  const { events, loading, loadingMore, error, hasMore, loadMore } = useEvents(filters);

  if (loading) {
    return(
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
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
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : null
        } 
        contentContainerStyle={styles.list}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.divider,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  artist: {
    fontSize: 14,
    color: colors.accent
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
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
    color: colors.textMuted,
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
    backgroundColor: colors.bg,
  },
  screenTitle: {
    fontSize: 36,
    fontWeight: '500',
    color: colors.text,
  },
  screenLocation: {
    fontSize: 14,
    color: colors.text,
  }
})
};