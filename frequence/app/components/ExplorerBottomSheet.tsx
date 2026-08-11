import { use, useEffect, useRef } from "react";
import { Animated, View, Text, StyleSheet, Pressable, Linking, ScrollView, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useRecommendations, ArtistRecommendation } from "../hooks/useRecommendations";
import { router } from 'expo-router';
import SearchBar from "./SearchBar";
import ArtistRecommendationCard from "./ArtistRecommendationCard";


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

type Props = {
  selectedVenue: Venue | null;
  selectedStore: Store | null;
  onClose: () => void;
  venueCount: number;
  storeCount: number;
  recommendations: ArtistRecommendation[];
  onIndexChange: (index: number) => void;
};

// Snap points fixes - on change juste l'index actif
const SNAP_POINTS = ['30%', '55%'];

export default function ExplorerBottomSheet({ selectedVenue, selectedStore, onClose, venueCount, storeCount, onIndexChange }: Readonly<Props>) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { recommendations, loading } = useRecommendations();

  // Rouvre la sheet quand une venue est sélectionnée
  useEffect(() => {
    if (selectedVenue || selectedStore) {
      bottomSheetRef.current?.snapToIndex(1);
    } else {
      bottomSheetRef.current?.snapToIndex(0);
    }
  }, [selectedVenue, selectedStore]);

  function ArtistCardSkeleton() {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true })
        ])
      );
      anim.start();
      return () => anim.stop();
    }, []);

    return (
      <Animated.View style={[styles.skeletonCard, { opacity }]}>
        <View style={styles.skeletonImage} />
        <View style={styles.skeletonLine}/>
        <View style={[styles.skeletonLine, { width: '60%' }]}/>
      </Animated.View>
    );
  }

  function openMaps() {
    if (!selectedVenue) return;
    const url = `maps://app?daddr=${selectedVenue.latitude},${selectedVenue.longitude}`;
    Linking.openURL(url).catch(() => {
      // Fallback Google Maps
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${selectedVenue.latitude},${selectedVenue.longitude}`);
    });
  }

  function handleClose() {
    onClose();
    bottomSheetRef.current?.snapToIndex(0);
  }

  function renderContent() {
    if (selectedStore) {
      return (
        <>
          <View style={styles.venueHeader}>
            <View style={[styles.venueIcon, { backgroundColor: 'rgba(167,139,250,0.15)'}]}>
              <Text style={styles.venueIconText}>💿</Text>
            </View>
            <View style={styles.venueTitleBlock}>
              <Text style={styles.venueName}>{selectedStore.name}</Text>
              <Text style={[styles.venueType, { color: '#a78bfa' }]}>Disquaire</Text>
            </View>
          </View>

          <View style={styles.divider}/>

          {selectedStore.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>{selectedStore.address}</Text>
            </View>
          )}

          {selectedStore.schedule && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🕐</Text>
              <Text style={styles.infoText}>{selectedStore.schedule}</Text>
            </View>
          )}

          {selectedStore.website && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🌐</Text>
              <Pressable onPress={() => Linking.openURL(selectedStore.website!)}>
                <Text style={[styles.infoText, { color: '#a78bfa' }]}>{selectedStore.website}</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.btnRow}>
            <Pressable style={styles.btnSecondary} onPress={() => {
              Linking.openURL(`maps://app?daddr=${selectedStore.latitude},${selectedStore.longitude}`);
            }}>
              <Text style={styles.btnSecondaryText}>Itinéraire</Text>
            </Pressable>
          </View>
        </>
      );
    }

    if (selectedVenue) {
      return (
        <>
          <View style={styles.venueHeader}>
            <View style={styles.venueIcon}>
              <Text style={styles.venueIconText}>🎵</Text>
            </View>
            <View style={styles.venueTitleBlock}>
              <Text style={styles.venueName}>{selectedVenue.name}</Text>
              <Text style={styles.venueType}>Salle de concert</Text>
            </View>
          </View>

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
      );
    }

    return (
      <>
        <SearchBar />
        {(loading || recommendations.length > 0) && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 16}]}> Recommandés pour toi</Text>
            <ScrollView 
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.artistsScroll}
              contentContainerStyle={{ gap: 10, paddingRight: 16 }}
              >
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => <ArtistCardSkeleton key={i} />)
                  : recommendations.map(artist => (
                    <ArtistRecommendationCard
                      key={artist.name}
                      artist={artist}
                      onPress={() => router.push('/(tabs)/screens/concerts')}
                    />
                ))}
              </ScrollView>
          </>
        )}
        <Text style={styles.sectionLabel}>Explorer par catégorie</Text>
        <View style={styles.categories}>
        {[
          { icon: '🎵', label: 'Événements', count: `${venueCount} lieux` },
          { icon: '💿', label: 'Disquaires', count: `${storeCount} autour` },
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
    )
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={SNAP_POINTS}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}  
      enablePanDownToClose={false}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      onChange={(index) => {
        onIndexChange(index);
        if (index === -1) onClose();
      }}
    >
      <BottomSheetView style={styles.content}>
        {(selectedVenue || selectedStore) && (
          <TouchableOpacity
            onPress={() => {
              console.log('🔴 close pressed');
              handleClose();
            }}
            style={styles.closeBtnAbsolute}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        )}

        {renderContent()}
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
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    height: 24,
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
    right: 0,
    top: -2,
    width: 28,
    height: 28,
    backgroundColor: '#1e1e1e',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    fontSize: 12,
    color: '#555555',
  },
  closeBtnAbsolute: {
    position: 'absolute',
    top: 0,
    right: 16,
    width: 28,
    height: 28,
    backgroundColor: '#1e1e1e',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
  artistsScroll: {
    marginBottom: 16,
  },
  venueTitleBlock: {
    flex: 1,
  },
  skeletonCard: {
    width: 120,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    padding: 8,
  },
  skeletonImage: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    marginBottom: 8,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 4,
    backgroundColor: '#2a2a2a',
    marginBottom: 4,
  }
});