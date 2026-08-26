import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useMemo } from 'react';
import { ArtistRecommendation } from '../hooks/useRecommendations';
import { useTheme } from '../../lib/theme/ThemeContext';
import type { ThemeColors } from '../../lib/theme/tokens';

type Props = {
  artist: ArtistRecommendation;
  onPress: () => void;
};

export default function ArtistRecomendationCard({ artist, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      {artist.imageUrl ? (
        <Image 
          source={{ uri: artist.imageUrl }}
          style={styles.avatar}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.avatar, {backgroundColor: artist.color}]}>
          <Text style={styles.avatarText}>{artist.initials}</Text>
        </View>
      )}
      <Text style={styles.name} numberOfLines={1}>{artist.name}</Text>
      <Text style={styles.match}>{artist.match}% match</Text>
      {artist.tags.length > 0 && (
        <Text style={styles.tags} numberOfLines={1}>
          {artist.tags.join(' · ')}
        </Text>
      )}

      <Pressable style={styles.btn} onPress={onPress}>
        <Text style={styles.btnText}>Voir concerts →</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 12,
    padding: 12,
    minWidth: 130,
    gap: 6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.bg,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  match: {
    fontSize: 11,
    color: colors.accent,
  },
  tags: {
    fontSize: 10,
    color: colors.textMuted,
  },
  btn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: colors.accentSoftBg,
    borderWidth: 1,
    borderColor: colors.accentSoftBorder,
    alignItems: 'center',
    marginTop: 2,
  },
  btnText: {
    fontSize: 11,
    color: colors.accent,
  },
})
};