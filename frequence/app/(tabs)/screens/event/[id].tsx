import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/services/supabase';

type EventDetail = {
  id: string;
  name: string;
  starts_at: string | null;
  image_url: string | null;
  ticket_link: string | null;
  source: string | null;
  venues: {
    id: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  artists: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;
};

type InterestStatus = 'interested' | 'going' | null;

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [interest, setInterest] = useState<InterestStatus>(null);
  const [interestLoading, setInterestLoading] = useState(false);
  
  useEffect(() => {
    async function fetchEvent() {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id, name, starts_at, image_url, ticket_link, source,
          venues (id, name, address, latitude, longitude),
          artists (id, name, image_url)
        `)
        .eq('id', id)
        .single();

      if (error) console.error(error);
      else setEvent(data as unknown as EventDetail);
      setLoading(false);
    }

    async function fetchInterest() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('interests')
        .select('status')
        .eq('user_id', user.id)
        .eq('event_id', id)
        .single();

      if (data) setInterest(data.status as InterestStatus);
    }

    fetchEvent();
    fetchInterest();
  }, [id]);

  async function handleInterest(status: InterestStatus) {
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

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#a78bfa" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Événement introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <View style={styles.heroOverlay} />

          <Pressable style={styles.backBtn} onPress={() => router.push('/(tabs)/screens/concerts')}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>

          { event.source && (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceBadgeText}>
                {event.source.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          <Text style={styles.title}>{event.name}</Text>
          {event.artists && (
            <Text style={styles.artist}>{event.artists.name}</Text>
          )}

          {/* Infos */}
          {event.starts_at && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Text>📅</Text>
              </View>
              <View>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>
                  {formatDate(event.starts_at)}
                </Text>
              </View>
            </View>  
          )}

          {event.venues && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Text>📍</Text>
              </View>
              <View style={{ flex: 1}}>
                <Text style={styles.infoLabel}>Lieu</Text>
                <Text style={styles.infoValue}>{event.venues.name}</Text>
                {event.venues.address && (
                  <Text style={styles.infoMeta}>{event.venues.address}</Text>
                )} 
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Statut */}
          <Text style={styles.sectionTitle}>Ton statut</Text>
          <View style={styles.interestRow}>
          <Pressable
              style={[
                styles.btnInterest,
                interest === 'interested' && styles.btnInterestActive,
              ]}
              onPress={() => handleInterest('interested')}
              disabled={interestLoading}
            >
              <Text
                style={[
                  styles.btnInterestText,
                  interest === 'interested' && styles.btnInterestTextActive,
                ]}
              >
                ⭐ Intéressé
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.btnInterest,
                interest === 'going' && styles.btnInterestActive,
              ]}
              onPress={() => handleInterest('going')}
              disabled={interestLoading}
            >
              <Text
                style={[
                  styles.btnInterestText,
                  interest === 'going' && styles.btnInterestTextActive,
                ]}
              >
                ✅ J'y vais
              </Text>
            </Pressable>
          </View>

          <View style={styles.divider} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  center: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    color: '#555555',
    fontSize: 13,
  },
  hero: {
    height: 320,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e1e1e',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'transparent',
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    width: 36,
    height: 36,
    backgroundColor: 'rgba(15,15,15,0.7)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    color: '#e5e5e5',
    fontSize: 16,
  },
  sourceBadge: {
    position: 'absolute',
    top: 52,
    right: 16,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.5)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  sourceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a78bfa',
    letterSpacing: 0.5,
  },
  content: {
    padding: 20,
    paddingTop: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: '#e5e5e5',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 6,
  },
  artist: {
    fontSize: 14,
    color: '#a78bfa',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  infoIcon: {
    width: 32, 
    height: 32,
    backgroundColor: '#171717',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: '#3a3a3a',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: '#e5e5e5',
  },
  infoMeta: {
    fontSize: 12,
    color: '#555555',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#1e1e1e',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 11,
    color: '#3a3a3a',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  interestRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnInterest: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    backgroundColor: '#171717',
    alignItems: 'center',
  },
  btnInterestActive: {
    borderColor: '#a78bfa',
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
  },
  btnInterestText: {
    fontSize: 13,
    color: '#555555',
  },
  btnInterestTextActive: {
    color: '#a78bfa',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#0f0f0f',
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
  },
  btnTicket: {
    backgroundColor: '#a78bfa',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  btnTicketText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f0f0f',
  },
});