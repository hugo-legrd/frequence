import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEditableGenres } from "../../../hooks/useEditableGenres";
import { useEditableName } from "../../../hooks/useEditableName";
import { supabase } from "../../../../lib/services/supabase";

export default function EditProfileScreen() {
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
          <ActivityIndicator color="#a78bfa" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.nameBlock}>
              <TextInput
                style={styles.input}
                placeholder="Prénom"
                placeholderTextColor="#555"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={styles.input}
                placeholder="Nom"
                placeholderTextColor="#555"
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
          <ActivityIndicator color="#a78bfa" style={{ marginVertical: 20 }}/>
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

        {/* Déconnexion */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f'},
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
    backgroundColor: '#171717', justifyContent: 'center', alignItems: 'center',
  },
  backArrow: { color: '#e5e5e5', fontSize: 18 },
  title: { fontSize: 20, fontWeight: '600', color: '#e5e5e5'},
  scrollContent: { paddingHorizontal: 16, paddingBottom: 60 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555555',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 12,
  },
  nameBlock: { gap: 10 },
  input: {
    backgroundColor: '#171717',
    borderRadius: 10,
    padding: 12,
    color: '#e5e5e5',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#a78bfa', fontSize: 14, fontWeight: '600' },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genrePill: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  genrePillActive: {
    backgroundColor: '#a78bfa',
    borderColor: '#a78bfa',
  },
  genrePillText: {
    color: '#e5e5e5', fontSize: 13, fontWeight: '500' 
  },
  genrePillTextActive: {
    color: '#0f0f0f',
  },
  logoutBtn: {
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#3a2a2a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutBtnText: { color: '#f87171', fontSize: 14, fontWeight: '600' },
});