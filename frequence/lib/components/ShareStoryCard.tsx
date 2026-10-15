import { forwardRef } from "react";
import { View, Text, Image, StyleSheet, Platform } from 'react-native';


// La carte est dessinée en 360 x 640 (format story 9:16), puis capturée en 1080 x 1920.
export const STORY_WIDTH = 360;
export const STORY_HEIGHT = 640;

// La maquette a été dessinée en 540 x 960: s() convertit ses mesures à la taille réelle.
const SCALE = STORY_WIDTH / 540;
const s = (n: number) => Math.round(n * SCALE * 10) / 10;

// Couleurs fixes: la story reste sombre même si l'utilisateurs est en light mode.
// à aligner avec les valeurs dark de token.ts
const C = {
  bg: '#0e0d12',
  card: '#1c1a24',
  imageBg: '#26232f',
  line: '#3a3645',
  text: '#f4f1fa',
  chipText: '#d9d4e5',
  muted: '#8e879e',
  accent: '#b69cff',
};

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const DASH_COUNT = 18;

type Props = {
  title: string;
  category: string;
  dateLabel: string;
  venueName: string | null;
  genres: string[],
  imageUrl: string | null;
  onImageLoaded?: () => void;
};

const ShareStoryCard = forwardRef<View, Props>(function ShareStoryCard(
  { title, category, dateLabel, venueName, genres, imageUrl, onImageLoaded },
  ref
) {
  return (
    <View ref={ref} collapsable={false} style={styles.root}>
      <View style={styles.card}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onLoadEnd={onImageLoaded}
          />
        ) : (
          <View style={styles.image} /> 
        )}

        {/* Ligne pointillée + encoches du billet */}
        <View style={styles.perforation}>
          <View style={[styles.notch, { left: -s(14) }]}/>
          <View style={styles.dashes}>
            {Array.from({ length: DASH_COUNT }).map((_, i) => (
              <View key={i} style={styles.dash} />
            ))}
          </View>
          <View style={[styles.notch, {right: -s(14) }]} />
        </View>

        <View style={styles.body}>
            <Text style={styles.eyebrow}>{category.toUpperCase()}</Text>
            <Text style={styles.title} numberOfLines={3}>{title}</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>DATE</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{dateLabel}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>LIEU</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{venueName ?? 'Paris'}</Text>
              </View>
            </View>

            {genres.length > 0 && (
              <View style={styles.chips}>
                {genres.slice(0, 3).map((genre) => (
                  <View key={genre} style={styles.chip}>
                    <Text style={styles.chipText}>{genre}</Text>
                  </View>
                ))}
              </View>
            )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.logo}>fréquence.</Text>
        <Text style={styles.tagline}>Trouvé sur Fréquence</Text>
      </View>
    </View>
  );
});

export default ShareStoryCard;

const styles = StyleSheet.create({
  root: {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    backgroundColor: C.bg,
    alignItems: 'center',
    // Haut et bas laissés libres pour les boutons d'Instagram / TikTok
    paddingTop: s(130),
    paddingBottom: s(120),
    paddingHorizontal: s(50),
  },
  card: {
    width: s(440),
    backgroundColor: C.card,
    borderRadius: s(26),
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: s(290),
    backgroundColor: C.imageBg,
  },
  perforation: {
    height: s(28),
    justifyContent: 'center',
  },
  notch: {
    position: 'absolute',
    top: 0,
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: C.bg,
  },
  dashes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: s(26),
  },
  dash: {
    width: s(8),
    height: s(2),
    backgroundColor: C.line,
  },
  body: {
    paddingTop: s(6),
    paddingHorizontal: s(28),
    paddingBottom: s(28),
    gap: s(12),
  },
  eyebrow: {
    fontFamily: MONO,
    fontSize: s(12),
    fontWeight: '600',
    letterSpacing: s(2),
    color: C.accent,
  },
  title: {
    fontSize: s(38),
    fontWeight: '800',
    lineHeight: s(40),
    letterSpacing: -s(1),
    color: C.text,
  },
  infoRow: {
    flexDirection: 'row',
    gap: s(12),
    marginTop: s(6),
  },
  infoCol: {
    flex: 1,
    gap: s(4),
  },
  infoLabel: {
    fontFamily: MONO,
    fontSize: s(11),
    letterSpacing: s(1.5),
    color: C.muted,
  },
  infoValue: {
    fontSize: s(16),
    fontWeight: '600',
    color: C.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    marginTop: s(4),
  },
  chip: {
    paddingVertical: s(5),
    paddingHorizontal: s(12),
    borderRadius: 100,
    borderWidth: 1,
    borderColor: C.line,
  },
  chipText: {
    fontSize: s(12),
    color: C.chipText,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    gap: s(4),
  },
  logo: {
    fontSize: s(24),
    fontWeight: '800',
    letterSpacing: -s(0.8),
    color: C.text,
  },
  tagline: {
    fontFamily: MONO,
    fontSize: s(12),
    color: C.muted,
  },
});

