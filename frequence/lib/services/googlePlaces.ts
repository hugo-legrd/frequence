const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;
const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

export type RecordStore = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  opening_hours: string | null;
  website: string | null;
  rating: number | null;
  open_now: boolean | null;
};

export async function fetchRecordStores(
  lat: number,
  lon: number,
  radius = 5000
): Promise<RecordStore[]> {
  const url = `${BASE_URL}/nearbysearch/json?location=${lat},${lon}&radius=${radius}&keyword=disquaire+vinyle&key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK') {
    throw new Error(`Google Places error: ${data.status}`);
  }

  return data.results.map((place: any) => ({
    id: place.place_id,
    name: place.name,
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    address: place.vicinity ?? null,
    opening_hours: null, // nécessite un appel Place Details séparé
    website: null,
    rating: place.rating ?? null,
    open_now: place.opening_hours?.open_now ?? null,
  }));
}