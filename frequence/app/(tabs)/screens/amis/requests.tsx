import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, RefreshControl, Image } from 'react-native';

import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useFollowRequests, type FollowRequest } from '../../../../lib/hooks/social/useFollowRequests';
import { useUnreadActivity } from '../../../../lib/context/UnreadActivityContext';
import { useTheme } from '../../../../lib/theme/ThemeContext';
import type { ThemeColors } from '../../../../lib/theme/tokens';

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} jour${days > 1 ? 's' : ''}`;
}

type Styles = ReturnType<typeof createStyles>;

function RequestRow({ item, styles, onAccept, onRefuse }: {
  item: FollowRequest;
  styles: Styles;
  onAccept: () => void;
  onRefuse: () => void;
}) {
  const name = item.name ?? item.handle ?? 'Quelqu\'un';
  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.identity}
        onPress={() => router.push(`/user/${item.requester_id}`)}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        <View style={styles.identityText}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {item.handle ? `@${item.handle} · ` : ''}{timeAgo(item.requested_at)}
          </Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable style={styles.acceptBtn} onPress={onAccept} hitSlop={4}>
          <Text style={styles.acceptLabel}>Accepter</Text>
        </Pressable>
        <Pressable style={styles.refuseBtn} onPress={onRefuse} hitSlop={4}>
          <Text style={styles.refuseLabel}>Refuser</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function FollowRequestsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { requests, loading, refresh, accept, refuse } = useFollowRequests();
  const { refresh: refreshBadge } = useUnreadActivity();
  const [refreshing, setRefreshing] = useState(false);

  async function handleAccept(requesterId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (await accept(requesterId)) refreshBadge();
  }

  async function handleRefuse(requesterId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (await refuse(requesterId)) refreshBadge();
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([
        refresh(),
        new Promise<void>(resolve => setTimeout(resolve, 600)), // délai artificiel minimum
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  const header = (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
        <Text style={styles.backArrow}>←</Text>
      </Pressable>
      <Text style={styles.headerTitle}>Demandes</Text>
      <Text style={styles.headerSubtitle}>Ces personnes souhaitent vous suivre</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList 
        data={requests}
        keyExtractor={item => item.requester_id}
        renderItem={({ item }) => (
          <RequestRow
            item={item}
            styles={styles}
            onAccept={() => handleAccept(item.requester_id)}
            onRefuse={() => handleRefuse(item.requester_id)}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>Aucune demande en attente</Text>
              <Text style={styles.emptyText}>
                Les demandes d'abonnement à votre compte privé apparaîteront ici.
              </Text>
            </View>
          )
        }
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent} 
          />
        }
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingTop: 60,
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backArrow: {
    fontSize: 22,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '500',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  identityText: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
  },
  acceptBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.accent,
    marginRight: 8,
  },
  acceptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.bg,
  },
  refuseBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  refuseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  centered: {
    paddingHorizontal: 32,
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
})
};