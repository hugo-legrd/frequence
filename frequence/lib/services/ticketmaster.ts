import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';
const API_KEY = process.env.EXPO_PUBLIC_TICKETMASTER_API_KEY;

// Coordonnées centre de Paris
const PARIS_LAT = 48.8566;
const PARIS_LON = 2.3522;

export type TicketmasterEvent = {
  id: string;
  name: string;
  starts_at: string | null;
  image_url: string | null;
  ticket_link: string;
  venue: {
    name: string;
    address: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  artist: string | null;
  genres: string[];
};

function kmToDegrees(km: number): number {
  return km / 111; // 1 degré ≈ 111km
}

export async function fetchEvents(params?: {
  genre?: string;
  size?: number;
}): Promise<TicketmasterEvent[]> {
  const size = params?.size ?? 20;
  const genre = params?.genre;

  let url = `${BASE_URL}/events.json?apikey=${API_KEY}&classificationName=music&countryCode=FR&size=${size}&sort=date,asc`;
  if (genre) {
    url += `&classificationName=${encodeURIComponent(genre)}`;
  }


  const res = await fetch(url);
  const data = await res.json();

  const events = data._embedded?.events ?? [];

  return events.map((event: any) => {
    const venue = event._embedded?.venues?.[0];
    const attraction = event._embedded?.attractions?.[0];
    const image = event.images?.find(
      (img: any) => img.ratio === '16_9' && img.width > 500
    );

    return {
      id: event.id,
      name: event.name,
      starts_at: event.dates?.start?.dateTime ?? event.dates?.start?.localDate ?? null,
      image_url: image?.url ?? event.images?.[0]?.url ?? null,
      ticket_link: event.url,
      venue: venue
        ? {
            name: venue.name,
            address: venue.address?.line1 ?? null,
            city: venue.city?.name ?? null,
            latitude: parseFloat(venue.location?.latitude) || null,
            longitude: parseFloat(venue.location?.longitude) || null,
          }
        : null,
      artist: attraction?.name ?? null,
      genres: [
        event.classifications?.[0]?.genre?.name,
        event.classifications?.[0]?.subGenre?.name,
      ]
        .filter(Boolean)
        .filter((g: string) => g !== 'Other' && g !== 'Undefined'),
    };
  });
}