import { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Switch } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEditableGenres } from "../../../hooks/profile/useEditableGenres";
import { useEditableName } from "../../../hooks/profile/useEditableName";
import { supabase } from "../../../../lib/services/supabase";
import { useTheme } from '../../../../lib/theme/ThemeContext';
import type { ThemeColors } from '../../../../lib/theme/tokens';

export default function EditProfileScreen() {
  const { colors, isDark, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { genres, loading: genresLoading, toggleGenre } = useEditableGenres();
  const { firstName, setFirstName, lastName, setLastName,
    loading: nameLoading, saving: nameSaving, save: saveName
  } = useEditableName();
  const [nameSaved, setNameSaved] = useState(false);

  async function handleSaveName() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await saveName();
    if (success) {
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    }
  }

  async function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>Modifier le profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>IDENTITÉ</Text>
        {nameLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.nameBlock}>
              <TextInput
                style={styles.input}
                placeholder="Prénom"
                placeholderTextColor={colors.textMuted}
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={styles.input}
                placeholder="Nom"
                placeholderTextColor={colors.textMuted}
                value={lastName}
                onChangeText={setLastName}
              />
              <Pressable
                style={styles.saveBtn}
                onPress={handleSaveName}
                disabled={nameSaving}
              >
                <Text style={styles.saveBtnText}>
                  {nameSaving ? 'Enregistrement...' : nameSaved ? '✓ Enregistré' : 'Enregistrer'}
                </Text>
              </Pressable>
          </View>
        )}

        <Text style={styles.sectionLabel}>MES GENRES</Text>
        {genresLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }}/>
        ) : (
          <View style={styles.genresGrid}>
            {genres.map(genre => (
              <Pressable 
                key={genre.id}
                style={[styles.genrePill, genre.selected && styles.genrePillActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleGenre(genre.id);
                }}
              >
                <Text style={[styles.genrePillText, genre.selected && styles.genrePillTextActive]}>
                  {genre.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.sectionLabel}>APPARENCE</Text>
        <View style={styles.appearanceRow}>
          <Text style={styles.appearanceLabel}>Dark Mode</Text>
          <Switch 
            value={isDark}
            onValueChange={(value) => setMode(value ? 'dark' : 'light')}
            trackColor={{ false: colors.divider, true: colors.accentSoftBg }}
            thumbColor={isDark ? colors.accent : colors.surface }
          />
        </View>

        {/* Déconnexion */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 35, height: 36, borderRadius: 18,
    backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
  },
  backArrow: { color: colors.text, fontSize: 18 },
  title: { fontSize: 20, fontWeight: '600', color: colors.text},
  scrollContent: { paddingHorizontal: 16, paddingBottom: 60 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 12,
  },
  nameBlock: { gap: 10 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: colors.accentSoftBg,
    borderWidth: 1,
    borderColor: colors.accentSoftBorder,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genrePill: {
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  genrePillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  genrePillText: {
    color: colors.text, fontSize: 13, fontWeight: '500' 
  },
  genrePillTextActive: {
    color: colors.bg,
  },
  logoutBtn: {
    marginTop: 40,
    borderWidth: 1,
    borderColor: colors.accentSoftBorder,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutBtnText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  appearanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  appearanceLabel: { color: colors.text, fontSize: 14, fontWeight: '500' },
  })
};