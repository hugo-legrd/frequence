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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../../../lib/services/supabase';
import type { EventDetail, InterestStatus } from '../../../../lib/types/event';
import VenueMiniMap from '../../../components/MiniMap';
import * as Haptics from 'expo-haptics';
import FriendsGoingRow from '../../../components/FriendsGoingRow';
import { useTheme } from '../../../../lib/theme/ThemeContext';
import { ThemeColors } from '../../../../lib/theme/tokens';

const CATEGORY_LABELS: Record<string, string> = {
  gig: 'Concert',
  dj: 'DJ Set',
}

function getCategoryLabel(style?: string[] | null): string {
  if (!style || style.length === 0) return 'Événement';
  const prefix = style[0]?.split(':')[0]?.toLowerCase();
  return CATEGORY_LABELS[prefix] ?? 'Événement';
}

export default function EventDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [interest, setInterest] = useState<InterestStatus>(null);
  const [interestLoading, setInterestLoading] = useState(false);
  
  useEffect(() => {
    let cancelled = false;

    async function fetchEvent() {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id, name, starts_at, image_url, ticket_link, source, style,
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

    async function fetchInterest() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from('interests')
        .select('status')
        .eq('user_id', user.id)
        .eq('event_id', id)
        .single();

      if (!cancelled) {
        setInterest(data ? (data.status as InterestStatus) : null);
      }
    }

    setEvent(null);
    setLoading(true);
    setInterest(null);

    fetchEvent();
    fetchInterest();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleInterest(status: InterestStatus) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/(auth)/login');
      return;
    }

    setInterestLoading(true);

    if (interest === status) {
      // Déselectionner
      await supabase
        .from('interests')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', id)
      setInterest(null);
     } else {
      // Sélectionner ou changer
      await supabase
        .from('interests')
        .upsert({ user_id: user.id, event_id: id, status });
      setInterest(status);
    }

    setInterestLoading(false);
  }

  async function handleShare() {
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

  const category = getCategoryLabel(event.style);
  const lineup: { name: string; role?: string }[] | undefined = (event as any).lineup;
  const genreNames = (event.event_genres ?? [])
    .map((eg) => eg.genres?.name)
    .filter((name): name is string => Boolean(name));
  console.log('Event: ', event);
  console.log('Genre Names: ', genreNames);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={styles.backBtn}
          hitSlop={8}
          onPress={() => router.push('/(tabs)/screens/concerts')}  
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>
      </View>
  
      <ScrollView showsVerticalScrollIndicator={false}>
        {/*Hero*/}
        <View style={styles.hero}>
          {event.image_url ? (
            <Image 
              source={{ uri: event.image_url}}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroPlaceholder} />
          )}
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          <Text style={styles.eyebrow}>{category.toUpperCase()}</Text>
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
            <Pressable style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>Partager</Text>
            </Pressable>
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
            style={styles.btnTicket}
            onPress={() => Linking.openURL(event.ticket_link!)}
          >
            <Text style={styles.btnTicketText}>Acheter des billets →</Text>
          </Pressable>
        </View>
      )}
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
  shareBtn: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
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
})
};