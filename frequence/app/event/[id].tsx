import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  Image,
  Share,
  Modal,
} from 'react-native';
import { useEffect, useState, useMemo, useRef } from 'react';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { Feather } from '@expo/vector-icons';

import { supabase } from '../../lib/services/supabase';
import type { EventDetail } from '../../lib/types/event';
import { useTheme } from '../../lib/theme/ThemeContext';
import { ThemeColors } from '../../lib/theme/tokens';

import VenueMiniMap from '../../lib/components/MiniMap';
import FriendsGoingRow from '../../lib/components/FriendsGoingRow';
import ShareStoryCard from '../../lib/components/ShareStoryCard';

import { useEventInterest } from '../../lib/hooks/events/useEventInterest';

import { formatPrice } from '../../lib/utils/formatPrice';
import { addEventToCalendar } from '../../lib/utils/addToCalendar';
import { isExpoGo } from '../../lib/utils/runtime';
import { getCategoryLabel } from '../../lib/utils/eventCategory';

export default function EventDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { status: interest, loading: interestLoading, setInterest } = useEventInterest(id);
  const storyRef = useRef<View>(null);
  const [storyImageReady, setStoryImageReady] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [addingToCalendar, setAddingToCalendar] = useState(false);

  const [imageOpen, setImageOpen] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let cancelled = false;

    async function fetchEvent() {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id, name, starts_at, image_url, ticket_link, source, category, sold_out, price_min, currency,
          venues (id, name, address, latitude, longitude),
          artists (id, name, image_url),
          event_genres ( genres ( name ) )
        `)
        .eq('id', id)
        .single();

      if (cancelled) return;

      if (error) console.error(error);
      else setEvent(data as unknown as EventDetail);
      setLoading(false);
    }

    setEvent(null);
    setLoading(true);
    setStoryImageReady(false);

    fetchEvent();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleInterest(status: 'interested' | 'going') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/(auth)/login');
      return;
    }

    await setInterest(status);
  }

  async function handleShare() {
    if (!event || sharing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSharing(true);

    try {
      const canShareImage = await Sharing.isAvailableAsync();
      // Si l'événement a une image, on attend qu'elle soit chargée dans la carte
      const imageReady = !event.image_url || storyImageReady;

      if (canShareImage && imageReady) {
        const uri = await captureRef(storyRef, {
          format: 'png',
          quality: 1,
          width: 1080,
          height: 1920,
        });
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: 'Partager cet événement',
        });
      } else {
        await shareAsText();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSharing(false);
    }
  }

  async function shareAsText() {
    if (!event) return;
    
    try {
      await Share.share({
        message: `${event.name} · ${event.starts_at ? formatDateShort(event.starts_at) : ''}${
          event.venues?.name ?` · ${event.venues.name}` : ''
        }`,
      });
    } catch (e) {
      console.error(e);
    } 
  }

  async function handleAddToCalendar() {
    if (!event?.starts_at || addingToCalendar) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAddingToCalendar(true);

    try {
      const saved = await addEventToCalendar({
        title: event.name,
        startsAt: event.starts_at,
        venueName: event.venues?.name,
        address: event.venues?.address,
        ticketLink: event.ticket_link,
      });
      if (saved) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingToCalendar(false);
    }
  }


  function formatDateShort(dateStr: string) {
    const date = new Date(dateStr);
    const datePart = date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
    });
    const capitalized = datePart.charAt(0).toUpperCase() + datePart.slice(1);
    const timePart = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
      return `${capitalized} · ${timePart}`;
  }

    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )
    }

    if (!event) {
      return (
        <View style={styles.center}>
            <Text style={styles.empty}>Événement introuvable</Text>
        </View>
      );
    }

  const category = getCategoryLabel(event.category);
  const lineup: { name: string; role?: string }[] | undefined = (event as any).lineup;
  const genreNames = (event.event_genres ?? [])
    .map((eg) => eg.genres?.name)
    .filter((name): name is string => Boolean(name));

  const priceLabel = formatPrice(event.price_min, event.currency);
    
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={styles.backBtn}
          hitSlop={8}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/screens/home')
          }}
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>
      </View>
  
      <ScrollView showsVerticalScrollIndicator={false}>
        {/*Hero*/}
        <View style={styles.hero}>
          {event.image_url ? (
            <Pressable onPress={() => setImageOpen(true)} style={styles.heroImage}>
              <Image 
                source={{ uri: event.image_url}}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <View style={styles.heroExpand}>
                <Feather name="maximize-2" size={14} color="#fff" />
              </View>
            </Pressable>
          ) : (
            <View style={styles.heroPlaceholder} />
          )}
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrow}>{category.toUpperCase()}</Text>
            {event.sold_out && (
              <View style={styles.soldOutBadge}>
                <Text style={styles.soldOutText}>COMPLET</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>{event.name}</Text>

          {/* Infos */}
          {(event.starts_at || event.venues?.name) && (
            <Text style={styles.meta}>
                {event.starts_at ? formatDateShort(event.starts_at) : ''}
                {event.starts_at && event.venues?.name ? ' · ' : ''}
                {event.venues?.name ?? ''}
            </Text>
          )}

          {genreNames.length > 0 && (
            <View style={styles.genresRow}>
              {genreNames.map((genre) => (
                <View key={genre} style={styles.genreChip}>
                  <Text style={styles.genreChipText}>{genre}</Text>
                </View>
              ))}
            </View>
          )}

          {priceLabel && <Text style={styles.price}>{priceLabel}</Text>}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.pillBtn, interest === 'interested' && styles.pillBtnActive]}
              onPress={() => handleInterest('interested')}
              disabled={interestLoading}
            >
              <Text 
                style={[
                  styles.pillBtnText,
                  interest === 'interested' && styles.pillBtnTextActive
                ]}
              >
                {interest === 'interested' ? '⭐ Intéressé' : 'Je suis intéressé'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.pillBtn, interest === 'going' && styles.pillBtnActive]}
              onPress={() => handleInterest('going')}
              disabled={interestLoading}    
            >
              <Text
                style={[
                  styles.pillBtnText,
                  interest === 'going' && styles.pillBtnTextActive,
                ]}
              >
                {interest === 'going' ? '✅ J\'y vais' : 'J\'y vais'}
              </Text>
            </Pressable>
          </View>
          <View style={styles.secondaryRow}>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
              onPress={handleShare}
              disabled={sharing}
            >
              {sharing ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Feather name="share" size={15} color={colors.text} />
              )}
              <Text style={styles.secondaryBtnText}>Partager</Text>
            </Pressable>

            {event.starts_at && !isExpoGo && (
              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
                onPress={handleAddToCalendar}
                disabled={addingToCalendar}
              >
                <Feather name="calendar" size={15} color={colors.text} />
                <Text style={styles.secondaryBtnText}>Calendrier</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.divider} />

          {/* À l'affiche */}
          {lineup && lineup.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>À l'affiche</Text>
              <Text style={styles.lineupText}>
                {lineup
                  .map((a) => (a.role ? `${a.role}: ${a.name}`: a.name))
                  .join(', ')}
              </Text>
              <View style={styles.divider} />
            </>
          )}
          
          {/* Qui y va */}
          <Text style={styles.sectionTitle}>Qui y va</Text>
          <FriendsGoingRow eventId={id} />

          <View style={styles.divider} />

          {/* Lieu */}
          {event.venues && (
            <>
              <Text style={styles.sectionTitle}>Lieu</Text>
              <Text style={styles.venueName}>{event.venues.name}</Text>
              {event.venues.address && (
                <Text style={styles.venueAddress}>{event.venues.address}</Text>
              )}
              <View style={styles.mapWrap}>
                <VenueMiniMap venue={event.venues} />
              </View>
            </>
          )}
      </View>

        {/* Padding pour le bouton fixe */}
        <View style= {{ height: 100}} />
      </ScrollView>

      {/* Bouton ticket fixe */}
      {event.ticket_link && (
        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.btnTicket, event.sold_out && styles.btnTicketSoldOut]}
            onPress={() => Linking.openURL(event.ticket_link!)}
          >
            <Text style={[styles.btnTicketText, event.sold_out && styles.btnTicketTextSoldOut]}>
              {event.sold_out ? 'Complet · Voir sur DICE →' : 'Acheter des billets →'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Visionneuse plein écran de l'image */}
      {event.image_url && (
        <Modal
          visible={imageOpen}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setImageOpen(false)}
        >
          <Pressable style={styles.viewerBackdrop} onPress={() => setImageOpen(false)}>
            <Image 
              source={{ uri: event.image_url }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          </Pressable>
          <Pressable
            style={[styles.viewerClose, { top: insets.top + 12 }]}
            onPress={() => setImageOpen(false)}
            hitSlop={10}
          >
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
        </Modal>
      )}


      {/* Carte story, dessinée hors écran pour être capturée */}
      <View style={styles.offscreen} pointerEvents="none">
        <ShareStoryCard
          ref={storyRef}
          title={event.name}
          category={category}
          dateLabel={event.starts_at ? formatDateShort(event.starts_at) : ''}
          venueName={event.venues?.name ?? null}
          genres={genreNames}
          imageUrl={event.image_url}
          onImageLoaded={() => setStoryImageReady(true)}
        />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    color: colors.textMuted,
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: colors.bg,
  },
  hero: {
    height: 200,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.divider,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backArrow: {
    color: colors.text,
    fontSize: 16,
  },
  backLabel: {
    color: colors.textMuted,
    fontSize: 15,
  },
  content: {
    padding: 20,
    paddingTop: 28,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center', 
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 6,
  },
  meta: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  genreChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  genreChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  pillBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnActive: {
    backgroundColor: colors.accentSoftBg,
  },
  pillBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  pillBtnTextActive: {
    color: colors.accent,
  },
  lineupText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  venueName: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  venueAddress: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
  },
  mapWrap: {
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  btnTicket: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  btnTicketText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.bg,
  },
  soldOutBadge: { 
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 100,
    backgroundColor: colors.text,
  },
  soldOutText: {
    fontSize: 10,
    fontWeight: '700', 
    letterSpacing: 1,
    color: colors.bg
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: -14,
    marginBottom: 20
  },
  btnTicketSoldOut: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider
  },
  btnTicketTextSoldOut: {
    color: colors.textMuted,
  },
  offscreen: {
    position: 'absolute',
    top: 0,
    left: -10000,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  secondaryBtnPressed: {
    opacity: 0.7,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  heroExpand: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  viewerClose: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  }
})
};