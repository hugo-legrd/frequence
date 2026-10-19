import { useMemo } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/tokens';

type Props = {
  visible: boolean;
  userName: string;
  isBlocked: boolean;
  onClose: () => void;
  onReport: () => void;
  onBlock: () => void;
  onUnblock: () => void;
};

// Menu "..." d'un profile : se ferme en appuyant à côté, comme les autres panneaux de l'app
export default function ProfileActionsSheet({
  visible, userName, isBlocked, onClose, onReport, onBlock, onUnblock,
}: Readonly<Props>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>{userName}</Text>

          <View style={styles.list}>
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={onReport}
            >
              <Feather name="flag" size={17} color={colors.text} />
              <Text style={styles.rowText}>Signaler</Text>
            </Pressable>

            <View style={styles.separator} />

            {isBlocked ? (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={onUnblock}
              >
                <Feather name="unlock" size={17} color={colors.text} />
                <Text style={styles.rowText}>Débloquer</Text>
              </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={onBlock}
            >
              <Feather name="slash" size={17} color={colors.danger} />
              <Text style={[styles.rowText, { color: colors.danger }]}>Bloquer</Text>
            </Pressable>
            )}
          </View>

          <Pressable style={styles.cancel} onPress={onClose} hitSlop={6}>
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 34,
    },
    handle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: colors.divider, alignSelf: 'center', marginBottom: 14,
    },
    title: { fontSize: 15, fontWeight: '600', color: colors.textMuted, textAlign: 'center', marginBottom: 14 },
    list: {
      backgroundColor: colors.bg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.divider,
      overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15 },
    rowPressed: { backgroundColor: colors.surface },
    rowText: { fontSize: 15, fontWeight: '500', color: colors.text },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginLeft: 45 },
    cancel: { alignItems: 'center', marginTop: 16 },
    cancelText: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  });
}
 