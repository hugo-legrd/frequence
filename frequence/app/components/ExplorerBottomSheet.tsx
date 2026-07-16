import { useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

type Venue = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
};

type Props = {
  selectedVenue: Venue | null;
  onClose: () => void;
  venueCount: number;
};

// Snap points fixes - on change juste l'index actif
const SNAP_POINTS = ['30%', '55%'];

export default function ExplorerBottomSheet({ selectedVenue, onClose, venueCount }: Readonly<Props>) {
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Rouvre la sheet quand une venue est sélectionnée
  useEffect(() => {
    if (selectedVenue) {
      bottomSheetRef.current?.snapToIndex(1);
    } else {
      bottomSheetRef.current?.snapToIndex(0);
    }
  }, [selectedVenue]);

  function handleClose() {
    onClose();
    bottomSheetRef.current?.snapToIndex(0);
  }

  function openMaps() {
    if (!selectedVenue) return;
    const url = `maps://app?daddr=${selectedVenue.latitude},${selectedVenue.longitude}`;
    Linking.openURL(url).catch(() => {
      // Fallback Google Maps
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${selectedVenue.latitude},${selectedVenue.longitude}`);
    });
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={SNAP_POINTS}
      backgroundStyle={styles.background}
      handleComponent={() => (
        // Handle custom avec croix en haut à droite
        <View style={styles.handleContainer}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
            {/* {selectedVenue && (
              <Pressable onPress={handleClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            )} */}
          </View>
        </View>
      )} 
      enablePanDownToClose={!!selectedVenue}
    >
      <BottomSheetView style={styles.content}>
        {selectedVenue ? (
          // Etat venue sélectionnée
          <>
            <View style={styles.venueHeader}>
              <View style={styles.venueIcon}>
                <Text style={styles.venueIconText}>🎵</Text>
              </View>
              <View>
                <Text style={styles.venueName}>{selectedVenue.name}</Text>
                <Text style={styles.venueType}>Salle de concert</Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>X</Text>
              </Pressable>

            <View style={styles.divider} />

            {selectedVenue.address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📍</Text>
                <Text style={styles.infoText}>{selectedVenue.address}</Text>
              </View>
            )}

            <View style={styles.btnRow}>
              <Pressable style={styles.btnSecondary} onPress={openMaps}>
                <Text style={styles.btnSecondaryText}>Itinéraire</Text>
              </Pressable>
            </View>
          </>
        ) : (
          // Etat par défaut
          <>
            <View style={styles.searchBar}>
              <Text style={styles.searchPlaceholder}>Artiste, lieu, style...</Text>
            </View>
            <Text style={styles.sectionLabel}>Explorer par catégorie</Text>
            <View style={styles.categories}>
              {[
                 { icon: '🎵', label: 'Événements', count: `${venueCount} lieux` },
                 { icon: '💿', label: 'Disquaires', count: 'Bientôt' },
                 { icon: '🎧', label: 'DJ Sets', count: 'Bientôt' },
                 { icon: '✨', label: 'Nouveautés', count: 'Bientôt' },
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
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#171717',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: '#1e1e1e'
  },
  handleContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  handle: {
    backgroundColor: '#3a3a3a',
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  venueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  venueIcon: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(249,115,22,0.15)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueIconText: {
    fontSize: 20,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#e5e5e5',
  },
  venueType: {
    fontSize: 12,
    color: '#f97316',
    marginTop: 2,
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    width: 28,
    height: 28,
    backgroundColor: '#1e1e1e',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 12,
    color: '#555555',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e1e1e',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  infoIcon: {
    fontSize: 14,
    width: 20,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#e5e5e5',
    flex: 1,
    lineHeight: 18,
  },
  btnRow: {
    marginTop: 16,
    gap: 8,
  },
  btnSecondary: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 13,
    color: '#e5e5e5',
  },
  searchBar: {
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#1e1e1e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  searchPlaceholder: {
    fontSize: 13,
    color: '#3a3a3a',
  },
  sectionLabel: {
    fontSize: 11,
    color: '#3a3a3a',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  category: {
    width: '48%',
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#1e1e1e',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryName: {
    fontSize: 12,
    color: '#e5e5e5',
    fontWeight: '500',
  },
  categoryCount: {
    fontSize: 10, 
    color: '#555555',
    marginTop: 2,
  },
});