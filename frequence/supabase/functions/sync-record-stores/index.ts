import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_PLACES_KEY = Deno.env.get('GOOGLE_PLACES_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Zones de Paris à couvrir (centre + arrondissements)
const PARIS_ZONES = [
  { lat: 48.8566, lon: 2.3522 }, // Centre
  { lat: 48.8700, lon: 2.3300 }, // Nord
  { lat: 48.8400, lon: 2.3700 }, // Sud-Est
  { lat: 48.8800, lon: 2.3800 }, // Nord-Est
];

async function fetchZone(lat: number, lon: number): Promise<any[]> {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=5000&keyword=disquaire+vinyle&key=${GOOGLE_PLACES_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results ?? [];
}

Deno.serve(async () => {
  try {
    console.log('💿 Fetching record stores via Google Places...');

    // Récupérer toutes les zones et dédupliquer par place_id
    const allPlaces = new Map<string, any>();

    for (const zone of PARIS_ZONES) {
      const results = await fetchZone(zone.lat, zone.lon);
      console.log(`✅ Zone ${zone.lat},${zone.lon}: ${results.length} stores`);
      for (const place of results) {
        allPlaces.set(place.place_id, place);
      }
      // Respecter le rate limit Google
      await new Promise(r => setTimeout(r, 200));
    }

    console.log(`📍 Total unique stores: ${allPlaces.size}`);

    let success = 0;
    let failed = 0;

    for (const place of allPlaces.values()) {
      const { error } = await supabase
      .from("record_stores")
      .upsert(
        {
          google_place_id: place.place_id,
          name: place.name,
          address: place.vicinity ?? null,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          schedule: place.opening_hours
            ? (place.opening_hours.open_now ? "Ouvert maintenant" : "Fermé")
            : null,
          website: null,
        },
        {
          onConflict: "google_place_id",
        }
      );

      if (error) {
        console.error(`❌ Failed: ${place.name}`, error.message);
        failed++;
      } else {
        console.log(`✅ ${place.name}`);
        success++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, stats: { total: allPlaces.size, success, failed} }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Sync failed:', error);
    return new Response(
    JSON.stringify({ success: false, error: String(error)}),
    { status: 500, headers: { 'Content-Type': 'application/json '}}
  );
  }
});