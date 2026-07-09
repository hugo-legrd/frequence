import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APIFY_TOKEN = Deno.env.get('APIFY_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface DicePerformer {
  name: string | null;
  artistId: string;
  image: string | null;
  isHeadliner: boolean;
}

interface DiceEvent {
  eventId: string;
  eventTitle: string;
  description: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
  venueName: string | null;
  venueAddress: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  lowestPrice: number | null;
  currency: string | null;
  status: string | null;
  eventType: string | null;
  performers: DicePerformer[];
  coverUrl: string | null;
  eventUrl: string;
  tags: string[];
}

async function upsertVenue(event: DiceEvent): Promise<string | null> {
  if (!event.venueName) return null;

  const { data, error } = await supabase 
    .from('venues')
    .upsert({
      name: event.venueName,
      address: event.venueAddress ?? null,
      latitude: event.latitude ?? null,
      longitude: event.longitude ?? null,
      type: event.eventType === 'dj' ? 'club' : 'venue',
    }, { onConflict: 'name' })
    .select('id')
    .single();

  if (error) {
    console.error(`❌ Venue upsert failed for ${event.venueName}:`, error.message);
    return null;
  }

  return data?.id ?? null;
}

async function upsertArtist(performer: DicePerformer): Promise<string | null> {
  if (!performer.name) return null;

  const { data, error } = await supabase
    .from('artists')
    .upsert({
      name: performer.name,
      image_url: performer.image ?? null,
    }, { onConflict: 'name' })
    .select('id')
    .single();

  if (error) {
    console.error(`❌ Artist upsert failed for ${performer.name}:`, error.message);
    return null;
  }

  return data?.id ?? null;
}

async function upsertEvent(
  event: DiceEvent,
  venueId: string | null,
  artistId: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from('events')
    .upsert({
      name: event.eventTitle,
      starts_at: event.startDateTime ?? null,
      venue_id: venueId,
      artist_id: artistId,
      image_url: event.coverUrl ?? null,
      ticket_link: event.eventUrl,
      source: 'dice',
    }, { onConflict: 'name,starts_at'});

  if (error) {
    console.error(`❌ Event upsert failed for ${event.eventTitle}:`, error.message);
    return false;
  }

  return true;
}


async function fetchDiceEvents(): Promise<DiceEvent[]> {
  console.log('🎵 Fetching DICE events via Apify...');

  const res = await fetch(
    `https://api.apify.com/v2/acts/6fYWeAO7tYISdkrHr/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=200`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'Paris',
        maxResults: 20,
        scrapeEventDetails: true,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Apify API error: ${res.status} ${res.statusText}`);
  }

  const events = await res.json();
  console.log(`✅ ${events.length} events fetched from DICE`);
  return events;
}

Deno.serve(async () => {
  const startTime = Date.now();
  const stats = { total: 0, success: 0, failed: 0};

  try {
    const events = await fetchDiceEvents();
    stats.total = events.length;

    for (const event of events) {
      try {
        // 1. Upsert venue
        const venueId = await upsertVenue(event);

        // 2. Upsert headliner (ou premier performer)
        const headliner = 
          event.performers?.find(p => p.isHeadliner && p.name) ??
          event.performers?.find(p => p.name) ??
          null;

        const artistId = headliner ? await upsertArtist(headliner) : null;

        // 3. Upsert event
        const success = await upsertEvent(event, venueId, artistId);

        if (success) {
          stats.success++;
          console.log(`✅ ${event.eventTitle}`);
        } else {
          stats.failed++;
        }
      } catch (err) {
        stats.failed++;
        console.error(`❌ Failed to process event ${event.eventTitle}:`, err);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n📊 Sync terminé en ${duration}s - ${stats.success}/${stats.total} events synced`);

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