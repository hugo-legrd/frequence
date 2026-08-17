import { useState, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useUserSearch, UserSearchResult } from '../../../hooks/useUserSearch';
import { useFollow } from '../../../hooks/useFollow';
import { useSearchHistory } from '../../../hooks/useSearchHistory';
import * as Haptics from 'expo-haptics';

export default function SearchFriendsScreen() {
  const [query, setQuery] = useState('');
  const { results, loading } = useUserSearch(query);
  const { follow, unfollow } = useFollow();
  const { history, addToHistory, clearHistory } = useSearchHistory();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  // État local optimiste — évite d'attendre le round-trip Supabase pour mettre à jour le bouton
  const [localFollowState, setLocalFollowState] = useState<Record<string, boolean>>({});

  function isFollowing(user: UserSearchResult) {
    return localFollowState[user.id] ?? user.is_following;
  }

  function handleUserPress(user: UserSearchResult) {
    addToHistory(query.trim());
    router.push(`/(tabs)/screens/amis/${user.id}`);
  }

  async function toggleFollow(user: UserSearchResult) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentlyFollowing = isFollowing(user);
    setPendingIds(prev => new Set(prev).add(user.id));
    setLocalFollowState(prev => ({ ...prev, [user.id]: !currentlyFollowing}));

    const success = currentlyFollowing
      ? await unfollow(user.id)
      : await follow(user.id);
    
      if (!success) {
        // rollback si l'action a échoué
        setLocalFollowState(prev => ({ ...prev, [user.id]: currentlyFollowing}));
      }

      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      })
  }

  function UserRowSkeleton() {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }, []);

    return (
      <Animated.View style={[styles.skeletonRow, { opacity }]}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonNameLine} />
      </Animated.View>
    )
  }

  return (
    <View style={styles.container}>
      <TextInput 
        style={styles.input}
        placeholder="Rechercher un ami..."
        placeholderTextColor="#555"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />

      {query.trim().length === 0 && history.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyLabel}>Recherches récentes</Text>
            <Pressable onPress={clearHistory}>
              <Text style={styles.historyClear}>Effacer</Text>
            </Pressable>
          </View>
          {history.map(term => (
            <Pressable key={term} style={styles.historyItem} onPress={() => setQuery(term)}>
              <Text style={styles.historyIcon}>↺</Text>
              <Text style={styles.historyText}>{term}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {loading 
        ? Array.from({ length: 5}).map((_, i) => <UserRowSkeleton key={i} />)
        : (
          <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const following = isFollowing(item);
          return (
            <View style={styles.row}>
              <Pressable style={{ flex: 1}} onPress={() => handleUserPress(item)}>
                <Text style={styles.name}>{item.display_name ?? 'Utilisateur'}</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, following && styles.btnActive]}
                onPress={() => toggleFollow(item)}
                disabled={pendingIds.has(item.id)}  
              >
                <Text style={[styles.btnText, following && styles.btnTextActive]}>
                  {following ? 'Suivi': 'Suivre'}
                </Text>
              </Pressable>
            </View>
          )
        }}
        ListEmptyComponent={
          !loading && query.trim().length >= 2 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aucun Utilisateur trouvé</Text>
              <Text style={styles.emptySub}>pour "{query}"</Text>
            </View>
          ) : null
        }
      />
        )  
      }
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', padding: 16, paddingTop: 60},
  input: {
    backgroundColor: '#171717',
    borderRadius: 10,
    padding: 12,
    color: '#e5e5e5',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  name: { color: '#e5e5e5', fontSize: 15 },
  btn: {
    borderWidth: 1,
    borderColor: '#a78bfa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnActive: { backgroundColor: '#a78bfa' },
  btnText: { color: '#a78bfa', fontSize: 13, fontWeight: '600'},
  btnTextActive: { color: '#0f0f0f' },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    color: '#e5e5e5',
    fontSize: 15,
    fontWeight: '500',
  },
  emptySub: {
    color: '#555555',
    fontSize: 13,
    marginTop: 4,
  },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12},
  skeletonAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1e1e1e' },
  skeletonNameLine: { height: 14, width: '40%', borderRadius: 4, backgroundColor: '#1e1e1e'},
  historySection: { marginBottom: 16 },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyLabel: { color: '#555555', fontSize: 12, fontWeight: '600' },
  historyClear: { color: '#a78bfa', fontSize: 12},
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8},
  historyIcon: { color: '#555555', fontSize: 14 },
  historyText: { color: '#e5e5e5', fontSize: 14 },
})