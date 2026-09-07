import { Pressable, View, Text, StyleSheet, Platform, Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { EventDetail } from "../../lib/types/event"
import { useMemo } from 'react';
import { useTheme } from '../../lib/theme/ThemeContext';
import { ThemeColors } from '../../lib/theme/tokens';

export default function VenueMiniMap({ venue }: Readonly<{ venue: EventDetail['venues']}>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (venue?.latitude == null || venue.longitude == null) {
    return null;
  }

  const { latitude, longitude, name } = venue;

  function openInMaps() {
    const label = encodeURIComponent(name);
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&q=${label}`,
      android: `geo:${latitude},${longitude}?q=${longitude}(${label})`,
    });

    Linking.openURL(url!).catch(() => {
      // Fallback Google Maps web si l'app native n'est pas installée
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
      );
    });
  }

  return (
    <Pressable style={styles.miniMapContainer} onPress={openInMaps}>
      <MapView
        style={styles.miniMap}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Marker
          coordinate={{ latitude, longitude}}
        />
      </MapView>
      <View style={styles.miniMapOverlay}>
        <Text style={styles.miniMapOverlayText}>Ouvrir dans Map →</Text>
      </View>
    </Pressable>
  )
}

function createStyles(colors: ThemeColors){
  return StyleSheet.create({
    miniMapContainer: {
      marginTop: 12,
      borderRadius: 12,
      overflow: 'hidden', 
      height: 140,
    },
    miniMap: {
      flex: 1,
      pointerEvents : 'none',
    },
    miniMapOverlay: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: colors.scrim,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6
    },
    miniMapOverlayText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '600',
    }
  })
};