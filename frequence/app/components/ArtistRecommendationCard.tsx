import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ArtistRecommendation } from '../hooks/useRecommendations';

type Props = {
  artist: ArtistRecommendation;
  onPress: () => void;
};

export default function ArtistRecomendationCard({ artist, onPress }: Props) {
  return (
    <View style={styles.card}>
      {/* Avatar avec initiales colorées */}
      <View style={[styles.avatar, {backgroundColor: artist.color}]}>
        <Text style={styles.avatarText}>{artist.initials}</Text>
      </View>

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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#1e1e1e',
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
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f0f0f',
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: '#e5e5e5',
  },
  match: {
    fontSize: 11,
    color: '#a78bfa',
  },
  tags: {
    fontSize: 10,
    color: '#555555',
  },
  btn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(167,139,250,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
    alignItems: 'center',
    marginTop: 2,
  },
  btnText: {
    fontSize: 11,
    color: '#a78bfa',
  },
});