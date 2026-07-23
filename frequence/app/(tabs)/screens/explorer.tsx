import { useEffect, useRef, useState } from 'react';
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
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../../../lib/services/supabase';
import ExplorerBottomSheet from '../../components/ExplorerBottomSheet';

type Venue = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
}; 

type Store = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  schedule: string | null;
  website: string | null;
}

export default function ExplorerScreen() {
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

  useEffect(() => {
    requestLocation();
    if(location) {
      fetchVenues();
      loadStores()
    }
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
        <ActivityIndicator color="#a78bfa" />
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
        {venues.map(venue =>(
          <Marker
            key={venue.id}
            coordinate={{
              latitude: venue.latitude,
              longitude: venue.longitude,
            }}
            title={venue.name}
            description={venue.address ?? ''}
            pinColor="#f97316"
            onPress={() => {
              setSelectedStore(null);
              setSelectedVenue(venue)}
            }
          />
        ))}
        {/* Pins violets pour les disquares */}
        {stores.map(store => (
          <Marker
            key={`store-${store.id}`}
            coordinate={{
              latitude: store.latitude,
              longitude: store.longitude,
            }} 
            title={store.name}
            description={store.address ?? ''}
            pinColor="#a78bfa"
            onPress={() => {
              setSelectedVenue(null);
              setSelectedStore(store)
            }}
          />
        ))}
      </MapView>

      {/* Légende des couleurs de pins — positionnée en absolu sur la carte */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#a78bfa' }]} />
          <Text style={styles.legendText}>Disquaires</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
          <Text style={styles.legendText}>Concerts</Text>
        </View>
      </View>

      {/* Bouton pour recentrer la carte sur la position GPS actuelle */}
      <Pressable style={styles.recenterBtn} onPress={recenter}>
        <Text style={styles.recenterIcon}>◎</Text>
      </Pressable>

      {/* Bottom sheet — panneau fixe en bas de l'écran */}
      <ExplorerBottomSheet 
        selectedVenue={selectedVenue}
        selectedStore={selectedStore}
        onClose={() => setSelectedVenue(null)}
        venueCount={venues.length}
        storeCount={stores.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  map: { flex: 1 },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#e5e5e5',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
  },
  btnPrimary: {
    backgroundColor: '#a78bfa',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  btnText: { fontSize: 14, fontWeight: '500', color: '#0f0f0f' },
  legend: {
    position: 'absolute',
    top: 56,
    right: 16,
    backgroundColor: 'rgba(15,15,15,0.85)',
    borderWidth: 1,
    borderColor: '#1e1e1e',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#e5e5e5' },
  recenterBtn: {
    position: 'absolute',
    bottom: 260,
    right: 16,
    width: 40,
    height: 40,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#1e1e1e',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recenterIcon: { fontSize: 18, color: '#e5e5e5' },
});