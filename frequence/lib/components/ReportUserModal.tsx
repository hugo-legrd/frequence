import { useMemo, useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/tokens'; 
import { REPORT_REASONS, type ReportReason } from '../services/moderation';

type Props = {
  visible: boolean;
  userName: string;
  onClose: () => void;
  // Renvoie true si le signalement a bien été envoyé
  onSubmit: (reason: ReportReason, details: string) => Promise<boolean>;
};

export default function ReportUserModal({ visible, userName, onClose, onSubmit }: Readonly<Props>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On repart à zéro à chaque ouverture
  useEffect(() => {
    if (visible) {
      setReason(null);
      setDetails('');
      setError(null);
    }
  }, [visible]);

  async function handleSubmit() {
    if (!reason || sending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSending(true);
    setError(null);
    const ok = await onSubmit(reason, details);
    setSending(false);
    if (!ok) setError("Le signalement n'a pas pu être envoyé. Réessaie dans un instant."); 
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.title}>Signaler {userName}</Text>
            <Text style={styles.subtitle}>
              Ton signalement est anonyme: {userName} ne saura pas qu'il vient de toi.
            </Text>

            <View style={styles.reasons}>
              {REPORT_REASONS.map(r => {
                const selected = reason === r.key;
                return (
                  <Pressable
                    key={r.key}
                    style={[styles.reason, selected && styles.reasonActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setReason(r.key);
                    }}
                  >
                    <Text style={[styles.reasonText, selected && styles.reasonTextActive]}>{r.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput 
              style={styles.input}
              placeholder="Ajouter des détails (facultatif)"
              placeholderTextColor={colors.textMuted}
              value={details}
              onChangeText={setDetails}
              multiline
              maxLength={500}
            />
            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={[styles.submit, !reason && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={!reason || sending}
            >
              {sending ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.submitText}>Envoyer le signalement</Text>
              )}
            </Pressable>

            <Pressable style={styles.cancel} onPress={onClose} hitSlop={6}>
                <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
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
      backgroundColor: colors.divider, alignSelf: 'center', marginBottom: 16,
    },
    title: { fontSize: 17, fontWeight: '600', color: colors.text },
    subtitle: { fontSize: 12.5, color: colors.textMuted, marginTop: 4, marginBottom: 16, lineHeight: 17 },
    reasons: { gap: 8, marginBottom: 14 },
    reason: {
      paddingVertical: 12, paddingHorizontal: 14,
      borderRadius: 10, borderWidth: 1, borderColor: colors.divider,
      backgroundColor: colors.bg,
    },
    reasonActive: { borderColor: colors.accent, backgroundColor: colors.accentSoftBg },
    reasonText: { fontSize: 14, color: colors.text },
    reasonTextActive: { color: colors.accent, fontWeight: '600' },
    input: {
      minHeight: 70,
      backgroundColor: colors.bg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.divider,
      padding: 12,
      color: colors.text,
      fontSize: 14,
      textAlignVertical: 'top',
    },
    error: { color: colors.danger, fontSize: 12.5, marginTop: 10 },
    submit: {
      backgroundColor: colors.accent, borderRadius: 12,
      paddingVertical: 14, alignItems: 'center', marginTop: 16,
    },
    submitDisabled: { opacity: 0.4 },
    submitText: { fontSize: 14, fontWeight: '600', color: colors.bg },
    cancel: { alignItems: 'center', marginTop: 14 },
    cancelText: { fontSize: 13.5, color: colors.textMuted },
  });
}