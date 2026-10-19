import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useMemo, useState } from 'react';

import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import RemoteImage from './RemoteImage';

import { useFollowList } from '../hooks/social/useFollowList';
import { useFollow, initialFollowState, FOLLOW_LABELS, type FollowState } from '../hooks/social/useFollow';

import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/tokens';

type Props = {
  title: string;
  kind: 'followers' | 'following';
  userId?: string;
  emptyText: string;
  backHref?: string;
};

export default function FollowListScreen({ title, kind, userId, emptyText, backHref }: Readonly<Props>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { users, loading } = useFollowList(userId, kind);
  
  const { toggle: toggleFollow } = useFollow();
  const [localState, setLocalState] = useState<Record<string, FollowState>>({});

  type ListUser = (typeof users)[number];

  function followState(user: ListUser): FollowState {
    return localState[user.id] ?? initialFollowState(user);
  }

  async function runToggle(user: ListUser, current: FollowState) {
    const isPrivate = user.profile_visibility === 'followers';
    // Prédiction : abonné/demandé -> rien; rien -> demandé si privé, abonné sinon
    const optimistic: FollowState = current !== 'none' ? 'none' : isPrivate ? 'requested' : 'following';
    setLocalState(prev => ({ ...prev, [user.id]: optimistic }));

    const result = await toggleFollow(user.id, current);
    // Le serveur a le dernier mot; rollback si l'action a échoué
    setLocalState(prev => ({ ...prev, [user.id]: result ?? current }));
  }

  function toggle(user: ListUser) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = followState(user);

    // Se désabonner d'un compte privé oblige à refaire une demande: on confirme
    if (current === 'following' && user.profile_visibility === 'followers') {
      Alert.alert(
        `Ne plus suivre ${user.display_name ?? 'cet utilisateur'} ?`,
        'Ce compte est privé: il faudra refaire une demande pour voir ses concerts.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Ne plus suivre', style: 'destructive', onPress: () => runToggle(user, current) },
        ],
      );
      return;
    }

    runToggle(user, current);
  } 

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => (backHref ? router.dismissTo(backHref as any) : router.back())} 
          style={styles.backBtn} 
          hitSlop={8}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const state = followState(item);
            const active = state !== 'none';
            return (
              <View style={styles.row}>
                <Pressable
                  style={styles.rowMain}
                  onPress={() => router.push({
                    pathname: '/user/[userId]',
                    params: { userId: item.id, from: backHref ?? '' },
                  })}
                > 
                  {item.avatar_url ? (
                    <RemoteImage uri={item.avatar_url} size={42} borderRadius={21} />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarLetter}>
                        {(item.display_name ?? '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.display_name ?? 'Utilisateur'}</Text>
                    {item.handle && <Text style={styles.handle}>@{item.handle}</Text>}
                  </View>
                </Pressable>
                <Pressable
                  style={[styles.btn, active && styles.btnActive]}
                  onPress={() => toggle(item)}
                >
                  <Text style={[styles.btnText, active && styles.btnTextActive]}>
                    {FOLLOW_LABELS[state]}
                  </Text>
                </Pressable>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
        />
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    backArrow: { color: colors.text, fontSize: 18 },
    title: { fontSize: 20, fontWeight: '600', color: colors.text },
    list: { paddingHorizontal: 16 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    rowMain: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accentSoftBg, alignItems: 'center', justifyContent: 'center' },
    avatarLetter: { fontSize: 17, fontWeight: '600', color: colors.accent },
    name: { color: colors.text, fontSize: 15 },
    handle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
    btn: { borderWidth: 1, borderColor: colors.accent, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    btnActive: { backgroundColor: colors.accent },
    btnText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
    btnTextActive: { color: colors.bg },
    empty: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 50 },
  });
}
