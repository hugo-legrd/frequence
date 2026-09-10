import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import RemoteImage from './RemoteImage';
import { useFollowList } from '../hooks/social/useFollowList';
import { useFollow } from '../hooks/social/useFollow';
import { useTheme } from '../../lib/theme/ThemeContext';
import type { ThemeColors } from '../../lib/theme/tokens';

type Props = {
  title: string;
  kind: 'followers' | 'following';
  userId?: string;
  emptyText: string;
};

export default function FollowListScreen({ title, kind, userId, emptyText }: Readonly<Props>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { users, loading } = useFollowList(userId, kind);
  const { follow, unfollow } = useFollow();
  const [localState, setLocalState] = useState<Record<string, boolean>>({});

  async function toggle(user: { id: string; is_following: boolean }) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = localState[user.id] ?? user.is_following;
    setLocalState(prev => ({ ...prev, [user.id]: !current}));
    const ok = current ? await unfollow(user.id) : await follow(user.id);
    if (!ok) setLocalState(prev => ({ ...prev, [user.id]: current }));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
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
            const following = localState[item.id] ?? item.is_following;
            return (
              <View style={styles.row}>
                <Pressable
                  style={styles.rowMain}
                  onPress={() => router.push(`/(tabs)/screens/amis/${item.id}`)}
                > 
                  {item.avatar_url ? (
                    <RemoteImage uri={item.avatar_url} size={42} borderRadius={21} />
                  ) : (
                    <View>
                      <Text style={styles.avatarLetter}>
                        {(item.display_name ?? '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.display_name ?? 'Utilsateur'}</Text>
                    {item.handle && <Text style={styles.handle}>@{item.handle}</Text>}
                  </View>
                </Pressable>
                <Pressable
                  style={[styles.btn, following && styles.btnActive]}
                  onPress={() => toggle({ id: item.id, is_following: item.is_following })}
                >
                  <Text style={[styles.btnText, following && styles.btnTextActive]}>
                    {following ? 'Suivi' : 'Suivre'}
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
