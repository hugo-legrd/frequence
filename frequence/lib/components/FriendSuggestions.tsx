import { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useFollow, FOLLOW_LABELS, type FollowState } from '../hooks/social/useFollow';
import { suggestionReason, type FriendSuggestion } from "../hooks/social/useFriendSuggestions";

import { useTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/tokens";

function SuggestionCard({ suggestion }: { suggestion: FriendSuggestion}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { toggle, loading } = useFollow();
  const [state, setState] = useState<FollowState>('none');

  const name = suggestion.display_name ?? suggestion.handle ?? '?';
  const active = state !== 'none';

  async function handleFollow() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const before = state;
    // Affichage immédiat; le serveur dit ensuite si c'est 'Suivi' ou 'Demandé'
    setState(before === 'none' ? 'following' : 'none');
    const result = await toggle(suggestion.id, before);
    setState(result ?? before);
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/user/${suggestion.id}`)}
    >
      {suggestion.avatar_url ? (
        <Image source={{ uri: suggestion.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      )}

      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      <Text style={styles.reason} numberOfLines={2}>{suggestionReason(suggestion)}</Text>

      <Pressable
        style={[styles.followBtn, active && styles.followBtnActive]}
        onPress={handleFollow}
        disabled={loading}
        hitSlop={4}
      >
        {loading ? (
          <ActivityIndicator size="small" color={active ? colors.bg : colors.accent} />
        ) : (
          <Text style={[styles.followText, active && styles.followTextActive]}>
            {FOLLOW_LABELS[state]}
          </Text>
        )}
      </Pressable>
    </Pressable>
  );
}

export default function FriendSuggestions({ suggestions } : { suggestions: FriendSuggestion[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>SUGGESTIONS POUR TOI</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {suggestions.map(s => (
          <SuggestionCard key={s.id} suggestion={s}/>
        ))}
      </ScrollView>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { marginTop: 20, marginHorizontal: -16 },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      letterSpacing: 0.5,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    row: { paddingHorizontal: 16, gap: 10 },
    card: {
      width: 140,
      alignItems: 'center',
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.surface,
    },
    cardPressed: { opacity: 0.7 },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.divider,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    avatarText: { fontSize: 20, fontWeight: '600', color: colors.accent },
    name: { fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center' },
    reason: {
      fontSize: 11.5,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 15,
      marginTop: 2,
      minHeight: 30, // même hauteur pour toutes les cartes, raison sur 1 ou 2 lignes
    },
    followBtn: {
      alignSelf: 'stretch',
      marginTop: 10,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    followBtnActive: { backgroundColor: colors.accent },
    followText: { fontSize: 12.5, fontWeight: '600', color: colors.accent },
    followTextActive: { color: colors.bg },
  });
}