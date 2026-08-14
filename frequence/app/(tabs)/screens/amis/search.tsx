import { useState } from 'react';
import { router } from 'expo-router';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useUserSearch, UserSearchResult } from '../../../hooks/useUserSearch';
import { useFollow } from '../../../hooks/useFollow';

export default function SearchFriendsScreen() {
  const [query, setQuery] = useState('');
  const { results, loading } = useUserSearch(query);
  const { follow, unfollow } = useFollow();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  // État local optimiste — évite d'attendre le round-trip Supabase pour mettre à jour le bouton
  const [localFollowState, setLocalFollowState] = useState<Record<string, boolean>>({});

  function isFollowing(user: UserSearchResult) {
    return localFollowState[user.id] ?? user.is_following;
  }

  async function toggleFollow(user: UserSearchResult) {
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

      {loading && <ActivityIndicator color="#a78bfa" style={{ marginTop: 20 }} />}

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const following = isFollowing(item);
          return (
            <View style={styles.row}>
              <Pressable onPress={() => router.push(`/(tabs)/screens/amis/${item.id}`)}>
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
})