import { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, FlatList } from 'react-native';
import { useFriendsGoing } from '../hooks/useFriendsGoing'; 
import { useTheme } from '../../lib/theme/ThemeContext';
import { ThemeColors } from '../../lib/theme/tokens';

const MAX_NAMES_SHOWN = 2;

function formatFriendsText(names: string[], totalCount: number): string {
  if (totalCount === 0) return '';

  const shown = names.slice(0, MAX_NAMES_SHOWN);
  const remaining = totalCount - shown.length;

  if (totalCount === 1) return `${shown[0]} y va`;
  if (totalCount === 2) return `${shown[0]} et ${shown[1]} y vont`;

  if (remaining > 0) {
    return `${shown.join(', ')} et ${remaining} autre${remaining > 1 ? 's' : ''} y vont`;
  }
  return `${shown.join(', ')} y vont`;
}

export default function FriendsGoingRow({ eventId }: { eventId: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { friends, loading } = useFriendsGoing(eventId);
  const [modalVisible, setModalVisible] = useState(false);

  if (loading || friends.length === 0) return null;

  const names = friends.map(f => f.display_name);
  const text = formatFriendsText(names, friends.length);
  const isClickable = friends.length > MAX_NAMES_SHOWN;

  return (
    <>
      <Pressable
        onPress={() => isClickable && setModalVisible(true)}
        disabled={!isClickable}
        style={styles.container}
      >
        <Text style={styles.icon}>👥</Text>
        <Text style={styles.text}>
          {text}
          {isClickable && <Text style={styles.link}> · Voir tous</Text>}
        </Text>
      </Pressable>

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
                <View style={styles.friendRow}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>
                      {item.display_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.friendName}>{item.display_name}</Text>
                </View>
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  icon: { fontSize: 14 },
  text: { 
    fontSize: 13,
    color: colors.accent,
    flex: 1,
  },
  link: {
    color: colors.textMuted,
    fontWeight: '600',
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
    paddingVertical: 10,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  friendName: {
    fontSize: 14,
    color: colors.text,
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