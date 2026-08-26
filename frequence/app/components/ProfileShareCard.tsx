import { forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme/ThemeContext';
import { ThemeColors } from '../../lib/theme/tokens';

type Props = {
  displayName: string;
  concertsCount: number;
  artistsCount: number;
  topArtist?: string;
  year: number;
};

const ProfileShareCard = forwardRef<View, Props>(
  ({ displayName, concertsCount, artistsCount, topArtist, year }, ref) => {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        <Text style={styles.year}>{year}</Text>
        <Text style={styles.title}>Mon année musicale</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{concertsCount}</Text>
            <Text style={styles.statLabel}>concerts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{artistsCount}</Text>
            <Text style={styles.statLabel}>artistes</Text>
          </View>
        </View>

        {topArtist && (
          <View style={styles.topArtistBlock}>
            <Text style={styles.topArtistLabel}>Artiste le plus vu</Text>
            <Text style={styles.topArtistName}>{topArtist}</Text>
          </View>
        )}

        <Text style={styles.footer}>{displayName}</Text>
      </View>
    );
  }
);

export default ProfileShareCard;

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  card: {
    width: 320,
    height: 400,
    backgroundColor: colors.bg,
    borderRadius: 24,
    padding: 28,
    justifyContent: 'space-between',
  },
  year: { fontSize: 14, color: colors.accent, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: 4 },
  statsGrid: { flexDirection: 'row', gap: 16, marginTop: 24 },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  statValue: { fontSize: 32, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  topArtistBlock: { marginTop: 8 },
  topArtistLabel: { fontSize: 12, color: colors.textMuted},
  topArtistName: { fontSize: 20, fontWeight: '600', color: colors.accent, marginTop: 2 },
  footer: { fontSize: 13, color: colors.textMuted, textAlign: 'right' },
})
};