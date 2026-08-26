import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APIFY_TOKEN = Deno.env.get('APIFY_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface DiceLocation {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
}

interface DiceEventImages {
  landscape?: string | null;
  portrait?: string | null;
  square?: string | null;
  brand?: string | null;
}

interface DiceTicketType {
  price?: number | null;
  total_price?: number | null;
  currency?: string | null;
  [key: string]: unknown;
}

interface DiceScheduleEntry {
  details?: string | null;
  time?: string | null;
}
 
interface DiceArtistObject {
  name?: string | null;
  artist_name?: string | null;
  title?: string | null;
  image?: string | null;
  image_url?: string | null;
  is_headliner?: boolean;
  headliner?: boolean;
  [key: string]: unknown;
}
 
type DiceArtistEntry = string | DiceArtistObject;

interface DiceEvent {
  id: string;
  name: string;
  date: string | null;
  date_end?: string | null;
  timezone?: string | null;
  status?: string | null; // 'on-sale' | 'off-sale' | 'cancelled'
  sold_out?: boolean;
  venue?: string | null;
  venues?: { id: string; name: string; city?: string; url?: string }[];
  location?: DiceLocation | null;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  genre_tags?: string[];
  type_tags?: string[];
  artists?: DiceArtistsEntry[];
  detailed_artists?: DiceArtistObject[]; // source la plus fiable quand présente
  lineup?: DiceScheduleEntry[]; // programme horaire, pas des artistes — jamais utilisé pour l'extraction
  ticket_types?: DiceTicketType[];
  event_images?: DiceEventImages | null;
  url: string;
}

async function upsertVenue(event: DiceEvent): Promise<string | null> {
  const venueName = event.venue ?? event.venues?.[0]?.name ?? null;
  if (!venueName) return null;

  const loc = event.location;
  const address = loc ? 
    [loc.street, loc.city, loc.zip, loc.country].filter(Boolean).join(', ') || null : null;

  const { data, error } = await supabase 
    .from('venues')
    .upsert({
      name: venueName,
      address,
      latitude: loc?.lat ?? null,
      longitude: loc?.lng ?? null,
      type: event.type_tags?.some(t => t.startsWith('music:')) ? 'club' : 'venue',
    }, { onConflict: 'name' })
    .select('id')
    .single();

  if (error) {
    console.error(`❌ Venue upsert failed for ${venueName}:`, error.message);
    return null;
  }

  return data?.id ?? null;
}


// `lineup` mélange du bruit de planning ("Ouverture des portes") avec de
// vrais noms d'artistes quand ni `artists` ni `detailed_artists` ne sont
// peuplés. On filtre le bruit connu, puis on prend l'horaire le plus tardif
// — convention : la tête d'affiche joue en dernier. Sans horaire exploitable
// sur aucune entrée, on garde la dernière du tableau (ordre chronologique
// suppose la même convention).
const SCHEDULE_NOISE = /ouverture|portes|doors?\s*open|^fin$|^end$|clôture|closing/i;
function parseTimeToMinutes(time?: string | null): number | null {
  if (!time) return null;
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  // Les club nights débordent souvent après minuit (1h-6h) — décalé de 24h
  // pour rester après la soirée dans l'ordre chronologique (20h → ... → 2h).
  if (hour < 7) hour += 24;
  return hour * 60 + minute;
}

function extractHeadlinerFromLineup(event: DiceEvent): { name: string; image: string | null } | null {
  const candidates = (event.lineup ?? []).filter(
    entry => entry.details && !SCHEDULE_NOISE.test(entry.details)
  );
  if (candidates.length === 0) return null;
 
  const sorted = [...candidates].sort(
    (a, b) => (parseTimeToMinutes(b.time) ?? -1) - (parseTimeToMinutes(a.time) ?? -1)
  );
  const headliner = sorted[0];
  if (!headliner?.details) return null;
 
  return { name: headliner.details, image: null };
}
 
// Priorité à `detailed_artists` (structuré, expose `headliner`), puis
// `artists` (format variable — string ou objet selon l'event), puis en
// dernier repli `lineup` filtré (cf. extractHeadlinerFromLineup). Retourne
// null si l'event n'a genuinement aucun artiste billé (soirées à thème,
// club nights sans tête d'affiche) — résultat normal, pas un échec.
function extractHeadliner(event: DiceEvent): { name: string; image: string | null } | null {
  const detailed = event.detailed_artists ?? [];
  if (detailed.length > 0) {
    const headliner = detailed.find(a => a.is_headliner || a.headliner) ?? detailed[0];
    const name = headliner.name ?? headliner.artist_name ?? headliner.title ?? null;
    if (name) {
      return { name, image: headliner.image ?? headliner.image_url ?? null };
    }
  }
 
  for (const entry of event.artists ?? []) {
    const name = typeof entry === 'string'
      ? entry
      : (entry.name ?? entry.artist_name ?? entry.title ?? null);
    if (name) return { name, image: null };
  }
 
  return extractHeadlinerFromLineup(event);
}

async function upsertArtist(headliner: { name: string; image: string | null}): Promise<string | null> {
  const { data, error } = await supabase
    .from('artists')
    .upsert({
      name: headliner.name,
      image_url: headliner.image,
    }, { onConflict: 'name' })
    .select('id')
    .single();

  if (error) {
    console.error(`❌ Artist upsert failed for ${headliner.name}:`, error.message);
    return null;
  }

  return data?.id ?? null;
}

function extractImageUrl(event: DiceEvent): string | null {
  const images = event.event_images;
  if (!images) return null;
  return images.landscape ?? images.square ?? images.portrait ?? images.brand ?? null;
}

async function upsertEvent(
  event: DiceEvent,
  venueId: string | null,
  artistId: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from('events')
    .upsert({
      name: event.name,
      starts_at: event.date ?? null,
      venue_id: venueId,
      artist_id: artistId,
      style: event.genre_tags && event.genre_tags.length > 0 ? event.genre_tags : null,
      image_url: extractImageUrl(event),
      ticket_link: event.url,
      source: 'dice',
    }, { onConflict: 'name,starts_at'});

  if (error) {
    console.error(`❌ Event upsert failed for ${event.name}:`, error.message);
    return false;
  }

  return true;
}


async function fetchDiceEvents(): Promise<DiceEvent[]> {

  const res = await fetch(
    `https://api.apify.com/v2/acts/hoholabs~dicefm-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=200`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryType: 'browse',
        city: 'Paris',
        featured: false,
        soldOut: false,
        status: '',
        sort: '',
        page: 1,
        pageSize: 50,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Apify API error: ${res.status} ${res.statusText}`);
  }

  const rawText = await res.text();
  const events = JSON.parse(rawText);
 
  // Si le run retombe à 0 malgré tout, ce log donne la forme exacte de la
  // réponse (ex: un item unique {resolved:..., data:[]} au lieu d'un array
  // d'events) pour comprendre pourquoi sans redéployer.
  if (events.length === 0) {
    console.log('⚠️ 0 events reçus. Réponse brute Apify:', rawText.slice(0, 2000));
  }
  return events;
}

function isPartyEvent(event: DiceEvent): boolean {
  return (event.genre_tags ?? []).some(tag => tag.startsWith('party:'));
}

Deno.serve(async () => {
  const startTime = Date.now();
  const stats = { total: 0, success: 0, failed: 0, skippedNoArtist: 0, skippedParty: 0};

  try {
    const events = await fetchDiceEvents();
    stats.total = events.length;

    // Debug : confirme le vrai schéma de lineup/artists sur ton premier run,
    // puis retire ce log une fois extractHeadliner() validé.
    if (events[0]) {
      console.log('📦 Exemple d\'event brut:', JSON.stringify(events[0], null, 2));
    }

    for (const event of events) {
      if (isPartyEvent(event)) {
        stats.skippedParty++;
        continue;
      }
      
      try {
        // 1. Upsert venue
        const venueId = await upsertVenue(event);

        // 2. Upsert headliner (ou premier performer)
        const headliner = extractHeadliner(event);
        if (!headliner) stats.skippedNoArtist++;

        const artistId = headliner ? await upsertArtist(headliner) : null;

        // 3. Upsert event
        const success = await upsertEvent(event, venueId, artistId);

        if (success) {
          stats.success++;
        } else {
          stats.failed++;
        }
      } catch (err) {
        stats.failed++;
        console.error(`❌ Failed to process event ${event.name}:`, err);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return new Response(
      JSON.stringify({
        success: true,
        duration: `${duration}s`,
        stats,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) { 
    console.error(' Sync failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json'} }
    );
  }
});