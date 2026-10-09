import { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
// MapView = composant principal de la carte (Apple Maps sur iOS)
// Marker = pin sur la carte
// PROVIDER_DEFAULT = utilise Apple Maps sur iOS, Google Maps sur Android
import MapView, { Marker, PROVIDER_DEFAULT, Callout } from 'react-native-maps';
import Animated, { useSharedValue, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';

import * as Location from 'expo-location';

import ExplorerBottomSheet from '../../components/ExplorerBottomSheet'
;
import { useRecommendations } from '../../hooks/events/useRecommendations';

import { supabase } from '../../../lib/services/supabase';
import { useTheme } from '../../../lib/theme/ThemeContext';
import type { ThemeColors } from '../../../lib/theme/tokens';
import type { Venue, Store } from '../../../lib/types/explorer';

export default function ExplorerScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Position GPS de l'utilisateur
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  // true si l'utilisateur a refusé la permission de localisation
  const [permissionDenied, setPermissionDenied] = useState(false);
  // true pendant la récupération de la position GPS
  const [loading, setLoading] = useState(true);
  // Référence vers la carte pour pouvoir la déplacer programmatiquement
  const mapRef = useRef<MapView>(null);
  // List des venues récupérées depuis Supabase
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);

  const [activeVenueIds, setActiveVenueIds] = useState<Set<string>>(new Set());

  const [showStores, setShowStores] = useState(true);
  const [showVenues, setShowVenues] = useState(true);

  const { recommendations, loading: recLoading } = useRecommendations();

  const animatedIndex = useSharedValue(0);
  const recenterBtnStyle = useAnimatedStyle(() => ({
    bottom: `${interpolate(animatedIndex.value, [0, 1], [31, 56], Extrapolation.CLAMP)}%`,
  }));
  
  useEffect(() => {
    requestLocation();
  }, [location]);

  useEffect(() => {
    if (!location) return;
    fetchVenues();
    loadStores();
  }, [location]);

  // Demande la permission GPS et récupère la position actuelle
  async function requestLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setPermissionDenied(true);
      setLoading(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
    setLoading(false);
  }

  // Recentre la carte sur la position GPS actuelle
  function recenter() {
    if (!location || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 500);
  }

  // Récupère les venues qui ont des coordonnées GPS valides
  async function fetchVenues(){
    const { data, error } = await supabase
      .from('venues')
      .select('id, name, address, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .neq('latitude', 0)
      .neq('longitude', 0);

    if (error) console.error(error);
    else setVenues(data ?? []);

    const { data: upcoming } = await supabase
      .from('events')
      .select('venue_id')
      .gte('starts_at', new Date().toISOString())
      .not('venue_id', 'is', null);

    setActiveVenueIds(new Set((upcoming ?? []).map(e => e.venue_id as string)));
  }

  async function loadStores() {
    const { data } = await supabase
      .from('record_stores')
      .select('id, name, address, latitude, longitude, schedule, website')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);
    setStores(data ?? []);
  }

  // Écran de chargement pendant la récupération GPS
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // Écran affiché si la permission GPS est refusée
  if (permissionDenied) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionTitle}>Localisation requise</Text>
        <Text style={styles.permissionText}>
          Active la localisation dans les réglages pour voir les concerts et disquaires près de toi.
        </Text>
        <Pressable style={styles.btnPrimary} onPress={requestLocation}>
          <Text style={styles.btnText}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Carte principale — Apple Maps sur iOS */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        // showsUserLocation = affiche le point bleu de position de l'utilisateur
        showsUserLocation={true}
        // showsMyLocationButton = cache le bouton natif (on a notre propre bouton)
        showsMyLocationButton={false}
        initialRegion={{
          latitude: location?.latitude ?? 48.8566,
          longitude: location?.longitude ?? 2.3522,
          // latitudeDelta/longitudeDelta = niveau de zoom (plus petit = plus zoomé)
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {/* Pins oranges pour chaque venue de concert */}
        {showVenues && venues.map(venue =>(
          <Marker
            key={venue.id}
            coordinate={{
              latitude: venue.latitude,
              longitude: venue.longitude,
            }}
            title={venue.name ?? undefined}
            description={venue.address ?? ''}
            pinColor={colors.genre.festival.base}
            onPress={() => {
              setSelectedStore(null);
              setSelectedVenue(venue)}
            }
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={selectedVenue?.id === venue.id}
          >
            <View style={selectedVenue?.id === venue.id ? styles.pinHalo : undefined}>
              <View style={[
                styles.pinOrange,
                !activeVenueIds.has(venue.id) && styles.pinHollow,
              ]} />
            </View>

            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{venue.name}</Text>
                {venue.address && (
                  <Text style={styles.calloutAddress}>{venue.address}</Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
        {/* Pins violets pour les disquaires */}
        {showStores && stores.map(store => (
          <Marker
            key={`store-${store.id}`}
            coordinate={{
              latitude: store.latitude,
              longitude: store.longitude,
            }} 
            title={store.name ?? undefined}
            description={store.address ?? ''}
            pinColor={colors.accent}
            onPress={() => {
              setSelectedVenue(null);
              setSelectedStore(store)
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={selectedStore?.id === store.id}
          >
            <View style={selectedStore?.id === store.id ? styles.pinHalo : undefined}>
              <View style={styles.pinViolet} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Légende des couleurs de pins — positionnée en absolu sur la carte */}
      <View style={styles.legend}>
        <Pressable
          style={[styles.legendItem, !showStores && styles.legendItemOff]}
          onPress={() => setShowStores(v => !v)}
          hitSlop={6}
        >
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendText}>Disquaires</Text>
        </Pressable>
        <Pressable
          style={[styles.legendItem, !showVenues && styles.legendItemOff]}
          onPress={() => setShowVenues(v => !v)}
          hitSlop={6}
        >
          <View style={[styles.legendDot, { backgroundColor: colors.genre.festival.base }]} />
          <Text style={styles.legendText}>Concerts</Text>
        </Pressable>
      </View>

      {/* Bouton pour recentrer la carte sur la position GPS actuelle */}
      <Animated.View style={[styles.recenterBtn, recenterBtnStyle]}>
        <Pressable onPress={recenter}>
          <Text style={styles.recenterIcon}>◎</Text>
        </Pressable>
      </Animated.View>

      {/* Bottom sheet — panneau fixe en bas de l'écran */}
      <ExplorerBottomSheet 
        selectedVenue={selectedVenue}
        selectedStore={selectedStore}
        onClose={() => { setSelectedVenue(null); setSelectedStore(null); }}
        venueCount={venues.length}
        storeCount={stores.length}
        recommendations={recommendations}
        onIndexChange={setSheetIndex}
        animatedIndex={animatedIndex}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  map: { flex: 1 },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  btnText: { fontSize: 14, fontWeight: '500', color: colors.bg },
  legend: {
    position: 'absolute',
    top: 56,
    right: 16,
    backgroundColor: colors.panelTranslucent,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.text },
  recenterBtn: {
    position: 'absolute',
    bottom: 260,
    right: 16,
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 999,
  },
  recenterIcon: { fontSize: 18, color: colors.text },
  pinOrange: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.genre.festival.base,
    borderWidth: 2,
    borderColor: colors.bg,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  pinViolet: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.bg,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, 
  },
  pinSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.text,
  },
  pinHalo: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: colors.accentSoftBg,
    borderWidth: 2,
    borderColor: colors.text,
  },
  pinHollow: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.genre.festival.base,
  },
  callout: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.divider,
    minWidth: 200,
    maxWidth: 220,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  calloutAddress: {
    fontSize: 11,
    color: colors.textMuted,
  },
  legendItemOff: { opacity: 0.35 },
})
};