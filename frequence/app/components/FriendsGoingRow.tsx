import { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, FlatList } from 'react-native';
import { useFriendsGoing } from '../hooks/social/useFriendsGoing'; 
import { useTheme } from '../../lib/theme/ThemeContext';
import { ThemeColors } from '../../lib/theme/tokens';

const MAX_ROWS_SHOWN = 4;

type FriendStatus = 'going' | 'interested';

type Friend = {
  user_id: string;
  display_name: string;
  status?: FriendStatus;
};

const AVATAR_ROTATION = 3;

function avatarStyleFor(colors: ThemeColors, id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const palette = [colors.accent, colors.text, colors.textMuted];
  return palette[hash % AVATAR_ROTATION];
}


export default function FriendsGoingRow({ eventId }: { eventId: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { friends, loading } = useFriendsGoing(eventId) as { friends: Friend[]; loading: boolean};
  const [modalVisible, setModalVisible] = useState(false);

  if (loading || friends.length === 0) return null;

  const shown = friends.slice(0, MAX_ROWS_SHOWN);
  const remaining = friends.length - shown.length;

  return (
    <>
      <View style={styles.container}>
        {shown.map((friend) => (
          <FriendRow key={friend.user_id} friend={friend} colors={colors} styles={styles} />
        ))}
      </View>

      {remaining > 0 && (
        <Pressable onPress={() => setModalVisible(true)} hitSlop={8}>
          <Text style={styles.seeAll}>
            Voir {remaining} autre{remaining > 1 ? 's' : ''}
          </Text>
        </Pressable>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      > 
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {friends.length} ami{friends.length > 1 ? 's' : ''} y {friends.length > 1 ? 'vont' : 'va'}
            </Text>

            <FlatList 
              data={friends}
              keyExtractor={item => item.user_id}
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <FriendRow friend={item} colors={colors} styles={styles} />
              )}
            />
            <Pressable style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Fermer</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function FriendRow({
  friend, 
  colors,
  styles,
}: {
  friend: Friend;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const status: FriendStatus = friend.status ?? 'going';
  const going = status === 'going';

  return (
    <View style={styles.friendRow}>
      <View style={[styles.friendAvatar, { backgroundColor: avatarStyleFor(colors, friend.user_id) }]}>
        <Text style={styles.friendAvatarText}>{friend.display_name.charAt(0).toUpperCase()}</Text>
      </View>

      <Text style={styles.friendName}>{friend.display_name}</Text>

      <View style={[styles.statusPill, going ? styles.statusPillGoing: styles.statusPillInterested]}>
        <Text style={[styles.statusPillText, going ? styles.statusPillTextGoing: styles.statusPillTextInterested]}>
          {going ? 'Y va' : 'Intéressé'}
        </Text>
      </View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    gap:14,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20, 
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  modalList: {
    flexGrow: 0,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.bg,
  },
  friendName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  statusPill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
  },
  statusPillGoing: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  statusPillInterested: {
    backgroundColor: 'transparent',
    borderColor: colors.accentSoftBorder,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusPillTextGoing: {
    color: colors.bg,
  },
  statusPillTextInterested: {
    color: colors.accent,
  },
  closeBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  }
})
};