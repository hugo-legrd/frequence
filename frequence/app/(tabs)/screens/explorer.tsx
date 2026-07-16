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
import { fetchRecordStores, RecordStore } from '../../../lib/services/overpass';

type Venue = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
};

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
  const [stores, setStores] = useState<RecordStore[]>([]);

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
    if (!location) return;
  try {
    const data = await fetchRecordStores(location.latitude, location.longitude);
    setStores(data);
    console.log(`✅ ${data.length} disquaires trouvés`);
  } catch (err) {
    console.warn('⚠️ Overpass indisponible:', err);
    // On continue sans les disquaires — pas bloquant
  }
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
      <View style={styles.bottomSheet}>
        {/* Handle — petit trait gris pour indiquer que le panneau est glissable */}
        <View style={styles.handle} />

        {/* Barre de recherche — placeholder pour l'instant */}
        <View style={styles.searchBar}>
          <Text style={styles.searchPlaceholder}>Artiste, lieu, style...</Text>
        </View>

        {/* Grille de 4 catégories de découverte */}
        <View style={styles.categories}>
          {[
            { icon: '🎵', label: 'Événements', count: '22 ce mois' },
            { icon: '💿', label: 'Disquaires', count: `${stores.length} autour` },
            { icon: '🎧', label: 'DJ Sets', count: '8 ce week-end' },
            { icon: '✨', label: 'Nouveautés', count: '5 nouveaux' },
          ].map(cat => (
            <Pressable key={cat.label} style={styles.category}>
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <View>
                <Text style={styles.categoryName}>{cat.label}</Text>
                <Text style={styles.categoryCount}>{cat.count}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
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
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#171717',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: '#1e1e1e',
    padding: 12,
    paddingBottom: 32,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#3a3a3a',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#1e1e1e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  searchPlaceholder: { fontSize: 13, color: '#3a3a3a' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  category: {
    width: '48%',
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#1e1e1e',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: { fontSize: 20 },
  categoryName: { fontSize: 12, color: '#e5e5e5', fontWeight: '500' },
  categoryCount: { fontSize: 10, color: '#555555', marginTop: 2 },
});